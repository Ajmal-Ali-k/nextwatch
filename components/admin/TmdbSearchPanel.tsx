"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { posterUrl } from "@/lib/tmdb/constants";
import type { HomeSectionItem } from "@/lib/db/homeSection";

type SearchResult = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  releaseDate: string;
};

export function TmdbSearchPanel({
  mediaType,
  existingIds,
  onAdd,
}: {
  mediaType: "movie" | "tv";
  existingIds: Set<string>;
  onAdd: (item: Omit<HomeSectionItem, "addedAt" | "order">) => void;
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 400);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tmdb-search", debouncedQuery, mediaType],
    queryFn: async () => {
      const params = new URLSearchParams({
        query: debouncedQuery,
        type: mediaType,
      });
      const res = await fetch(`/api/admin/tmdb-search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<{ results: SearchResult[] }>;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const results = data?.results ?? [];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${mediaType === "tv" ? "TV shows" : "movies"} on TMDB...`}
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
        <div className="max-h-[calc(100vh-360px)] space-y-1 overflow-y-auto rounded-md border bg-white p-1">
          {results.map((item) => {
            const key = `${item.mediaType}-${item.tmdbId}`;
            const alreadyAdded = existingIds.has(key);
            const thumb = posterUrl(item.posterPath);
            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50"
              >
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={item.title}
                    width={32}
                    height={48}
                    className="h-12 w-8 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-8 items-center justify-center rounded bg-gray-200 text-xs text-gray-400">
                    N/A
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">
                    {item.releaseDate || "No date"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={alreadyAdded ? "outline" : "default"}
                  disabled={alreadyAdded}
                  onClick={() =>
                    onAdd({
                      tmdbId: item.tmdbId,
                      mediaType: item.mediaType,
                      title: item.title,
                      posterPath: item.posterPath,
                      releaseDate: item.releaseDate,
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
