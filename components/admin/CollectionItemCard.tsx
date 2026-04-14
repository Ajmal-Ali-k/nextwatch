"use client";

import Image from "next/image";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { posterUrl } from "@/lib/tmdb/constants";
import type { HomeSectionItem } from "@/lib/db/homeSection";

export function CollectionItemCard({
  item,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  onMoveTo,
}: {
  item: HomeSectionItem;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onMoveTo: (newIndex: number) => void;
}) {
  const thumb = posterUrl(item.posterPath);

  return (
    <tr className="border-b last:border-b-0 hover:bg-gray-50/50">
      {/* Position */}
      <td className="w-16 py-2 pl-3 pr-1">
        <Input
          type="number"
          min={1}
          max={total}
          value={index + 1}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!Number.isNaN(v) && v >= 1 && v <= total) {
              onMoveTo(v - 1);
            }
          }}
          className="h-8 w-14 text-center text-sm tabular-nums"
        />
      </td>

      {/* Poster */}
      <td className="w-14 py-2 px-2">
        {thumb ? (
          <Image
            src={thumb}
            alt={item.title}
            width={36}
            height={54}
            className="h-12 w-8 rounded object-cover"
          />
        ) : (
          <div className="flex h-12 w-8 items-center justify-center rounded bg-gray-200 text-[10px] text-gray-400">
            N/A
          </div>
        )}
      </td>

      {/* Title & meta */}
      <td className="py-2 pr-2">
        <p className="text-sm font-medium leading-snug line-clamp-1">
          {item.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {item.mediaType === "tv" ? "TV" : "Movie"} &middot;{" "}
          {item.releaseDate || "—"} &middot; #{item.tmdbId}
        </p>
      </td>

      {/* Actions */}
      <td className="w-28 py-2 pr-3">
        <div className="flex items-center justify-end gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={index === 0}
            onClick={onMoveUp}
            title="Move up"
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={index === total - 1}
            onClick={onMoveDown}
            title="Move down"
          >
            <ArrowDown className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={onRemove}
            title="Remove"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
