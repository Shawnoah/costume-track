"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Globe, Loader2, Check, ExternalLink, Upload, X } from "lucide-react";
import Image from "next/image";

interface OrganizationProfileProps {
  organization: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    address: string | null;
    website: string | null;
    logoUrl: string | null;
    publicPageEnabled: boolean;
  };
}

export function OrganizationProfile({ organization }: OrganizationProfileProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(organization.logoUrl);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [formData, setFormData] = useState({
    name: organization.name,
    description: organization.description || "",
    contactEmail: organization.contactEmail || "",
    contactPhone: organization.contactPhone || "",
    address: organization.address || "",
    website: organization.website || "",
    publicPageEnabled: organization.publicPageEnabled,
  });

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, logoUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save");
      }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const data = await res.json();
      setLogoUrl(data.url);
    } catch (err) {
      console.error("Logo upload error:", err);
      setError("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setLogoUrl(null);
  };

  const [publicUrl, setPublicUrl] = useState(`/${organization.slug}`);

  useEffect(() => {
    setPublicUrl(`${window.location.origin}/${organization.slug}`);
  }, [organization.slug]);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-400" />
          Organization Profile
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Public information displayed on your shop&apos;s landing page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
            {error}
          </div>
        )}

        {/* Logo */}
        <div className="space-y-2">
          <Label className="text-zinc-300">Logo</Label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                <Image
                  src={logoUrl}
                  alt="Logo"
                  fill
                  className="object-contain"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute top-1 right-1 p-1 bg-zinc-900/80 rounded-full hover:bg-red-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-zinc-800 border border-zinc-700 border-dashed flex items-center justify-center">
                <Building2 className="w-8 h-8 text-zinc-600" />
              </div>
            )}
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
                <span className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 transition-colors">
                  {uploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                </span>
              </label>
              <p className="text-xs text-zinc-500 mt-1">Recommended: 200x200px</p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-zinc-300">Shop Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-zinc-300">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Tell customers about your shop..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[100px]"
          />
        </div>

        {/* Contact Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="text-zinc-300">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="contact@yourshop.com"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="text-zinc-300">Contact Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="(555) 123-4567"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-zinc-300">Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="123 Main St, City, State 12345"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
            rows={2}
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website" className="text-zinc-300">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://yourshop.com"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>

        {/* Public Page Toggle */}
        <div className="pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-zinc-300 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Public Landing Page
              </Label>
              <p className="text-xs text-zinc-500">
                Allow anyone to view your shop at{" "}
                <code className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400">
                  /{organization.slug}
                </code>
              </p>
            </div>
            <Switch
              checked={formData.publicPageEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, publicPageEnabled: checked })}
            />
          </div>

          {formData.publicPageEnabled && (
            <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Your public page:</span>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  {publicUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4 mr-2 text-green-400" />
            ) : null}
            {saved ? "Saved!" : "Save Profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
