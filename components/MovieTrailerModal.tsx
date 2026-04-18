"use client";

import { Play, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";

type MovieTrailerModalProps = {
  youtubeKey: string;
  movieTitle: string;
};

export function MovieTrailerModal({ youtubeKey, movieTitle }: MovieTrailerModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const modal = open ? (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Trailer: ${movieTitle}`}
        className="relative w-full max-w-5xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          className="absolute -right-1 -top-2 z-10 flex size-8 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white transition hover:bg-white/15 sm:right-0 sm:top-0 sm:-translate-y-12"
          aria-label="Close trailer"
        >
          <X className="size-4" />
        </button>
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/10">
          <iframe
            title={`${movieTitle} trailer`}
            src={`https://www.youtube.com/embed/${encodeURIComponent(youtubeKey)}?autoplay=1&rel=0`}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-[#D6212A] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b91c23]"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Play className="size-4 fill-white" aria-hidden />
        Watch Trailer
      </button>

      {mounted ? createPortal(modal, document.body) : null}
    </>
  );
}
