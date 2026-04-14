"use client";

import Image from "next/image";
import { ArrowUp, ArrowDown, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TrailerSectionItem, TrailerCategory } from "@/lib/db/trailerSection";

const CATEGORY_COLORS: Record<TrailerCategory, string> = {
  Theatre: "bg-blue-100 text-blue-700 border-blue-200",
  "OTT Series": "bg-purple-100 text-purple-700 border-purple-200",
  "OTT Movies": "bg-green-100 text-green-700 border-green-200",
  Upcoming: "bg-orange-100 text-orange-700 border-orange-200",
};

export function TrailerItemCard({
  item,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  onMoveTo,
}: {
  item: TrailerSectionItem;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onMoveTo: (newIndex: number) => void;
}) {
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

      {/* Thumbnail */}
      <td className="w-24 py-2 px-2">
        <Image
          src={item.thumbnailUrl}
          alt={item.title}
          width={80}
          height={45}
          className="h-11 w-20 rounded object-cover"
        />
      </td>

      {/* Title & meta */}
      <td className="py-2 pr-2">
        <p className="text-sm font-medium leading-snug line-clamp-1">
          {item.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {item.mediaType === "tv" ? "TV" : "Movie"} &middot;{" "}
          {item.releaseDate || "—"}
        </p>
      </td>

      {/* Category badge */}
      <td className="w-24 py-2 px-1">
        <Badge
          variant="outline"
          className={cn("text-[10px] font-medium", CATEGORY_COLORS[item.category])}
        >
          {item.category}
        </Badge>
      </td>

      {/* YouTube link */}
      <td className="w-10 py-2">
        <a
          href={`https://youtube.com/watch?v=${item.youtubeKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-700"
          title="Open on YouTube"
        >
          <ExternalLink className="size-3.5" />
        </a>
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
