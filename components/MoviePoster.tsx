"use client";

import Image from "next/image";
import { useState } from "react";

type MoviePosterProps = {
  title: string;
  posterUrl: string | null;
  sizes: string;
  className?: string;
};

export function MoviePoster({ title, posterUrl, sizes, className }: MoviePosterProps) {
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null);

  const showFallback = !posterUrl || failedPosterUrl === posterUrl;

  if (showFallback) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-linear-to-b from-neutral-800 to-neutral-950 p-3 text-center">
        <span className="text-xs font-semibold leading-snug text-white/75 line-clamp-5 wrap-anywhere">
          {title}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={posterUrl}
      alt={title}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailedPosterUrl(posterUrl)}
    />
  );
}
