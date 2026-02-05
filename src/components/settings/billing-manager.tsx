"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CreditCard,
  Check,
  Sparkles,
  Users,
  Package,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface BillingManagerProps {
  currentPlan: {
    planTier: "CORE" | "PRO" | "TEAM";
    storageSize: "SMALL" | "MEDIUM" | "LARGE";
    billingCycle: "MONTHLY" | "ANNUAL";
    subscriptionEndsAt: string | null;
    maxItems: number;
    maxUsers: number;
    aiCredits: number;
    aiCreditsIncluded: number;
  };
  hasStripeCustomer: boolean;
}

const PLAN_PRICING = {
  CORE: {
    SMALL: { monthly: 0, annual: 0 },
    MEDIUM: { monthly: 19, annual: 159 },
    LARGE: { monthly: 39, annual: 329 },
  },
  PRO: {
    SMALL: { monthly: 29, annual: 249 },
    MEDIUM: { monthly: 49, annual: 419 },
    LARGE: { monthly: 79, annual: 669 },
  },
  TEAM: {
    SMALL: { monthly: 99, annual: 839 },
    MEDIUM: { monthly: 149, annual: 1269 },
    LARGE: { monthly: 199, annual: 1699 },
  },
};

const PLAN_FEATURES = {
  CORE: [
    "Inventory management",
    "Rental tracking",
    "Customer management",
    "Photo uploads",
    "Barcode scanning",
    "Customer portal",
  ],
  PRO: [
    "Everything in Core",
    "AI costume descriptions",
    "AI-powered search",
    "Up to 3 team members",
    "Priority support",
  ],
  TEAM: [
    "Everything in Pro",
    "Unlimited team members",
    "API access",
    "Custom branding",
    "Advanced analytics",
    "Dedicated support",
  ],
};

const STORAGE_LIMITS = {
  SMALL: 500,
  MEDIUM: 2000,
  LARGE: 5000,
};

export function BillingManager({ currentPlan, hasStripeCustomer }: BillingManagerProps) {
  const [selectedTier, setSelectedTier] = useState<"CORE" | "PRO" | "TEAM">(currentPlan.planTier);
  const [selectedSize, setSelectedSize] = useState<"SMALL" | "MEDIUM" | "LARGE">(currentPlan.storageSize);
  const [isAnnual, setIsAnnual] = useState(currentPlan.billingCycle === "ANNUAL");
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = PLAN_PRICING[selectedTier][selectedSize];
  const displayPrice = isAnnual ? price.annual : price.monthly;
  const isFree = selectedTier === "CORE" && selectedSize === "SMALL";
  const isCurrentPlan =
    selectedTier === currentPlan.planTier &&
    selectedSize === currentPlan.storageSize &&
    (isAnnual ? "ANNUAL" : "MONTHLY") === currentPlan.billingCycle;

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier: selectedTier,
          storageSize: selectedSize,
          billingCycle: isAnnual ? "ANNUAL" : "MONTHLY",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (data.free) {
        // Refresh the page for free tier
        window.location.reload();
      } else if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              Billing & Plans
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Manage your subscription and billing
            </CardDescription>
          </div>
          {hasStripeCustomer && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="border-zinc-700 text-zinc-300"
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Manage Billing
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
            {error}
          </div>
        )}

        {/* Current Plan Display */}
        <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-zinc-400 text-sm">Current Plan</span>
            <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">
              {currentPlan.planTier} - {currentPlan.storageSize}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Package className="w-4 h-4 mx-auto mb-1 text-zinc-500" />
              <p className="text-lg font-semibold text-zinc-200">{currentPlan.maxItems}</p>
              <p className="text-xs text-zinc-500">Max Items</p>
            </div>
            <div>
              <Users className="w-4 h-4 mx-auto mb-1 text-zinc-500" />
              <p className="text-lg font-semibold text-zinc-200">
                {currentPlan.maxUsers === -1 ? "∞" : currentPlan.maxUsers}
              </p>
              <p className="text-xs text-zinc-500">Team Members</p>
            </div>
            <div>
              <Sparkles className="w-4 h-4 mx-auto mb-1 text-zinc-500" />
              <p className="text-lg font-semibold text-zinc-200">
                {currentPlan.aiCredits}/{currentPlan.aiCreditsIncluded}
              </p>
              <p className="text-xs text-zinc-500">AI Credits</p>
            </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm ${!isAnnual ? "text-zinc-200" : "text-zinc-500"}`}>
            Monthly
          </span>
          <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
          <span className={`text-sm ${isAnnual ? "text-zinc-200" : "text-zinc-500"}`}>
            Annual
            <Badge variant="outline" className="ml-2 text-green-400 border-green-600/30 text-xs">
              Save 30%
            </Badge>
          </span>
        </div>

        {/* Plan Selection */}
        <RadioGroup
          value={selectedTier}
          onValueChange={(v) => setSelectedTier(v as typeof selectedTier)}
          className="grid grid-cols-3 gap-4"
        >
          {(["CORE", "PRO", "TEAM"] as const).map((tier) => (
            <Label
              key={tier}
              htmlFor={tier}
              className={`cursor-pointer rounded-lg border p-4 ${
                selectedTier === tier
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-zinc-700 hover:border-zinc-600"
              }`}
            >
              <RadioGroupItem value={tier} id={tier} className="sr-only" />
              <div className="text-center">
                <h3 className="font-semibold text-zinc-200">{tier}</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {tier === "CORE" ? "Basic" : tier === "PRO" ? "+ AI Features" : "Unlimited Team"}
                </p>
              </div>
            </Label>
          ))}
        </RadioGroup>

        {/* Storage Selection */}
        <RadioGroup
          value={selectedSize}
          onValueChange={(v) => setSelectedSize(v as typeof selectedSize)}
          className="grid grid-cols-3 gap-4"
        >
          {(["SMALL", "MEDIUM", "LARGE"] as const).map((size) => (
            <Label
              key={size}
              htmlFor={size}
              className={`cursor-pointer rounded-lg border p-4 ${
                selectedSize === size
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-zinc-700 hover:border-zinc-600"
              }`}
            >
              <RadioGroupItem value={size} id={size} className="sr-only" />
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-200">
                  {STORAGE_LIMITS[size].toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">items</p>
              </div>
            </Label>
          ))}
        </RadioGroup>

        {/* Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-300">Includes:</h4>
          <ul className="space-y-1">
            {PLAN_FEATURES[selectedTier].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-zinc-400">
                <Check className="w-4 h-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div>
            {isFree ? (
              <p className="text-2xl font-bold text-zinc-200">Free</p>
            ) : (
              <>
                <p className="text-2xl font-bold text-zinc-200">
                  ${displayPrice}
                  <span className="text-sm font-normal text-zinc-500">
                    /{isAnnual ? "year" : "month"}
                  </span>
                </p>
                {isAnnual && (
                  <p className="text-xs text-zinc-500">
                    (${Math.round(displayPrice / 12)}/month billed annually)
                  </p>
                )}
              </>
            )}
          </div>
          <Button
            onClick={handleSubscribe}
            disabled={loading || isCurrentPlan}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isCurrentPlan ? "Current Plan" : isFree ? "Downgrade to Free" : "Subscribe"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
