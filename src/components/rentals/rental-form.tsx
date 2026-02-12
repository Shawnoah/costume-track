"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, X, Search } from "lucide-react";
import { format, addDays } from "date-fns";

interface Customer {
  id: string;
  name: string;
  email: string | null;
}

interface Production {
  id: string;
  name: string;
}

interface CostumeItem {
  id: string;
  name: string;
  sku: string | null;
  size: string | null;
  condition: string;
  category: { name: string } | null;
}

interface RentalFormProps {
  customers: Customer[];
  productions: Production[];
  availableCostumes: CostumeItem[];
}

export function RentalForm({ customers, productions, availableCostumes }: RentalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCostumes = availableCostumes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function toggleItem(id: string) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function removeItem(id: string) {
    setSelectedItems((prev) => prev.filter((i) => i !== id));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (selectedItems.length === 0) {
      setError("Please select at least one costume item");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      customerId: formData.get("customerId") as string,
      productionId: formData.get("productionId") as string || null,
      dueDate: formData.get("dueDate") as string,
      depositAmount: formData.get("depositAmount") ? parseFloat(formData.get("depositAmount") as string) : null,
      notes: formData.get("notes") as string || null,
      items: selectedItems.map((id) => ({
        costumeItemId: id,
        conditionOut: availableCostumes.find((c) => c.id === id)?.condition || "GOOD",
      })),
    };

    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        setError(error.message || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/rentals");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  const defaultDueDate = format(addDays(new Date(), 14), "yyyy-MM-dd");

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer & Production */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Rental Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId" className="text-zinc-300">Customer *</Label>
              <Select name="customerId" required>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productionId" className="text-zinc-300">Production (optional)</Label>
              <Select name="productionId">
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Select production" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {productions.map((production) => (
                    <SelectItem key={production.id} value={production.id}>
                      {production.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-zinc-300">Due Date *</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  required
                  defaultValue={defaultDueDate}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositAmount" className="text-zinc-300">Deposit</Label>
                <Input
                  id="depositAmount"
                  name="depositAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-zinc-300">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any special notes..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Selected Items */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">
              Selected Items ({selectedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedItems.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">
                No items selected. Choose items from the list below.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedItems.map((id) => {
                  const item = availableCostumes.find((c) => c.id === id);
                  if (!item) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-2 rounded bg-zinc-800"
                    >
                      <div>
                        <p className="text-zinc-200 font-medium">{item.name}</p>
                        <p className="text-zinc-500 text-xs">
                          {item.size && `Size: ${item.size}`}
                          {item.category && ` • ${item.category.name}`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(id)}
                        className="text-zinc-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Items */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Available Costumes</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Search costumes..."
              aria-label="Search costumes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredCostumes.length === 0 ? (
            <p className="text-zinc-500 text-center py-4">
              No available costumes found
            </p>
          ) : (
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {filteredCostumes.map((costume) => (
                <label
                  key={costume.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedItems.includes(costume.id)
                      ? "bg-purple-600/20 border border-purple-600/30"
                      : "bg-zinc-800/50 hover:bg-zinc-800"
                  }`}
                >
                  <Checkbox
                    checked={selectedItems.includes(costume.id)}
                    onCheckedChange={() => toggleItem(costume.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-200 font-medium">{costume.name}</span>
                      {costume.sku && (
                        <span className="text-zinc-500 text-xs">{costume.sku}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {costume.category && (
                        <Badge variant="outline" className="text-xs bg-zinc-700/50 text-zinc-400 border-zinc-600">
                          {costume.category.name}
                        </Badge>
                      )}
                      {costume.size && (
                        <span className="text-zinc-500 text-xs">Size: {costume.size}</span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || selectedItems.length === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Rental
        </Button>
      </div>
    </form>
  );
}
