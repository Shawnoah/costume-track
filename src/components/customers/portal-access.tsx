"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ExternalLink, Copy, Check, Link2, RefreshCw, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface PortalAccessProps {
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  portalEnabled: boolean;
  portalToken: string | null;
}

export function PortalAccess({
  customerId,
  customerName,
  customerEmail,
  portalEnabled: initialEnabled,
  portalToken: initialToken,
}: PortalAccessProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const portalUrl = token && origin ? `${origin}/portal?token=${token}` : null;

  const handleToggle = async (newEnabled: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/customers/${customerId}/portal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled }),
      });

      if (!res.ok) {
        throw new Error("Failed to update portal access");
      }

      const data = await res.json();
      setEnabled(data.portalEnabled);
      setToken(data.portalToken);
    } catch (err) {
      console.error("Portal toggle error:", err);
      setError("Failed to update portal access");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setRegenConfirmOpen(true);
  };

  const confirmRegenerate = async () => {
    setRegenConfirmOpen(false);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/customers/${customerId}/portal`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateToken: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to regenerate token");
      }

      const data = await res.json();
      setToken(data.portalToken);
    } catch (err) {
      console.error("Token regenerate error:", err);
      setError("Failed to regenerate portal link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!portalUrl) return;

    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-purple-400" />
          Customer Portal
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Allow {customerName} to view their rental history online
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
            {error}
          </div>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="portal-access" className="text-zinc-300">
            Enable portal access
          </Label>
          <Switch
            id="portal-access"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>

        {/* Portal Link */}
        {enabled && portalUrl && (
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <Label className="text-zinc-400 text-sm">Portal Link</Label>
            <div className="flex gap-2">
              <Input
                value={portalUrl}
                readOnly
                className="bg-zinc-800 border-zinc-700 text-zinc-300 text-sm font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className="border-zinc-700 shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                asChild
                className="border-zinc-700 shrink-0"
              >
                <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Share this link with your customer so they can view their rentals.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={loading}
                className="text-zinc-400 hover:text-zinc-100"
              >
                {loading ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {!customerEmail && enabled && (
          <p className="text-xs text-yellow-500 bg-yellow-950/30 p-2 rounded">
            Tip: Add an email address to easily share the portal link with your customer.
          </p>
        )}
      </CardContent>

      <ConfirmDialog
        open={regenConfirmOpen}
        onOpenChange={setRegenConfirmOpen}
        onConfirm={confirmRegenerate}
        title="Regenerate portal link?"
        description="This will invalidate the current portal link. Anyone using the old link will no longer be able to access the portal."
        confirmLabel="Regenerate"
        variant="destructive"
      />
    </Card>
  );
}
