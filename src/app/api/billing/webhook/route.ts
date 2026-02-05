import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, PLAN_LIMITS } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { message: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { message: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { message: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { organizationId, planTier, storageSize, billingCycle } = session.metadata || {};

  if (!organizationId || !planTier || !storageSize || !billingCycle) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const limits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS][storageSize as keyof typeof PLAN_LIMITS.CORE];

  await db.organization.update({
    where: { id: organizationId },
    data: {
      planTier: planTier as "CORE" | "PRO" | "TEAM",
      storageSize: storageSize as "SMALL" | "MEDIUM" | "LARGE",
      billingCycle: billingCycle as "MONTHLY" | "ANNUAL",
      stripeSubscriptionId: session.subscription as string,
      maxItems: limits.items,
      maxUsers: limits.users,
      aiCreditsIncluded: limits.aiCredits,
      aiCredits: limits.aiCredits, // Reset credits on new subscription
      aiCreditsResetAt: getNextResetDate(billingCycle as "MONTHLY" | "ANNUAL"),
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { organizationId, planTier, storageSize, billingCycle } = subscription.metadata || {};

  if (!organizationId) {
    console.error("Missing organizationId in subscription metadata");
    return;
  }

  // Get current period end - use type assertion as Stripe's types may not be fully up-to-date
  const subData = subscription as unknown as { current_period_end?: number };
  const subscriptionEndsAt = subData.current_period_end
    ? new Date(subData.current_period_end * 1000)
    : null;

  // If plan details are in metadata, update them
  if (planTier && storageSize && billingCycle) {
    const limits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS][storageSize as keyof typeof PLAN_LIMITS.CORE];

    await db.organization.update({
      where: { id: organizationId },
      data: {
        planTier: planTier as "CORE" | "PRO" | "TEAM",
        storageSize: storageSize as "SMALL" | "MEDIUM" | "LARGE",
        billingCycle: billingCycle as "MONTHLY" | "ANNUAL",
        ...(subscriptionEndsAt && { subscriptionEndsAt }),
        maxItems: limits.items,
        maxUsers: limits.users,
        aiCreditsIncluded: limits.aiCredits,
      },
    });
  } else if (subscriptionEndsAt) {
    // Just update the subscription end date
    await db.organization.update({
      where: { id: organizationId },
      data: { subscriptionEndsAt },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { organizationId } = subscription.metadata || {};

  if (!organizationId) {
    console.error("Missing organizationId in subscription metadata");
    return;
  }

  // Downgrade to free tier
  await db.organization.update({
    where: { id: organizationId },
    data: {
      planTier: "CORE",
      storageSize: "SMALL",
      billingCycle: "MONTHLY",
      stripeSubscriptionId: null,
      subscriptionEndsAt: null,
      maxItems: PLAN_LIMITS.CORE.SMALL.items,
      maxUsers: PLAN_LIMITS.CORE.SMALL.users,
      aiCreditsIncluded: 0,
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Reset AI credits on successful payment
  const invoiceData = invoice as unknown as { subscription?: string };
  if (!invoiceData.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(invoiceData.subscription);
  const { organizationId, billingCycle } = subscription.metadata || {};

  if (!organizationId) return;

  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { aiCreditsIncluded: true },
  });

  if (!org) return;

  await db.organization.update({
    where: { id: organizationId },
    data: {
      aiCredits: org.aiCreditsIncluded,
      aiCreditsResetAt: getNextResetDate((billingCycle as "MONTHLY" | "ANNUAL") || "MONTHLY"),
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Could implement email notifications or account flags here
  console.log("Payment failed for invoice:", invoice.id);
}

function getNextResetDate(cycle: "MONTHLY" | "ANNUAL"): Date {
  const now = new Date();
  if (cycle === "ANNUAL") {
    return new Date(now.setFullYear(now.getFullYear() + 1));
  }
  return new Date(now.setMonth(now.getMonth() + 1));
}
