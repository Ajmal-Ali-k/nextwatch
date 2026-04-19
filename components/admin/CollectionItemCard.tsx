"use client";

import Image from "next/image";
import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { posterUrl } from "@/lib/tmdb/constants";
import type { HomeSectionItem } from "@/lib/db/homeSection";

export function CollectionItemCard({
  item,
  index,
  sortableId,
  onRemove,
}: {
  item: HomeSectionItem;
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

  const thumb = posterUrl(item.posterPath);

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
