"use client";

import { Bookmark } from "lucide-react";

import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";
import type { WatchlistMediaKind } from "@/lib/watchlist/storage";

type Props = {
  kind: WatchlistMediaKind;
  id: number;
  title: string;
  posterUrl: string | null;
  dateLine: string;
};

export function MediaDetailWatchlistButton({
  kind,
  id,
  title,
  posterUrl,
  dateLine,
}: Props) {
  const { toggle, isSaved } = useWatchlist();
  const saved = isSaved(kind, id);

  return (
    <button
      type="button"
      onClick={() => toggle({ kind, id, title, posterUrl, dateLine })}
      className={cn(
        "flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-medium text-white transition hover:border-white/60 hover:bg-white/5",
        saved
          ? "border-[#F5C518] bg-[#F5C518]/15 text-white"
          : "border-[#E50914]"
      )}
      aria-pressed={saved}
    >
      <Bookmark className={cn("size-4 shrink-0", saved && "fill-[#F5C518] text-[#F5C518]")} />
      {saved ? "In watchlist" : "Add to Watchlist"}
    </button>
  );
}
