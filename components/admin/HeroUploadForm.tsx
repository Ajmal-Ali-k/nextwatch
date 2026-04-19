"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImageCropper } from "./ImageCropper";
import type { HeroSlideItem } from "@/lib/db/heroSection";

type Step = "pick" | "crop" | "details";

export function HeroUploadForm({
  onAdd,
}: {
  onAdd: (item: Omit<HeroSlideItem, "addedAt" | "order">) => void;
}) {
  const [step, setStep] = useState<Step>("pick");
  const [rawPreview, setRawPreview] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState("");
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
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

    setOriginalName(selected.name);
    const url = URL.createObjectURL(selected);
    setRawPreview(url);
    setStep("crop");
  }

  function handleCropDone(blob: Blob) {
    setCroppedBlob(blob);
    const url = URL.createObjectURL(blob);
    setCroppedPreview(url);
    setStep("details");
  }

  function handleCropCancel() {
    resetFile();
  }

  function resetFile() {
    if (rawPreview) URL.revokeObjectURL(rawPreview);
    if (croppedPreview) URL.revokeObjectURL(croppedPreview);
    setRawPreview(null);
    setCroppedBlob(null);
    setCroppedPreview(null);
    setOriginalName("");
    setStep("pick");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetAll() {
    resetFile();
    setTitle("");
    setSubtitle("");
    setHref("");
  }

  async function handleUploadAndAdd() {
    if (!croppedBlob || !title.trim()) return;

    setUploading(true);
    try {
      const filename = originalName.replace(/\.[^.]+$/, "") + ".webp";

      const presignRes = await fetch("/api/admin/hero/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          contentType: "image/webp",
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}));
        toast.error(err.error || "Failed to get upload URL");
        return;
      }

      const { uploadUrl, publicUrl, s3Key } = await presignRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: croppedBlob,
        headers: { "Content-Type": "image/webp" },
      });

      if (!uploadRes.ok) {
        toast.error("Failed to upload image to S3");
        return;
      }

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

      resetAll();
      toast.success("Image uploaded and slide added");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const canAdd = Boolean(croppedBlob && title.trim());

  return (
    <div className="space-y-3">
      {/* Step 1: File picker */}
      {step === "pick" && (
        <div>
          <label className="text-xs font-medium text-gray-500">
            Banner Image
          </label>
          <div className="mt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-gray-400">
            You&apos;ll crop the image to 21:9 banner ratio in the next step
          </p>
        </div>
      )}

      {/* Step 2: Crop */}
      {step === "crop" && rawPreview && (
        <ImageCropper
          imageSrc={rawPreview}
          onCropDone={handleCropDone}
          onCancel={handleCropCancel}
        />
      )}

      {/* Step 3: Details + preview */}
      {step === "details" && (
        <>
          {croppedPreview && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500">
                  Cropped Preview
                </label>
                <button
                  type="button"
                  onClick={resetFile}
                  className="text-[11px] font-medium text-blue-600 hover:underline"
                >
                  Change image
                </button>
              </div>
              <div className="overflow-hidden rounded-md border">
                <Image
                  src={croppedPreview}
                  alt="Cropped preview"
                  width={400}
                  height={Math.round(400 / (21 / 9))}
                  className="w-full rounded object-cover"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Banner title"
              className="mt-1"
            />
          </div>

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
        </>
      )}
    </div>
  );
}
