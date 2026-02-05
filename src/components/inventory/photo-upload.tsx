"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { X, Upload, Loader2, Star, Camera, Layers, Shirt, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PhotoType = "MAIN" | "ALTERNATE" | "FEATURE" | "MATERIAL" | "INFO";

export interface Photo {
  id?: string;
  url: string;
  key: string;
  type: PhotoType;
  description: string;
  sortOrder: number;
}

interface PhotoUploadProps {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}

const PHOTO_TYPES: { value: PhotoType; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "MAIN", label: "Main", description: "Primary identification photo", icon: <Star className="w-4 h-4" /> },
  { value: "ALTERNATE", label: "Alternate Views", description: "Different angles", icon: <Camera className="w-4 h-4" /> },
  { value: "FEATURE", label: "Features", description: "Closeups on details", icon: <Layers className="w-4 h-4" /> },
  { value: "MATERIAL", label: "Materials", description: "Fabric and textures", icon: <Shirt className="w-4 h-4" /> },
  { value: "INFO", label: "Info", description: "Tags, labels, marks", icon: <Tag className="w-4 h-4" /> },
];

export function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<PhotoType>("MAIN");

  const mainPhoto = photos.find((p) => p.type === "MAIN");
  const hasMain = !!mainPhoto;

  const uploadFile = async (file: File): Promise<{ url: string; key: string } | null> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Upload failed");
    }

    return res.json();
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Determine photo type - if uploading MAIN and one exists, use ALTERNATE
      let typeToUse = uploadType;
      if (typeToUse === "MAIN" && hasMain && acceptedFiles.length > 0) {
        // First file replaces main, rest become alternates
      }

      const newPhotos: Photo[] = [];

      try {
        for (let i = 0; i < acceptedFiles.length; i++) {
          const file = acceptedFiles[i];
          setUploadProgress(Math.round((i / acceptedFiles.length) * 100));

          const result = await uploadFile(file);
          if (result) {
            // For MAIN type, only first photo is MAIN, rest are ALTERNATE
            let photoType = typeToUse;
            if (typeToUse === "MAIN") {
              if (i === 0) {
                photoType = "MAIN";
              } else {
                photoType = "ALTERNATE";
              }
            }

            newPhotos.push({
              url: result.url,
              key: result.key,
              type: photoType,
              description: "",
              sortOrder: i,
            });
          }
        }

        // If uploading a new MAIN, remove old MAIN
        let updatedPhotos = [...photos];
        if (typeToUse === "MAIN" && newPhotos.length > 0) {
          updatedPhotos = photos.filter((p) => p.type !== "MAIN");
        }

        onChange([...updatedPhotos, ...newPhotos]);
        setUploadProgress(100);
      } catch (err) {
        console.error("Upload error:", err);
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [photos, onChange, uploadType, hasMain]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    maxFiles: 10,
    disabled: uploading,
  });

  const removePhoto = async (photoToRemove: Photo) => {
    // Try to delete from blob storage (ignore errors)
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: photoToRemove.url }),
      });
    } catch (err) {
      console.error("Failed to delete from storage:", err);
    }

    const newPhotos = photos.filter((p) => p.key !== photoToRemove.key);
    onChange(newPhotos);
  };

  const updatePhoto = (key: string, updates: Partial<Photo>) => {
    const newPhotos = photos.map((p) => {
      if (p.key === key) {
        return { ...p, ...updates };
      }
      // If setting a new MAIN, demote the old one
      if (updates.type === "MAIN" && p.type === "MAIN" && p.key !== key) {
        return { ...p, type: "ALTERNATE" as PhotoType };
      }
      return p;
    });
    onChange(newPhotos);
  };

  const getPhotosByType = (type: PhotoType) => photos.filter((p) => p.type === type);

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-md">
          {error}
        </div>
      )}

      {/* Main Photo Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="text-sm font-medium text-zinc-200">Main Photo</h3>
          <span className="text-xs text-zinc-500">Required - clear full view of the costume</span>
        </div>

        {mainPhoto ? (
          <div className="relative w-full max-w-md">
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden border-2 border-yellow-500/50 bg-zinc-800">
              <Image
                src={mainPhoto.url}
                alt="Main photo"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute top-2 right-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-zinc-900/80 hover:bg-red-900"
                  onClick={() => removePhoto(mainPhoto)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500/90 rounded text-xs font-medium text-black">
                MAIN
              </div>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            onClick={() => setUploadType("MAIN")}
            className={`
              w-full max-w-md aspect-[4/5] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
              ${isDragActive && uploadType === "MAIN" ? "border-yellow-500 bg-yellow-500/10" : "border-zinc-700 hover:border-yellow-500/50"}
              ${uploading ? "pointer-events-none opacity-50" : ""}
            `}
          >
            <input {...getInputProps()} />
            {uploading && uploadType === "MAIN" ? (
              <>
                <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mb-2" />
                <p className="text-sm text-zinc-400">Uploading... {uploadProgress}%</p>
              </>
            ) : (
              <>
                <Star className="w-10 h-10 text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-400">Drop main photo here</p>
                <p className="text-xs text-zinc-500 mt-1">or click to select</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Other Photos Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-200">Additional Photos</h3>
          <Select value={uploadType} onValueChange={(v) => setUploadType(v as PhotoType)}>
            <SelectTrigger className="w-44 h-8 bg-zinc-800 border-zinc-700 text-sm">
              <SelectValue placeholder="Photo type" />
            </SelectTrigger>
            <SelectContent>
              {PHOTO_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    {type.icon}
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 hover:border-zinc-600"}
            ${uploading ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              <p className="text-sm text-zinc-400">Uploading... {uploadProgress}%</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5 text-zinc-500" />
              <p className="text-sm text-zinc-400">
                Drop {PHOTO_TYPES.find((t) => t.value === uploadType)?.label.toLowerCase()} photos here
              </p>
            </div>
          )}
        </div>

        {/* Photo Categories */}
        {PHOTO_TYPES.filter((t) => t.value !== "MAIN").map((type) => {
          const typePhotos = getPhotosByType(type.value);
          if (typePhotos.length === 0) return null;

          return (
            <div key={type.value} className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                {type.icon}
                <span className="text-xs font-medium">{type.label}</span>
                <span className="text-xs text-zinc-600">({typePhotos.length})</span>
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {typePhotos.map((photo) => (
                  <div
                    key={photo.key}
                    className="relative bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={photo.url}
                        alt={photo.description || type.label}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-1 right-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6 bg-zinc-900/80 hover:bg-red-900"
                          onClick={() => removePhoto(photo)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-1.5">
                      <Select
                        value={photo.type}
                        onValueChange={(v) => updatePhoto(photo.key, { type: v as PhotoType })}
                      >
                        <SelectTrigger className="h-6 bg-zinc-700 border-zinc-600 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PHOTO_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-xs">
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
