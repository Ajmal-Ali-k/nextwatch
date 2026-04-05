export const WATCHLIST_STORAGE_KEY = "nextwatch.watchlist";

export const WATCHLIST_CHANGE_EVENT = "nextwatch:watchlist";

export type WatchlistMediaKind = "movie" | "tv";

export type WatchlistItem = {
  kind: WatchlistMediaKind;
  id: number;
  title: string;
  posterUrl: string | null;
  /** Short date for cards (e.g. release / first air). */
  dateLine: string;
  addedAt: number;
};

function emitChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(WATCHLIST_CHANGE_EVENT));
  }
}

function isValidItem(x: unknown): x is WatchlistItem {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    (o.kind === "movie" || o.kind === "tv") &&
    typeof o.id === "number" &&
    Number.isInteger(o.id) &&
    o.id > 0 &&
    typeof o.title === "string" &&
    typeof o.dateLine === "string" &&
    typeof o.addedAt === "number" &&
    (o.posterUrl === null || typeof o.posterUrl === "string")
  );
}

export function readWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidItem).sort((a, b) => b.addedAt - a.addedAt);
  } catch {
    return [];
  }
}

export function writeWatchlist(items: WatchlistItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
  emitChange();
}

export function subscribeWatchlist(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === WATCHLIST_STORAGE_KEY || e.key === null) listener();
  };
  const onCustom = () => listener();

  window.addEventListener("storage", onStorage);
  window.addEventListener(WATCHLIST_CHANGE_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(WATCHLIST_CHANGE_EVENT, onCustom);
  };
}

let cachedSnapshot: WatchlistItem[] = [];
let cachedJson = "";

/** Stable reference when contents unchanged — required for `useSyncExternalStore`. */
export function getWatchlistSnapshot(): WatchlistItem[] {
  const list = readWatchlist();
  const j = JSON.stringify(list);
  if (j === cachedJson) return cachedSnapshot;
  cachedJson = j;
  cachedSnapshot = list;
  return list;
}

export function toggleWatchlistEntry(
  partial: Omit<WatchlistItem, "addedAt">
): WatchlistItem[] {
  const list = readWatchlist();
  const idx = list.findIndex((x) => x.kind === partial.kind && x.id === partial.id);
  let next: WatchlistItem[];
  if (idx >= 0) {
    next = [...list.slice(0, idx), ...list.slice(idx + 1)];
  } else {
    next = [
      { ...partial, addedAt: Date.now() },
      ...list.filter((x) => !(x.kind === partial.kind && x.id === partial.id)),
    ];
  }
  writeWatchlist(next);
  return next;
}
