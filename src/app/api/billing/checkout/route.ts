import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, PLAN_PRICES, PLAN_LIMITS } from "@/lib/stripe";
import { z } from "zod";
import { isAdminRole } from "@/lib/utils";
import { safeJsonParse, badRequestResponse } from "@/lib/api-utils";

const checkoutSchema = z.object({
  planTier: z.enum(["CORE", "PRO", "TEAM"]),
  storageSize: z.enum(["SMALL", "MEDIUM", "LARGE"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only owners and admins can manage billing
    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { message: "Billing is not configured" },
        { status: 503 }
      );
    }

    const body = await safeJsonParse(req);
    if (!body) return badRequestResponse();
    const { planTier, storageSize, billingCycle } = checkoutSchema.parse(body);

    // Get the organization
    const organization = await db.organization.findUnique({
      where: { id: session.user.organizationId },
    });

    if (!organization) {
      return NextResponse.json({ message: "Organization not found" }, { status: 404 });
    }

    // Skip checkout for free tier
    if (planTier === "CORE" && storageSize === "SMALL") {
      // Just update the organization to free tier
      await db.organization.update({
        where: { id: organization.id },
        data: {
          planTier: "CORE",
          storageSize: "SMALL",
          billingCycle: "MONTHLY",
          maxItems: PLAN_LIMITS.CORE.SMALL.items,
          maxUsers: PLAN_LIMITS.CORE.SMALL.users,
          aiCredits: 0,
          aiCreditsIncluded: 0,
        },
      });
      return NextResponse.json({ success: true, free: true });
    }

    // Get the price ID
    const priceId = PLAN_PRICES[planTier][storageSize][billingCycle];

    // Create or get Stripe customer
    let customerId = organization.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: organization.name,
        metadata: {
          organizationId: organization.id,
        },
      });
      customerId = customer.id;

      await db.organization.update({
        where: { id: organization.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.AUTH_URL}/settings?billing=success`,
      cancel_url: `${process.env.AUTH_URL}/settings?billing=cancelled`,
      metadata: {
        organizationId: organization.id,
        planTier,
        storageSize,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          organizationId: organization.id,
          planTier,
          storageSize,
          billingCycle,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Checkout error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
