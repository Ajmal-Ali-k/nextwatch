"use client";

import Image from "next/image";
import { GripVertical, Trash2, ExternalLink } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TRAILER_CATEGORIES,
  type TrailerSectionItem,
  type TrailerCategory,
} from "@/lib/db/trailerSection";

const CATEGORY_COLORS: Record<TrailerCategory, string> = {
  Theatre: "bg-blue-100 text-blue-700 border-blue-200",
  "OTT Series": "bg-purple-100 text-purple-700 border-purple-200",
  "OTT Movies": "bg-green-100 text-green-700 border-green-200",
  Upcoming: "bg-orange-100 text-orange-700 border-orange-200",
};

export function TrailerItemCard({
  item,
  index,
  sortableId,
  onRemove,
  onCategoryChange,
}: {
  item: TrailerSectionItem;
  index: number;
  sortableId: string;
  onRemove: () => void;
  onCategoryChange: (category: TrailerCategory) => void;
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

      {/* Category select */}
      <td className="w-28 py-2 px-1">
        <select
          value={item.category}
          onChange={(e) => onCategoryChange(e.target.value as TrailerCategory)}
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium appearance-none cursor-pointer pr-5 bg-size-[12px] bg-position-[right_4px_center] bg-no-repeat",
            CATEGORY_COLORS[item.category]
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          }}
        >
          {TRAILER_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
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
