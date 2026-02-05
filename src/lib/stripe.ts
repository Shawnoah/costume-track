import Stripe from "stripe";

// Lazy-load Stripe to avoid build errors when env var is not set
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// Keep the export for backwards compatibility, but make it lazy
export const stripe = {
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
};

// Plan pricing IDs - these should be created in Stripe dashboard
export const PLAN_PRICES = {
  CORE: {
    SMALL: {
      MONTHLY: process.env.STRIPE_PRICE_CORE_SMALL_MONTHLY || "price_core_small_monthly",
      ANNUAL: process.env.STRIPE_PRICE_CORE_SMALL_ANNUAL || "price_core_small_annual",
    },
    MEDIUM: {
      MONTHLY: process.env.STRIPE_PRICE_CORE_MEDIUM_MONTHLY || "price_core_medium_monthly",
      ANNUAL: process.env.STRIPE_PRICE_CORE_MEDIUM_ANNUAL || "price_core_medium_annual",
    },
    LARGE: {
      MONTHLY: process.env.STRIPE_PRICE_CORE_LARGE_MONTHLY || "price_core_large_monthly",
      ANNUAL: process.env.STRIPE_PRICE_CORE_LARGE_ANNUAL || "price_core_large_annual",
    },
  },
  PRO: {
    SMALL: {
      MONTHLY: process.env.STRIPE_PRICE_PRO_SMALL_MONTHLY || "price_pro_small_monthly",
      ANNUAL: process.env.STRIPE_PRICE_PRO_SMALL_ANNUAL || "price_pro_small_annual",
    },
    MEDIUM: {
      MONTHLY: process.env.STRIPE_PRICE_PRO_MEDIUM_MONTHLY || "price_pro_medium_monthly",
      ANNUAL: process.env.STRIPE_PRICE_PRO_MEDIUM_ANNUAL || "price_pro_medium_annual",
    },
    LARGE: {
      MONTHLY: process.env.STRIPE_PRICE_PRO_LARGE_MONTHLY || "price_pro_large_monthly",
      ANNUAL: process.env.STRIPE_PRICE_PRO_LARGE_ANNUAL || "price_pro_large_annual",
    },
  },
  TEAM: {
    SMALL: {
      MONTHLY: process.env.STRIPE_PRICE_TEAM_SMALL_MONTHLY || "price_team_small_monthly",
      ANNUAL: process.env.STRIPE_PRICE_TEAM_SMALL_ANNUAL || "price_team_small_annual",
    },
    MEDIUM: {
      MONTHLY: process.env.STRIPE_PRICE_TEAM_MEDIUM_MONTHLY || "price_team_medium_monthly",
      ANNUAL: process.env.STRIPE_PRICE_TEAM_MEDIUM_ANNUAL || "price_team_medium_annual",
    },
    LARGE: {
      MONTHLY: process.env.STRIPE_PRICE_TEAM_LARGE_MONTHLY || "price_team_large_monthly",
      ANNUAL: process.env.STRIPE_PRICE_TEAM_LARGE_ANNUAL || "price_team_large_annual",
    },
  },
} as const;

// Plan limits
export const PLAN_LIMITS = {
  CORE: {
    SMALL: { items: 500, users: 1, aiCredits: 0 },
    MEDIUM: { items: 2000, users: 1, aiCredits: 0 },
    LARGE: { items: 5000, users: 1, aiCredits: 0 },
  },
  PRO: {
    SMALL: { items: 500, users: 3, aiCredits: 100 },
    MEDIUM: { items: 2000, users: 3, aiCredits: 250 },
    LARGE: { items: 5000, users: 3, aiCredits: 500 },
  },
  TEAM: {
    SMALL: { items: 500, users: -1, aiCredits: 200 }, // -1 = unlimited
    MEDIUM: { items: 2000, users: -1, aiCredits: 500 },
    LARGE: { items: 5000, users: -1, aiCredits: 1000 },
  },
} as const;

// Display pricing (in cents)
export const PLAN_PRICING = {
  CORE: {
    SMALL: { monthly: 0, annual: 0 }, // Free tier
    MEDIUM: { monthly: 1900, annual: 15900 }, // $19/mo or $159/yr
    LARGE: { monthly: 3900, annual: 32900 }, // $39/mo or $329/yr
  },
  PRO: {
    SMALL: { monthly: 2900, annual: 24900 }, // $29/mo or $249/yr
    MEDIUM: { monthly: 4900, annual: 41900 }, // $49/mo or $419/yr
    LARGE: { monthly: 7900, annual: 66900 }, // $79/mo or $669/yr
  },
  TEAM: {
    SMALL: { monthly: 9900, annual: 83900 }, // $99/mo or $839/yr
    MEDIUM: { monthly: 14900, annual: 126900 }, // $149/mo or $1269/yr
    LARGE: { monthly: 19900, annual: 169900 }, // $199/mo or $1699/yr
  },
} as const;

export type PlanTier = "CORE" | "PRO" | "TEAM";
export type StorageSize = "SMALL" | "MEDIUM" | "LARGE";
export type BillingCycle = "MONTHLY" | "ANNUAL";
