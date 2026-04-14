"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import {
  TRAILER_CATEGORIES,
  type TrailerSectionItem,
  type TrailerCategory,
} from "@/lib/db/trailerSection";

type TrailerSearchResult = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  releaseDate: string;
  youtubeKey: string | null;
  thumbnailUrl: string | null;
};

export function TrailerSearchPanel({
  existingIds,
  onAdd,
}: {
  existingIds: Set<string>;
  onAdd: (item: Omit<TrailerSectionItem, "addedAt" | "order">) => void;
}) {
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [category, setCategory] = useState<TrailerCategory>("Theatre");
  const debouncedQuery = useDebouncedValue(query, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-trailer-search", debouncedQuery, mediaType],
    queryFn: async () => {
      const params = new URLSearchParams({
        query: debouncedQuery,
        type: mediaType,
      });
      const res = await fetch(`/api/admin/trailer-search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<{ results: TrailerSearchResult[] }>;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const results = data?.results ?? [];

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

      {/* Category selector */}
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
          Searching &amp; fetching trailers...
        </div>
      )}

      {results.length > 0 && (
        <div className="max-h-[calc(100vh-480px)] space-y-1 overflow-y-auto rounded-md border bg-white p-1">
          {results.map((item) => {
            const key = `${item.mediaType}-${item.tmdbId}`;
            const alreadyAdded = existingIds.has(key);
            const hasTrailer = Boolean(item.youtubeKey);
            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50"
              >
                {item.thumbnailUrl ? (
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    width={80}
                    height={45}
                    className="h-11 w-20 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-20 items-center justify-center rounded bg-gray-200 text-[10px] text-gray-400">
                    No trailer
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">
                    {item.releaseDate || "No date"}
                    {!hasTrailer && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        No trailer
                      </Badge>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={alreadyAdded ? "outline" : "default"}
                  disabled={alreadyAdded || !hasTrailer}
                  onClick={() =>
                    onAdd({
                      tmdbId: item.tmdbId,
                      mediaType: item.mediaType,
                      title: item.title,
                      youtubeKey: item.youtubeKey!,
                      thumbnailUrl: item.thumbnailUrl!,
                      releaseDate: item.releaseDate,
                      detailHref:
                        item.mediaType === "tv"
                          ? `/tv-shows/${item.tmdbId}`
                          : `/movies/${item.tmdbId}`,
                      category,
                    })
                  }
                >
                  {alreadyAdded ? (
                    "Added"
                  ) : (
                    <>
                      <Plus className="mr-1 size-3" />
                      Add
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
