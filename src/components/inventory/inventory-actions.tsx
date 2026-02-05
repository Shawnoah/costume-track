"use client";

import { Button } from "@/components/ui/button";
import { Plus, Scan } from "lucide-react";
import Link from "next/link";
import { BarcodeLookup } from "./barcode-lookup";

export function InventoryActions() {
  return (
    <div className="flex gap-2 w-full sm:w-auto">
      <BarcodeLookup
        trigger={
          <Button variant="outline" className="flex-1 sm:flex-none border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <Scan className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Scan</span>
          </Button>
        }
      />
      <Button asChild className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700">
        <Link href="/inventory/new">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Costume</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </Button>
    </div>
  );
}
