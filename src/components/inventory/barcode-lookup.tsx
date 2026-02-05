"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QuickScanInput } from "@/components/ui/barcode-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Scan, Shirt, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface LookupResult {
  id: string;
  name: string;
  sku: string | null;
  status: string;
  location: string | null;
  category: { name: string } | null;
  photos: { url: string }[];
}

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-600/20 text-green-400 border-green-600/30",
  RENTED: "bg-purple-600/20 text-purple-400 border-purple-600/30",
  RESERVED: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  MAINTENANCE: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  RETIRED: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",
};

interface BarcodeLookupProps {
  onSelect?: (costume: LookupResult) => void;
  trigger?: React.ReactNode;
}

export function BarcodeLookup({ onSelect, trigger }: BarcodeLookupProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(async (sku: string) => {
    setLoading(true);
    setResult(null);
    setNotFound(null);
    setError(null);

    try {
      const res = await fetch(`/api/inventory/lookup?sku=${encodeURIComponent(sku)}`);

      if (res.status === 404) {
        setNotFound(sku);
        return;
      }

      if (!res.ok) {
        throw new Error("Lookup failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Lookup error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = () => {
    if (result) {
      if (onSelect) {
        onSelect(result);
        setOpen(false);
        setResult(null);
      } else {
        router.push(`/inventory/${result.id}`);
      }
    }
  };

  const reset = () => {
    setResult(null);
    setNotFound(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) reset(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-zinc-700 text-zinc-300">
            <Scan className="w-4 h-4 mr-2" />
            Scan Barcode
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Barcode Lookup</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Scan a barcode or type an SKU to find a costume
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <QuickScanInput
            onScan={handleScan}
            placeholder="Scan barcode or type SKU..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
            disabled={loading}
          />

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 bg-red-950/50 border border-red-900 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Not found state */}
          {notFound && (
            <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-center">
              <Shirt className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">
                No costume found with SKU: <span className="text-zinc-200 font-mono">{notFound}</span>
              </p>
              <Button
                variant="link"
                className="text-purple-400 hover:text-purple-300 mt-2"
                onClick={() => {
                  setOpen(false);
                  router.push(`/inventory/new?sku=${encodeURIComponent(notFound)}`);
                }}
              >
                Create new costume with this SKU
              </Button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="relative w-16 h-20 rounded overflow-hidden bg-zinc-700 shrink-0">
                  {result.photos[0] ? (
                    <Image
                      src={result.photos[0].url}
                      alt={result.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shirt className="w-6 h-6 text-zinc-500" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-zinc-200 truncate">{result.name}</h3>
                    <Badge variant="outline" className={statusColors[result.status]}>
                      {result.status.toLowerCase()}
                    </Badge>
                  </div>
                  {result.sku && (
                    <p className="text-xs text-zinc-500 font-mono mt-1">{result.sku}</p>
                  )}
                  <div className="mt-2 text-xs text-zinc-400 space-y-1">
                    {result.category && <p>{result.category.name}</p>}
                    {result.location && <p>Location: {result.location}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSelect}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {onSelect ? "Select" : "View Details"}
                </Button>
                <Button
                  variant="outline"
                  className="border-zinc-700"
                  asChild
                >
                  <Link href={`/inventory/${result.id}`} target="_blank">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Instructions when idle */}
          {!loading && !result && !notFound && !error && (
            <div className="text-center py-4 text-zinc-500 text-sm">
              <p>Position barcode scanner and scan, or type SKU and press Enter</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
