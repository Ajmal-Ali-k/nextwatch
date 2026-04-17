"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ImageLightboxProps = {
  mode: "image";
  images: { src: string }[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

type VideoLightboxProps = {
  mode: "video";
  youtubeKey: string;
  title: string;
  onClose: () => void;
};

type MediaLightboxModalProps = ImageLightboxProps | VideoLightboxProps;

export function MediaLightboxModal(props: MediaLightboxModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const { onClose } = props;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (props.mode === "image") {
        if (e.key === "ArrowLeft" && props.index > 0) {
          props.onIndexChange(props.index - 1);
        }
        if (e.key === "ArrowRight" && props.index < props.images.length - 1) {
          props.onIndexChange(props.index + 1);
        }
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  });

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={props.mode === "video" ? props.title : "Image viewer"}
        className="relative flex w-full max-w-6xl flex-col items-center outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute -top-2 right-0 z-10 flex size-9 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white transition hover:bg-white/15 sm:-top-12"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>

        {props.mode === "video" ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/10">
            <iframe
              title={props.title}
              src={`https://www.youtube.com/embed/${encodeURIComponent(props.youtubeKey)}?autoplay=1&rel=0`}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <>
            {/* Image */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/50 shadow-2xl ring-1 ring-white/10">
              <Image
                src={props.images[props.index].src}
                alt=""
                fill
                className="object-contain"
                sizes="(max-width: 1280px) 100vw, 1152px"
                priority
              />
            </div>

            {/* Navigation */}
            {props.images.length > 1 ? (
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => props.onIndexChange(props.index - 1)}
                  disabled={props.index <= 0}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white transition hover:border-white/45 hover:bg-black/75",
                    "disabled:pointer-events-none disabled:opacity-30"
                  )}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <span className="min-w-16 text-center text-sm text-white/70">
                  {props.index + 1} / {props.images.length}
                </span>
                <button
                  type="button"
                  onClick={() => props.onIndexChange(props.index + 1)}
                  disabled={props.index >= props.images.length - 1}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white transition hover:border-white/45 hover:bg-black/75",
                    "disabled:pointer-events-none disabled:opacity-30"
                  )}
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
