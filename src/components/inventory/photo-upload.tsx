"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { generateReactHelpers } from "@uploadthing/react";
import { X, Upload, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OurFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export interface Photo {
  id?: string;
  url: string;
  key: string;
  description: string;
  sortOrder: number;
}

interface PhotoUploadProps {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
  costumeId?: string;
}

export function PhotoUpload({ photos, onChange, costumeId }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload } = useUploadThing("costumePhoto", {
    onUploadProgress: (p) => setUploadProgress(p),
    onClientUploadComplete: (res) => {
      if (res) {
        const newPhotos = res.map((file, index) => ({
          url: file.ufsUrl,
          key: file.key,
          description: "",
          sortOrder: photos.length + index,
        }));
        onChange([...photos, ...newPhotos]);
      }
      setUploading(false);
      setUploadProgress(0);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      setUploading(false);
      setUploadProgress(0);
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      await startUpload(acceptedFiles);
    },
    [startUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
    },
    maxFiles: 10,
    disabled: uploading,
  });

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    // Update sort orders
    newPhotos.forEach((p, i) => (p.sortOrder = i));
    onChange(newPhotos);
  };

  const updateDescription = (index: number, description: string) => {
    const newPhotos = [...photos];
    newPhotos[index] = { ...newPhotos[index], description };
    onChange(newPhotos);
  };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= photos.length) return;
    const newPhotos = [...photos];
    const [removed] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, removed);
    // Update sort orders
    newPhotos.forEach((p, i) => (p.sortOrder = i));
    onChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 hover:border-zinc-600"}
          ${uploading ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-sm text-zinc-400">Uploading... {uploadProgress}%</p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-purple-400" />
            <p className="text-sm text-zinc-400">Drop photos here</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-zinc-500" />
            <p className="text-sm text-zinc-400">
              Drag & drop photos here, or click to select
            </p>
            <p className="text-xs text-zinc-500">PNG, JPG, WEBP up to 4MB each</p>
          </div>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={photo.key}
              className="relative bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700"
            >
              {/* Image */}
              <div className="relative aspect-square">
                <Image
                  src={photo.url}
                  alt={photo.description || `Photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {/* Overlay buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 bg-zinc-900/80 hover:bg-zinc-900"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {/* Sort controls */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <div className="flex items-center gap-1 bg-zinc-900/80 rounded px-1">
                    <GripVertical className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs text-zinc-400">{index + 1}</span>
                  </div>
                </div>
                {/* Move buttons */}
                {photos.length > 1 && (
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-6 px-2 text-xs bg-zinc-900/80 hover:bg-zinc-900"
                        onClick={() => movePhoto(index, index - 1)}
                      >
                        ← Move
                      </Button>
                    )}
                    {index < photos.length - 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-6 px-2 text-xs bg-zinc-900/80 hover:bg-zinc-900"
                        onClick={() => movePhoto(index, index + 1)}
                      >
                        Move →
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {/* Description input */}
              <div className="p-2">
                <Input
                  placeholder="Add description..."
                  value={photo.description}
                  onChange={(e) => updateDescription(index, e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-zinc-100 text-sm h-8"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
