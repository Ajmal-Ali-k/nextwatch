"use client";

import Image from "next/image";
import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  sortableId,
  onRemove,
}: {
  item: HeroSlideItem;
  index: number;
  sortableId: string;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b last:border-b-0",
        isDragging
          ? "relative z-50 bg-white shadow-lg shadow-black/10 ring-2 ring-gray-900/10"
          : "hover:bg-gray-50/50"
      )}
    >
      {/* Drag handle + position */}
      <td className="w-16 py-2 pl-2 pr-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={cn(
              "flex size-7 cursor-grab items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600",
              isDragging && "cursor-grabbing text-gray-600"
            )}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <span className="text-xs tabular-nums text-gray-400 select-none">
            {index + 1}
          </span>
        </div>
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
      <td className="w-20 py-2 pr-3">
        <div className="flex items-center justify-end">
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
