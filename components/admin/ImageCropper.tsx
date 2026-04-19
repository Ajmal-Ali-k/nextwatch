"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Check, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

const ASPECT = 21 / 9;

export function ImageCropper({
  imageSrc,
  onCropDone,
  onCancel,
}: {
  imageSrc: string;
  onCropDone: (croppedBlob: Blob) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedImage(imageSrc, croppedAreaPixels);
    onCropDone(blob);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Drag to reposition &middot; Pinch or scroll to zoom &middot; 21 : 9
        aspect ratio
      </p>

      <div className="relative h-52 w-full overflow-hidden rounded-md border bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={ASPECT}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={false}
        />
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <ZoomOut className="size-3.5 text-gray-400" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-gray-900 [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-900"
        />
        <ZoomIn className="size-3.5 text-gray-400" />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onCancel}
        >
          <RotateCcw className="mr-1.5 size-3.5" />
          Change Image
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1"
          onClick={handleConfirm}
        >
          <Check className="mr-1.5 size-3.5" />
          Crop & Continue
        </Button>
      </div>
    </div>
  );
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

async function getCroppedImage(src: string, crop: Area): Promise<Blob> {
  const image = await createImage(src);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/webp",
      0.9
    );
  });
}
