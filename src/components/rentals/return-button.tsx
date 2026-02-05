"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle } from "lucide-react";

interface ReturnRentalButtonProps {
  rentalId: string;
}

export function ReturnRentalButton({ rentalId }: ReturnRentalButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReturn() {
    setLoading(true);

    try {
      const res = await fetch(`/api/rentals/${rentalId}/return`, {
        method: "POST",
      });

      if (!res.ok) {
        console.error("Failed to return rental");
        setLoading(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      console.error("Failed to return rental");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="w-4 h-4 mr-2" />
          Return Items
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Confirm Return</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Are you sure you want to mark all items as returned? This will update
            the costume statuses back to available.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-zinc-700 text-zinc-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReturn}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm Return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
