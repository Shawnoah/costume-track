"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tag, Plus, Trash2, Loader2, Check, Printer } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface LabelFormat {
  id: string;
  name: string;
  widthInches: number;
  heightInches: number;
  isPreset: boolean;
  description: string | null;
}

export function LabelFormatManager() {
  const router = useRouter();
  const [formats, setFormats] = useState<LabelFormat[]>([]);
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formatToDelete, setFormatToDelete] = useState<LabelFormat | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    widthInches: 2.25,
    heightInches: 1.37,
    description: "",
  });

  const loadFormats = useCallback(async () => {
    try {
      const res = await fetch("/api/label-formats");
      if (res.ok) {
        const data = await res.json();
        setFormats(data.formats);
        setSelectedFormatId(data.selectedFormatId);
      }
    } catch (err) {
      console.error("Failed to load formats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFormats();
  }, [loadFormats]);

  const openAddDialog = () => {
    setFormData({
      name: "",
      widthInches: 2.25,
      heightInches: 1.37,
      description: "",
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (formData.widthInches <= 0 || formData.heightInches <= 0) {
      setError("Dimensions must be positive numbers");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/label-formats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          widthInches: formData.widthInches,
          heightInches: formData.heightInches,
          description: formData.description || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save");
      }

      const savedFormat = await res.json();
      setFormats([...formats, savedFormat]);
      setDialogOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save format");
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = async (formatId: string) => {
    try {
      const res = await fetch("/api/label-formats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formatId }),
      });

      if (res.ok) {
        setSelectedFormatId(formatId);
      }
    } catch (err) {
      console.error("Failed to select format:", err);
    }
  };

  const handleDelete = (format: LabelFormat) => {
    if (format.isPreset) {
      setError("Cannot delete preset formats");
      return;
    }

    setFormatToDelete(format);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!formatToDelete) return;

    try {
      const res = await fetch(`/api/label-formats?id=${formatToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setFormats(formats.filter((f) => f.id !== formatToDelete.id));
        if (selectedFormatId === formatToDelete.id) {
          setSelectedFormatId(null);
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete format");
    } finally {
      setDeleteConfirmOpen(false);
      setFormatToDelete(null);
    }
  };

  const presetFormats = formats.filter((f) => f.isPreset);
  const customFormats = formats.filter((f) => !f.isPreset);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Printer className="w-5 h-5 text-purple-400" />
              Label Formats
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Configure tag and label sizes for printing
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={openAddDialog}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Custom
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">Add Custom Label Format</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Create a custom label size for your printer
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-300">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., My Custom Tag 3x2"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width" className="text-zinc-300">Width (inches)</Label>
                    <Input
                      id="width"
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="12"
                      value={formData.widthInches}
                      onChange={(e) => setFormData({ ...formData, widthInches: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-zinc-300">Height (inches)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="12"
                      value={formData.heightInches}
                      onChange={(e) => setFormData({ ...formData, heightInches: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-300">Description (optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., For use with XYZ printer"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label className="text-zinc-300">Preview (not to scale)</Label>
                  <div className="flex justify-center p-4 bg-zinc-800 rounded-lg">
                    <div
                      className="bg-white border border-zinc-500 flex items-center justify-center text-xs text-zinc-500"
                      style={{
                        width: `${Math.min(formData.widthInches * 40, 200)}px`,
                        height: `${Math.min(formData.heightInches * 40, 120)}px`,
                      }}
                    >
                      {formData.widthInches}&quot; x {formData.heightInches}&quot;
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="border-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Format
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preset Formats */}
            <div>
              <p className="text-xs text-zinc-500 mb-2">Standard Formats</p>
              <div className="space-y-2">
                {presetFormats.map((format) => (
                  <FormatItem
                    key={format.id}
                    format={format}
                    isSelected={selectedFormatId === format.id}
                    onSelect={() => handleSelect(format.id)}
                    onDelete={() => handleDelete(format)}
                  />
                ))}
              </div>
            </div>

            {/* Custom Formats */}
            {customFormats.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-2">Custom Formats</p>
                <div className="space-y-2">
                  {customFormats.map((format) => (
                    <FormatItem
                      key={format.id}
                      format={format}
                      isSelected={selectedFormatId === format.id}
                      onSelect={() => handleSelect(format.id)}
                      onDelete={() => handleDelete(format)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!selectedFormatId && (
              <p className="text-xs text-zinc-500 text-center py-2">
                Select a default format for tag printing
              </p>
            )}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title={`Delete "${formatToDelete?.name}"?`}
        description="This custom label format will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
    </Card>
  );
}

function FormatItem({
  format,
  isSelected,
  onSelect,
  onDelete,
}: {
  format: LabelFormat;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer group ${
        isSelected
          ? "bg-purple-600/20 border border-purple-600/30"
          : "bg-zinc-800/50 hover:bg-zinc-800 border border-transparent"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <Tag className={`w-4 h-4 ${isSelected ? "text-purple-400" : "text-zinc-500"}`} />
        <div>
          <div className="flex items-center gap-2">
            <p className={`font-medium ${isSelected ? "text-purple-200" : "text-zinc-200"}`}>
              {format.name}
            </p>
            <span className="text-xs text-zinc-500">
              {format.widthInches}&quot; x {format.heightInches}&quot;
            </span>
          </div>
          {format.description && (
            <p className="text-zinc-500 text-xs">{format.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isSelected && (
          <Badge className="bg-purple-600/30 text-purple-300 border-purple-600/50">
            <Check className="w-3 h-3 mr-1" />
            Default
          </Badge>
        )}
        {!format.isPreset && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-8 w-8 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
