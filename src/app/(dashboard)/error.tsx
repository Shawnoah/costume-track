"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100 mb-2">
          Something went wrong
        </h2>
        <p className="text-zinc-400 mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/dashboard")}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={reset}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
