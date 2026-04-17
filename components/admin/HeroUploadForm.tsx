"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { HeroSlideItem } from "@/lib/db/heroSection";

export function HeroUploadForm({
  onAdd,
}: {
  onAdd: (item: Omit<HeroSlideItem, "addedAt" | "order">) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [href, setHref] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);
  }

  async function handleUploadAndAdd() {
    if (!file || !title.trim()) return;

    setUploading(true);
    try {
      // 1. Get presigned URL
      const presignRes = await fetch("/api/admin/hero/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        toast.error(err.error || "Failed to get upload URL");
        return;
      }

      const { uploadUrl, publicUrl, s3Key } = await presignRes.json();

      // 2. Upload directly to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        toast.error("Failed to upload image to S3");
        return;
      }

      // 3. Add slide
      onAdd({
        source: "custom",
        tmdbId: null,
        mediaType: null,
        title: title.trim(),
        subtitle: subtitle.trim(),
        imageUrl: publicUrl,
        s3Key,
        href: href.trim(),
      });

      // Reset form
      setFile(null);
      setPreview(null);
      setTitle("");
      setSubtitle("");
      setHref("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast.success("Image uploaded and slide added");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const canAdd = Boolean(file && title.trim());

  return (
    <div className="space-y-3">
      {/* File picker */}
      <div>
        <label className="text-xs font-medium text-gray-500">Banner Image</label>
        <div className="mt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
          />
        </div>
      </div>

      {/* Image preview */}
      {preview && (
        <div className="rounded-md border p-2">
          <Image
            src={preview}
            alt="Preview"
            width={400}
            height={170}
            className="w-full rounded object-cover"
          />
        </div>
      )}

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-gray-500">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Banner title"
          className="mt-1"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="text-xs font-medium text-gray-500">
          Subtitle (optional)
        </label>
        <Input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Short description"
          className="mt-1"
        />
      </div>

      {/* Link */}
      <div>
        <label className="text-xs font-medium text-gray-500">
          Link URL (optional)
        </label>
        <Input
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="/movies/123 or any URL"
          className="mt-1"
        />
      </div>

      {/* Upload & Add button */}
      <Button
        className="w-full"
        disabled={!canAdd || uploading}
        onClick={handleUploadAndAdd}
      >
        {uploading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Upload className="mr-2 size-4" />
        )}
        {uploading ? "Uploading..." : "Upload & Add"}
      </Button>
    </div>
  );
}
