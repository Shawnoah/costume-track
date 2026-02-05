"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AIDescribeResult {
  suggestedName?: string;
  description?: string;
  era?: string;
  color?: string;
  suggestedCategory?: string;
  error?: string;
}

interface AIDescribeButtonProps {
  imageUrl: string;
  existingName?: string;
  onApply: (result: AIDescribeResult) => void;
}

export function AIDescribeButton({
  imageUrl,
  existingName,
  onApply,
}: AIDescribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIDescribeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDescribe = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, existingName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to analyze image");
      }

      const data = await res.json();
      setResult(data);
      setDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      setDialogOpen(false);
      setResult(null);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDescribe}
        disabled={loading}
        className="border-purple-600/50 text-purple-400 hover:bg-purple-600/10 hover:text-purple-300"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        {loading ? "Analyzing..." : "AI Describe"}
      </Button>

      {error && (
        <p className="text-sm text-red-400 mt-2">{error}</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Analysis Results
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Review the AI-generated details and apply them to your costume.
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-4 py-4">
              {result.suggestedName && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">
                    Suggested Name
                  </label>
                  <p className="text-zinc-200 mt-1">{result.suggestedName}</p>
                </div>
              )}

              {result.description && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">
                    Description
                  </label>
                  <p className="text-zinc-300 mt-1 text-sm leading-relaxed">
                    {result.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {result.era && (
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wide">
                      Era / Period
                    </label>
                    <p className="text-zinc-200 mt-1">{result.era}</p>
                  </div>
                )}

                {result.color && (
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wide">
                      Color
                    </label>
                    <p className="text-zinc-200 mt-1">{result.color}</p>
                  </div>
                )}
              </div>

              {result.suggestedCategory && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wide">
                    Suggested Category
                  </label>
                  <p className="text-zinc-200 mt-1">{result.suggestedCategory}</p>
                </div>
              )}

              {result.error && (
                <p className="text-sm text-yellow-400 bg-yellow-950/30 p-2 rounded">
                  Note: {result.error}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Apply to Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
