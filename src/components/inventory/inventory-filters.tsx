"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";

interface Category {
  id: string;
  name: string;
}

interface InventoryFiltersProps {
  categories: Category[];
  initialSearch: string;
  initialStatus: string;
  initialCategory: string;
}

export function InventoryFilters({
  categories,
  initialSearch,
  initialStatus,
  initialCategory,
}: InventoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/inventory?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams("search", search);
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          name="search"
          placeholder="Search costumes..."
          aria-label="Search costumes"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
        />
      </form>
      <div className="flex gap-3">
        <Select
          value={initialStatus || "all"}
          onValueChange={(value) => updateParams("status", value)}
        >
          <SelectTrigger className="flex-1 sm:w-[180px] sm:flex-none bg-zinc-900 border-zinc-800 text-zinc-100">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="RENTED">Rented</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            <SelectItem value="RETIRED">Retired</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={initialCategory || "all"}
          onValueChange={(value) => updateParams("category", value)}
        >
          <SelectTrigger className="flex-1 sm:w-[180px] sm:flex-none bg-zinc-900 border-zinc-800 text-zinc-100">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
