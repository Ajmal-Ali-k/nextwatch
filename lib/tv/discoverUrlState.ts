import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { MAJOR_OTT_PLATFORM_KEYS, type OttPlatformKey } from "@/lib/tmdb/platforms";
import { parseTvDiscoverSort, type TvDiscoverSortValue } from "@/lib/tmdb/tvDiscoverSort";

const CONTROL_KEYS = ["platform", "provider", "sort", "genre", "page"] as const;

const OTT_KEY_SET = new Set<string>(MAJOR_OTT_PLATFORM_KEYS);

export type ParsedPlatform =
  | { kind: "all" }
  | { kind: "preset"; key: OttPlatformKey }
  | { kind: "custom"; providerId: number };

export type TvShowsDiscoverUrlParsed = {
  parsedPlatform: ParsedPlatform;
  sortBy: TvDiscoverSortValue;
  genreId: number | null;
  page: number;
};

export type TvShowsDiscoverUrlUpdate = {
  parsedPlatform?: ParsedPlatform;
  sortBy?: TvDiscoverSortValue;
  genreId?: number | null;
  page?: number;
};

function parseGenre(v: string | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parsePage(v: string | null): number {
  if (v == null || v === "") return 1;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export function parseTvShowsDiscoverParams(
  searchParams: URLSearchParams
): TvShowsDiscoverUrlParsed {
  const providerRaw = searchParams.get("provider");
  if (providerRaw) {
    const n = Number(providerRaw);
    if (Number.isInteger(n) && n > 0) {
      return {
        parsedPlatform: { kind: "custom", providerId: n },
        sortBy: parseTvDiscoverSort(searchParams.get("sort")),
        genreId: parseGenre(searchParams.get("genre")),
        page: parsePage(searchParams.get("page")),
      };
    }
  }

  const platformRaw = searchParams.get("platform");
  if (platformRaw && OTT_KEY_SET.has(platformRaw)) {
    return {
      parsedPlatform: { kind: "preset", key: platformRaw as OttPlatformKey },
      sortBy: parseTvDiscoverSort(searchParams.get("sort")),
      genreId: parseGenre(searchParams.get("genre")),
      page: parsePage(searchParams.get("page")),
    };
  }

  return {
    parsedPlatform: { kind: "all" },
    sortBy: parseTvDiscoverSort(searchParams.get("sort")),
    genreId: parseGenre(searchParams.get("genre")),
    page: parsePage(searchParams.get("page")),
  };
}

function buildParamsFromState(state: TvShowsDiscoverUrlParsed): URLSearchParams {
  const p = new URLSearchParams();
  if (state.parsedPlatform.kind === "custom") {
    p.set("provider", String(state.parsedPlatform.providerId));
  } else if (state.parsedPlatform.kind === "preset") {
    p.set("platform", state.parsedPlatform.key);
  }
  if (state.sortBy !== "popularity.desc") {
    p.set("sort", state.sortBy);
  }
  if (state.genreId !== null) {
    p.set("genre", String(state.genreId));
  }
  if (state.page > 1) {
    p.set("page", String(state.page));
  }
  return p;
}

function mergeIntoCurrent(current: URLSearchParams, built: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams(current.toString());
  for (const k of CONTROL_KEYS) {
    out.delete(k);
  }
  built.forEach((v, k) => {
    out.set(k, v);
  });
  return out;
}

export function useTvShowsDiscoverUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const parsed = useMemo(
    () => parseTvShowsDiscoverParams(searchParams),
    [searchParams]
  );

  const replace = useCallback(
    (update: TvShowsDiscoverUrlUpdate) => {
      const cur = parseTvShowsDiscoverParams(searchParams);
      const nextState: TvShowsDiscoverUrlParsed = {
        parsedPlatform: update.parsedPlatform ?? cur.parsedPlatform,
        sortBy: update.sortBy ?? cur.sortBy,
        genreId: update.genreId !== undefined ? update.genreId : cur.genreId,
        page: update.page !== undefined ? update.page : cur.page,
      };
      const built = buildParamsFromState(nextState);
      const merged = mergeIntoCurrent(searchParams, built);
      const q = merged.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { parsed, replace, searchParams };
}
