"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface CustomerData {
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  notes: string | null;
}

interface CustomerFormProps {
  customer?: CustomerData;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!customer?.id;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      company: formData.get("company") as string || null,
      address: formData.get("address") as string || null,
      notes: formData.get("notes") as string || null,
    };

    try {
      const url = isEditing ? `/api/customers/${customer.id}` : "/api/customers";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        setError(error.message || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/customers");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
          {error}
        </div>
      )}

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-300">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={customer?.name || ""}
              placeholder="John Smith"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={customer?.email || ""}
                placeholder="john@example.com"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-zinc-300">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={customer?.phone || ""}
                placeholder="(555) 123-4567"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-zinc-300">Company / Theater</Label>
            <Input
              id="company"
              name="company"
              defaultValue={customer?.company || ""}
              placeholder="Community Theater Group"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-zinc-300">Address</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={customer?.address || ""}
              placeholder="123 Main St, City, State 12345"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-zinc-300">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={customer?.notes || ""}
              placeholder="Any additional notes..."
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
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
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEditing ? "Save Changes" : "Add Customer"}
        </Button>
      </div>
    </form>
  );
}
