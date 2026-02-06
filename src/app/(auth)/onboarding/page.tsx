"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) {
      setError("Organization name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName: orgName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create organization");
      }

      // Redirect to dashboard - the session will update on next request
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-8 overflow-auto">
      <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/CostumeTrack combo fullsize.png"
              alt="CostumeTrack"
              width={200}
              height={60}
              className="h-14 w-auto"
              priority
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl text-zinc-100">
              Welcome!
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Let&apos;s set up your costume shop
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleCreateOrg}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
                {error}
              </div>
            )}

            {/* Welcome message */}
            <div className="p-4 bg-purple-950/30 border border-purple-800/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                <div className="text-sm text-zinc-300">
                  <p className="font-medium text-purple-300 mb-1">You&apos;re almost there!</p>
                  <p className="text-zinc-400">
                    Create your organization to start managing your costume inventory.
                    You can invite team members later.
                  </p>
                </div>
              </div>
            </div>

            {/* Organization name */}
            <div className="space-y-2">
              <Label htmlFor="orgName" className="text-zinc-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-500" />
                Organization Name
              </Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g., Acme Costume Rentals"
                required
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500"
              />
              <p className="text-xs text-zinc-500">
                This is how your shop will appear to customers
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
