"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TRAILER_CATEGORIES,
  type TrailerSectionItem,
  type TrailerCategory,
} from "@/lib/db/trailerSection";

function parseYoutubeKey(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct key (11 chars, alphanumeric + _ -)
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);

    // youtube.com/watch?v=KEY
    if (
      (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
      url.pathname === "/watch"
    ) {
      const v = url.searchParams.get("v");
      return v && /^[\w-]{11}$/.test(v) ? v : null;
    }

    // youtu.be/KEY
    if (url.hostname === "youtu.be") {
      const key = url.pathname.slice(1).split("/")[0];
      return key && /^[\w-]{11}$/.test(key) ? key : null;
    }

    // youtube.com/embed/KEY
    if (
      (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
      url.pathname.startsWith("/embed/")
    ) {
      const key = url.pathname.split("/embed/")[1]?.split(/[/?]/)[0];
      return key && /^[\w-]{11}$/.test(key) ? key : null;
    }
  } catch {
    // Not a URL
  }

  return null;
}

export function YouTubeManualForm({
  onAdd,
}: {
  onAdd: (item: Omit<TrailerSectionItem, "addedAt" | "order">) => void;
}) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TrailerCategory>("Theatre");
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [releaseDate, setReleaseDate] = useState("");

  const youtubeKey = useMemo(() => parseYoutubeKey(youtubeUrl), [youtubeUrl]);
  const thumbnailUrl = youtubeKey
    ? `https://img.youtube.com/vi/${youtubeKey}/hqdefault.jpg`
    : null;

  const canAdd = Boolean(youtubeKey && title.trim());

  function handleAdd() {
    if (!youtubeKey || !title.trim()) return;

    onAdd({
      tmdbId: null,
      mediaType,
      title: title.trim(),
      youtubeKey,
      thumbnailUrl: thumbnailUrl!,
      releaseDate,
      detailHref: null,
      category,
    });

    // Reset form
    setYoutubeUrl("");
    setTitle("");
    setReleaseDate("");
  }

  return (
    <div className="space-y-3">
      {/* YouTube URL */}
      <div>
        <label className="text-xs font-medium text-gray-500">
          YouTube URL or Video ID
        </label>
        <Input
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=... or video ID"
          className="mt-1"
        />
      </div>

      {/* Thumbnail preview */}
      {thumbnailUrl && (
        <div className="rounded-md border p-2">
          <Image
            src={thumbnailUrl}
            alt="YouTube thumbnail"
            width={320}
            height={180}
            className="w-full rounded object-cover"
          />
        </div>
      )}

      {youtubeUrl.trim() && !youtubeKey && (
        <p className="text-xs text-red-500">
          Could not parse YouTube video ID from this URL
        </p>
      )}

      {/* Title */}
      <div>
        <label className="text-xs font-medium text-gray-500">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Trailer title"
          className="mt-1"
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-gray-500">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as TrailerCategory)}
          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm"
        >
          {TRAILER_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Media type toggle */}
      <div>
        <label className="text-xs font-medium text-gray-500">Media Type</label>
        <div className="mt-1 flex gap-1 rounded-md border p-1">
          <button
            type="button"
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors",
              mediaType === "movie"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
            onClick={() => setMediaType("movie")}
          >
            Movie
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors",
              mediaType === "tv"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
            onClick={() => setMediaType("tv")}
          >
            TV Show
          </button>
        </div>
      </div>

      {/* Release date (optional) */}
      <div>
        <label className="text-xs font-medium text-gray-500">
          Release Date (optional)
        </label>
        <Input
          type="date"
          value={releaseDate}
          onChange={(e) => setReleaseDate(e.target.value)}
          className="mt-1"
        />
      </div>

      {/* Add button */}
      <Button
        className="w-full"
        disabled={!canAdd}
        onClick={handleAdd}
      >
        <Plus className="mr-1 size-4" />
        Add Trailer
      </Button>
    </div>
  );
}
