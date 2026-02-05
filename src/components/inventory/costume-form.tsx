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
import { Loader2 } from "lucide-react";
import { PhotoUpload, type Photo, type PhotoType } from "./photo-upload";

interface Category {
  id: string;
  name: string;
}

interface CostumePhoto {
  id: string;
  url: string;
  key: string;
  type: PhotoType;
  description: string | null;
  sortOrder: number;
}

interface CostumeData {
  id?: string;
  name: string;
  description: string | null;
  sku: string | null;
  size: string | null;
  color: string | null;
  era: string | null;
  condition: string;
  status: string;
  location: string | null;
  notes: string | null;
  purchasePrice: number | null;
  rentalPrice: number | null;
  categoryId: string | null;
  photos?: CostumePhoto[];
}

interface CostumeFormProps {
  categories: Category[];
  costume?: CostumeData;
}

export function CostumeForm({ categories, costume }: CostumeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>(
    costume?.photos?.map((p) => ({
      id: p.id,
      url: p.url,
      key: p.key,
      type: p.type,
      description: p.description || "",
      sortOrder: p.sortOrder,
    })) || []
  );

  const isEditing = !!costume?.id;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      sku: formData.get("sku") as string || null,
      size: formData.get("size") as string || null,
      color: formData.get("color") as string || null,
      era: formData.get("era") as string || null,
      condition: formData.get("condition") as string,
      status: formData.get("status") as string,
      location: formData.get("location") as string || null,
      notes: formData.get("notes") as string || null,
      purchasePrice: formData.get("purchasePrice") ? parseFloat(formData.get("purchasePrice") as string) : null,
      rentalPrice: formData.get("rentalPrice") ? parseFloat(formData.get("rentalPrice") as string) : null,
      categoryId: formData.get("categoryId") as string || null,
      photos: photos.map((p) => ({
        id: p.id,
        url: p.url,
        key: p.key,
        type: p.type,
        description: p.description || null,
        sortOrder: p.sortOrder,
      })),
    };

    try {
      const url = isEditing ? `/api/inventory/${costume.id}` : "/api/inventory";
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

      router.push("/inventory");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={costume?.name || ""}
                placeholder="Victorian Ball Gown"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={costume?.description || ""}
                placeholder="Detailed description of the costume..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-zinc-300">SKU / Code</Label>
                <Input
                  id="sku"
                  name="sku"
                  defaultValue={costume?.sku || ""}
                  placeholder="VIC-001"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId" className="text-zinc-300">Category</Label>
                <Select name="categoryId" defaultValue={costume?.categoryId || ""}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size" className="text-zinc-300">Size</Label>
                <Input
                  id="size"
                  name="size"
                  defaultValue={costume?.size || ""}
                  placeholder="Medium, 10, etc."
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color" className="text-zinc-300">Color</Label>
                <Input
                  id="color"
                  name="color"
                  defaultValue={costume?.color || ""}
                  placeholder="Deep purple"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="era" className="text-zinc-300">Era / Period</Label>
              <Input
                id="era"
                name="era"
                defaultValue={costume?.era || ""}
                placeholder="Victorian, 1920s, Medieval..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-zinc-300">Location</Label>
              <Input
                id="location"
                name="location"
                defaultValue={costume?.location || ""}
                placeholder="Rack A, Shelf 3"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condition" className="text-zinc-300">Condition</Label>
                <Select name="condition" defaultValue={costume?.condition || "GOOD"}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXCELLENT">Excellent</SelectItem>
                    <SelectItem value="GOOD">Good</SelectItem>
                    <SelectItem value="FAIR">Fair</SelectItem>
                    <SelectItem value="POOR">Poor</SelectItem>
                    <SelectItem value="NEEDS_REPAIR">Needs Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-zinc-300">Status</Label>
                <Select name="status" defaultValue={costume?.status || "AVAILABLE"}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="RENTED">Rented</SelectItem>
                    <SelectItem value="RESERVED">Reserved</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="RETIRED">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos - Full Width */}
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-zinc-100">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoUpload
              photos={photos}
              onChange={setPhotos}
            />
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice" className="text-zinc-300">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  name="purchasePrice"
                  type="number"
                  step="0.01"
                  defaultValue={costume?.purchasePrice || ""}
                  placeholder="0.00"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rentalPrice" className="text-zinc-300">Rental Price</Label>
                <Input
                  id="rentalPrice"
                  name="rentalPrice"
                  type="number"
                  step="0.01"
                  defaultValue={costume?.rentalPrice || ""}
                  placeholder="0.00"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={costume?.notes || ""}
              placeholder="Any additional notes..."
              className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>

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
          {isEditing ? "Save Changes" : "Add Costume"}
        </Button>
      </div>
    </form>
  );
}
