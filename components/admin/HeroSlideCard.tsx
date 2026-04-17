"use client";

import Image from "next/image";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { HeroSlideItem, HeroSlideSource } from "@/lib/db/heroSection";

const SOURCE_COLORS: Record<HeroSlideSource, string> = {
  tmdb: "bg-blue-100 text-blue-700 border-blue-200",
  custom: "bg-green-100 text-green-700 border-green-200",
};

const SOURCE_LABELS: Record<HeroSlideSource, string> = {
  tmdb: "TMDB",
  custom: "Custom",
};

export function HeroSlideCard({
  item,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  onMoveTo,
}: {
  item: HeroSlideItem;
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
      <td className="w-40 py-2 px-2">
        <Image
          src={item.imageUrl}
          alt={item.title}
          width={160}
          height={68}
          className="h-[68px] w-40 rounded object-cover"
        />
      </td>

      {/* Title & subtitle */}
      <td className="py-2 pr-2">
        <p className="text-sm font-medium leading-snug line-clamp-1">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {item.subtitle}
          </p>
        )}
        {item.href && (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
            {item.href}
          </p>
        )}
      </td>

      {/* Source badge */}
      <td className="w-20 py-2 px-1">
        <Badge
          variant="outline"
          className={cn("text-[10px] font-medium", SOURCE_COLORS[item.source])}
        >
          {SOURCE_LABELS[item.source]}
        </Badge>
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
