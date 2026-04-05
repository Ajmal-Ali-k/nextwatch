"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  getWatchlistSnapshot,
  subscribeWatchlist,
  toggleWatchlistEntry,
  type WatchlistItem,
} from "@/lib/watchlist/storage";

function getServerSnapshot(): WatchlistItem[] {
  return [];
}

export function useWatchlist() {
  const items = useSyncExternalStore(subscribeWatchlist, getWatchlistSnapshot, getServerSnapshot);

  const toggle = useCallback((entry: Omit<WatchlistItem, "addedAt">) => {
    toggleWatchlistEntry(entry);
  }, []);

  const isSaved = useCallback(
    (kind: WatchlistItem["kind"], id: number) =>
      items.some((x) => x.kind === kind && x.id === id),
    [items]
  );

  return { items, toggle, isSaved };
}
