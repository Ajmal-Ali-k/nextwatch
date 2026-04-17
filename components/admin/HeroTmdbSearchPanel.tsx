"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Loader2, ArrowLeft, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { HeroSlideItem } from "@/lib/db/heroSection";

type HeroSearchResult = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  overview: string;
  backdropUrl: string | null;
  releaseDate: string;
};

type BackdropImage = {
  filePath: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  voteAverage: number;
};

export function HeroTmdbSearchPanel({
  existingIds,
  onAdd,
}: {
  existingIds: Set<number>;
  onAdd: (item: Omit<HeroSlideItem, "addedAt" | "order">) => void;
}) {
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const debouncedQuery = useDebouncedValue(query, 400);

  // Backdrop picker state
  const [selectedItem, setSelectedItem] = useState<HeroSearchResult | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-hero-search", debouncedQuery, mediaType],
    queryFn: async () => {
      const params = new URLSearchParams({
        query: debouncedQuery,
        type: mediaType,
      });
      const res = await fetch(`/api/admin/hero/tmdb-search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<{ results: HeroSearchResult[] }>;
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Fetch all backdrops for selected item
  const { data: imagesData, isLoading: imagesLoading } = useQuery({
    queryKey: [
      "admin-hero-images",
      selectedItem?.tmdbId,
      selectedItem?.mediaType,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        id: String(selectedItem!.tmdbId),
        type: selectedItem!.mediaType,
      });
      const res = await fetch(`/api/admin/hero/images?${params}`);
      if (!res.ok) throw new Error("Failed to fetch images");
      return res.json() as Promise<{ backdrops: BackdropImage[] }>;
    },
    enabled: !!selectedItem,
  });

  const results = data?.results ?? [];
  const backdrops = imagesData?.backdrops ?? [];

  // Backdrop picker view
  if (selectedItem) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSelectedItem(null)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="size-3.5" />
          Back to results
        </button>

        <div className="rounded-md border bg-gray-50 p-3">
          <p className="text-sm font-medium">{selectedItem.title}</p>
          <p className="text-xs text-gray-500">
            {selectedItem.releaseDate || "No date"} &middot;{" "}
            {backdrops.length} {backdrops.length === 1 ? "backdrop" : "backdrops"}{" "}
            available
          </p>
        </div>

        {imagesLoading && (
          <div className="flex items-center justify-center py-6 text-sm text-gray-500">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading backdrops...
          </div>
        )}

        {!imagesLoading && backdrops.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-500">
            No backdrops available for this title.
          </p>
        )}

        {backdrops.length > 0 && (
          <div className="max-h-[calc(100vh-440px)] space-y-2 overflow-y-auto">
            {backdrops.map((img) => (
              <div
                key={img.filePath}
                className="group relative rounded-md border overflow-hidden"
              >
                <Image
                  src={img.thumbUrl}
                  alt={`Backdrop for ${selectedItem.title}`}
                  width={380}
                  height={214}
                  className="w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                  <Button
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      onAdd({
                        source: "tmdb",
                        tmdbId: selectedItem.tmdbId,
                        mediaType: selectedItem.mediaType,
                        title: selectedItem.title,
                        subtitle: selectedItem.overview,
                        imageUrl: img.url,
                        s3Key: null,
                        href:
                          selectedItem.mediaType === "tv"
                            ? `/tv-shows/${selectedItem.tmdbId}`
                            : `/movies/${selectedItem.tmdbId}`,
                      });
                      setSelectedItem(null);
                    }}
                  >
                    <Check className="mr-1 size-3" />
                    Use this backdrop
                  </Button>
                </div>
                <p className="absolute bottom-1 right-2 text-[10px] text-white/70 drop-shadow">
                  {img.width}&times;{img.height}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Search results view
  return (
    <div className="space-y-3">
      {/* Media type toggle */}
      <div className="flex gap-1 rounded-md border p-1">
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
          Movies
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
          TV Shows
        </button>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${mediaType === "tv" ? "TV shows" : "movies"}...`}
          className="pl-10"
        />
      </div>

      {isLoading && debouncedQuery.length >= 2 && (
        <div className="flex items-center justify-center py-4 text-sm text-gray-500">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="max-h-[calc(100vh-400px)] space-y-1 overflow-y-auto rounded-md border bg-white p-1">
          {results.map((item) => {
            const alreadyAdded = existingIds.has(item.tmdbId);
            return (
              <div
                key={`${item.mediaType}-${item.tmdbId}`}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50"
              >
                {item.backdropUrl ? (
                  <Image
                    src={item.backdropUrl}
                    alt={item.title}
                    width={120}
                    height={68}
                    className="h-[50px] w-[90px] rounded object-cover"
                  />
                ) : (
                  <div className="flex h-[50px] w-[90px] items-center justify-center rounded bg-gray-200 text-[10px] text-gray-400">
                    No image
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {item.releaseDate || "No date"}
                  </p>
                  {item.overview && (
                    <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                      {item.overview}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={alreadyAdded ? "outline" : "default"}
                  disabled={alreadyAdded}
                  onClick={() => setSelectedItem(item)}
                >
                  {alreadyAdded ? (
                    "Added"
                  ) : (
                    <>
                      <Plus className="mr-1 size-3" />
                      Select
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {debouncedQuery.length >= 2 && !isLoading && results.length === 0 && (
        <p className="py-4 text-center text-sm text-gray-500">
          No results found for &ldquo;{debouncedQuery}&rdquo;
        </p>
      )}
    </div>
  );
}
