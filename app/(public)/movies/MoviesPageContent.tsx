"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { MoviePoster } from "@/components/MoviePoster";
import { useRegionLanguage } from "@/components/RegionLanguageProvider";
import {
  parseMoviesDiscoverParams,
  useMoviesDiscoverUrl,
} from "@/lib/movies/discoverUrlState";
import { cn } from "@/lib/utils";
import {
  DISCOVER_SORT_OPTIONS,
  type DiscoverSortValue,
} from "@/lib/tmdb/discoverSort";
import { providerLogoUrl } from "@/lib/tmdb/constants";
import {
  filterIndiaOnlyProvidersForRegion,
  getProviderIdForRegion,
  isIndiaOnlyOttKey,
  MAJOR_OTT_PLATFORM_KEYS,
  MAJOR_PLATFORM_FALLBACK_INITIALS,
  MAJOR_PLATFORM_FALLBACK_LABEL,
  majorProviderIdsExcludedFromMore,
  majorProviderIdsForRegion,
  resolveMajorProviderId,
  type OttPlatformKey,
} from "@/lib/tmdb/platforms";
import type { NormalizedDiscoverMovie } from "@/lib/tmdb/types";

type PlatformSelection =
  | { kind: "all" }
  | { kind: "preset"; key: OttPlatformKey }
  | { kind: "custom"; providerId: number; label: string; logoPath: string | null };

type DiscoverJson = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: NormalizedDiscoverMovie[];
};

type GenresJson = {
  genres: { id: number; name: string }[];
};

type WatchProvidersJson = {
  providers: {
    providerId: number;
    name: string;
    logoPath: string | null;
    displayPriority: number;
  }[];
};

const selectClass =
  "appearance-none rounded-full border border-white/20 bg-black/25 py-2 pl-3 pr-8 text-sm text-white/90 [color-scheme:dark] backdrop-blur-sm transition hover:border-white/35 focus-visible:border-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30";

function formatReleaseDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const MAX_PAGE_BUTTONS = 9;

export default function MoviesPageContent() {
  const { watchRegion, languages } = useRegionLanguage();
  const languagesParam = languages.join(",");
  const { parsed, replace, searchParams } = useMoviesDiscoverUrl();
  const page = parsed.page;
  const sortBy = parsed.sortBy;
  const genreId = parsed.genreId;

  const [morePlatformsOpen, setMorePlatformsOpen] = useState(false);
  const morePlatformsRef = useRef<HTMLDivElement>(null);
  const prevWatchRegionRef = useRef(watchRegion);

  useEffect(() => {
    const prev = prevWatchRegionRef.current;
    if (prev !== watchRegion) {
      prevWatchRegionRef.current = watchRegion;
      const cur = parseMoviesDiscoverParams(searchParams);
      let plat = cur.parsedPlatform;
      let need = false;
      if (plat.kind === "custom") {
        plat = { kind: "all" };
        need = true;
      } else if (
        plat.kind === "preset" &&
        isIndiaOnlyOttKey(plat.key) &&
        watchRegion.toUpperCase() !== "IN"
      ) {
        plat = { kind: "all" };
        need = true;
      }
      if (need) queueMicrotask(() => replace({ parsedPlatform: plat, page: 1 }));
    }
  }, [watchRegion, searchParams, replace]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const el = morePlatformsRef.current;
      if (!el?.contains(event.target as Node)) {
        setMorePlatformsOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const platformUnavailable =
    parsed.parsedPlatform.kind === "preset" &&
    getProviderIdForRegion(watchRegion, parsed.parsedPlatform.key) === undefined;

  const indiaOnlyPlatformUnavailable =
    platformUnavailable &&
    parsed.parsedPlatform.kind === "preset" &&
    isIndiaOnlyOttKey(parsed.parsedPlatform.key);

  useEffect(() => {
    if (!platformUnavailable) return;
    queueMicrotask(() => replace({ parsedPlatform: { kind: "all" }, page: 1 }));
  }, [platformUnavailable, replace]);

  const genresQuery = useQuery({
    queryKey: ["movie-genres", "en-US", "fill-empty-names"],
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `/api/movies/genres?language=en-US`,
        { signal }
      );
      const data = (await res.json()) as GenresJson & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load genres");
      return data.genres ?? [];
    },
    staleTime: 86_400_000,
  });

  /** English catalog only: localized TMDB provider names break name-based resolution (e.g. ml-IN). */
  const watchProvidersQuery = useQuery({
    queryKey: ["watch-providers", watchRegion, "en-US"],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ watchRegion, language: "en-US" });
      const res = await fetch(`/api/movies/watch-providers?${params.toString()}`, {
        signal,
      });
      const data = (await res.json()) as WatchProvidersJson & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load providers");
      return data.providers ?? [];
    },
    staleTime: 86_400_000,
  });

  const providersList = useMemo(
    () =>
      filterIndiaOnlyProvidersForRegion(
        watchRegion,
        watchProvidersQuery.data ?? []
      ),
    [watchProvidersQuery.data, watchRegion]
  );

  const majorExcludeIds = useMemo(() => {
    if (!providersList.length) return majorProviderIdsForRegion(watchRegion);
    return majorProviderIdsExcludedFromMore(watchRegion, providersList);
  }, [providersList, watchRegion]);

  const otherProviders = useMemo(
    () => providersList.filter((p) => !majorExcludeIds.has(p.providerId)),
    [providersList, majorExcludeIds]
  );

  const providersById = useMemo(
    () => new Map(providersList.map((p) => [p.providerId, p] as const)),
    [providersList]
  );

  const platformSelection = useMemo((): PlatformSelection => {
    const p = parsed.parsedPlatform;
    if (p.kind === "custom") {
      const meta = providersById.get(p.providerId);
      return {
        kind: "custom",
        providerId: p.providerId,
        label: meta?.name ?? `Provider ${p.providerId}`,
        logoPath: meta?.logoPath ?? null,
      };
    }
    if (p.kind === "preset") return { kind: "preset", key: p.key };
    return { kind: "all" };
  }, [parsed.parsedPlatform, providersById]);

  const providerId = useMemo(() => {
    if (platformSelection.kind === "all") return undefined;
    if (platformSelection.kind === "custom") return platformSelection.providerId;
    return resolveMajorProviderId(watchRegion, platformSelection.key, providersList);
  }, [platformSelection, watchRegion, providersList]);

  /** Preset providerId uses `resolveMajorProviderId`; empty list only has static fallback → wrong TMDB id + empty discover. */
  const discoverEnabled =
    !platformUnavailable &&
    (platformSelection.kind === "all" ||
      platformSelection.kind === "custom" ||
      watchProvidersQuery.isFetched);

  const discoverQuery = useQuery({
    queryKey: [
      "movies-discover",
      watchRegion,
      languagesParam,
      page,
      providerId ?? "all",
      sortBy,
      genreId ?? "all",
    ],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        watchRegion,
        languages: languagesParam,
        page: String(page),
        sortBy,
      });
      if (providerId !== undefined) params.set("providerId", String(providerId));
      if (genreId !== null) params.set("genreId", String(genreId));

      const res = await fetch(`/api/movies/discover?${params.toString()}`, {
        signal,
      });
      const data = (await res.json()) as DiscoverJson & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      return data;
    },
    enabled: discoverEnabled,
    placeholderData: keepPreviousData,
  });

  const movies = discoverQuery.data?.results ?? [];
  const totalPages = Math.max(1, discoverQuery.data?.totalPages ?? 1);
  const totalResults = discoverQuery.data?.totalResults ?? 0;
  const errorMessage =
    discoverQuery.error instanceof Error ? discoverQuery.error.message : null;

  useEffect(() => {
    if (!discoverEnabled || !discoverQuery.data || platformUnavailable) return;
    const tp = Math.max(1, discoverQuery.data.totalPages ?? 1);
    if (page > tp) queueMicrotask(() => replace({ page: tp }));
  }, [discoverEnabled, discoverQuery.data, page, platformUnavailable, replace]);

  const goToPage = (next: number) => {
    replace({ page: next });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= MAX_PAGE_BUTTONS) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const nums = new Set<number>();
    nums.add(1);
    nums.add(totalPages);
    for (let d = -2; d <= 2; d++) {
      const p = page + d;
      if (p >= 1 && p <= totalPages) nums.add(p);
    }
    return [...nums].sort((a, b) => a - b);
  }, [page, totalPages]);

  const waitingForProviderCatalog =
    !platformUnavailable &&
    platformSelection.kind === "preset" &&
    !watchProvidersQuery.isFetched;

  const loading =
    platformUnavailable
      ? false
      : waitingForProviderCatalog ||
        (discoverQuery.isPending && !discoverQuery.data);

  const showPlatformBadge =
    (platformSelection.kind === "preset" || platformSelection.kind === "custom") &&
    !platformUnavailable;
  const isFetchingPage = discoverQuery.isFetching && !discoverQuery.isPending;

  const moreButtonActive = platformSelection.kind === "custom";

  return (
    <main className="relative min-h-screen pb-16 pt-12 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-neutral-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(214,33,42,0.45)_0%,rgba(214,33,42,0.18)_28%,rgba(10,10,10,0.92)_62%,rgba(10,10,10,1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.7)_30%,rgba(10,10,10,0.35)_55%,rgba(10,10,10,0.95)_100%)]" />
      </div>

      <div className="mx-auto container">
        <div className="mt-2 px-4 sm:px-6 lg:px-0">
          <div className="max-w-3xl">
            <h1 className="font-(family-name:--font-anton) text-4xl sm:text-5xl uppercase tracking-tight">
              New Movies on OTT
            </h1>

            <p className="mt-4 text-xs font-semibold text-white/70">
              Filter by Platform
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  replace({ parsedPlatform: { kind: "all" }, page: 1 });
                  setMorePlatformsOpen(false);
                }}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center rounded-xl border px-3 text-xs font-semibold transition",
                  platformSelection.kind === "all"
                    ? "border-[#E50914] bg-[#E50914]/15 text-white"
                    : "border-white/15 bg-white/5 text-white/85 hover:border-white/30"
                )}
                aria-pressed={platformSelection.kind === "all"}
                aria-label="All platforms"
              >
                All
              </button>
              {MAJOR_OTT_PLATFORM_KEYS.map((key) => {
                const providerIdForKey = resolveMajorProviderId(watchRegion, key, providersList);
                if (providerIdForKey === undefined) return null;
                const meta = providersById.get(providerIdForKey);
                const label = meta?.name ?? MAJOR_PLATFORM_FALLBACK_LABEL[key];
                const logoSrc = meta ? providerLogoUrl(meta.logoPath) : null;
                const active =
                  platformSelection.kind === "preset" && platformSelection.key === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      const cur = parsed.parsedPlatform;
                      if (cur.kind === "preset" && cur.key === key) {
                        replace({ parsedPlatform: { kind: "all" }, page: 1 });
                      } else {
                        replace({ parsedPlatform: { kind: "preset", key }, page: 1 });
                      }
                    }}
                    className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border transition ${
                      active
                        ? "border-[#E50914] bg-[#E50914]/15"
                        : "border-white/15 bg-white/5 hover:border-white/30"
                    }`}
                    aria-label={label}
                    title={label}
                  >
                    {logoSrc ? (
                      <Image
                        src={logoSrc}
                        alt=""
                        width={26}
                        height={26}
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <span
                        className={cn(
                          "text-[9px] font-bold leading-none text-white/75",
                          watchProvidersQuery.isPending && "animate-pulse text-white/45"
                        )}
                        aria-hidden
                      >
                        {MAJOR_PLATFORM_FALLBACK_INITIALS[key]}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="relative" ref={morePlatformsRef}>
                <button
                  type="button"
                  onClick={() => setMorePlatformsOpen((o) => !o)}
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition",
                    moreButtonActive
                      ? "border-[#E50914] bg-[#E50914]/15 text-white"
                      : "border-white/15 bg-white/5 text-white/85 hover:border-white/30"
                  )}
                  aria-expanded={morePlatformsOpen}
                  aria-haspopup="dialog"
                  aria-label="More streaming services"
                >
                  {moreButtonActive && platformSelection.kind === "custom" ? (
                    <>
                      {providerLogoUrl(platformSelection.logoPath) ? (
                        <Image
                          src={providerLogoUrl(platformSelection.logoPath)!}
                          alt=""
                          width={20}
                          height={20}
                          className="size-5 rounded object-contain"
                        />
                      ) : (
                        <span className="flex size-5 items-center justify-center rounded bg-white/10 text-[8px] font-bold">
                          {platformSelection.label.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="max-w-20 truncate">{platformSelection.label}</span>
                    </>
                  ) : (
                    "More"
                  )}
                  <ChevronDown
                    className={cn(
                      "size-4 text-white/70 transition-transform",
                      morePlatformsOpen && "rotate-180"
                    )}
                    aria-hidden
                  />
                </button>

                {morePlatformsOpen ? (
                  <div
                    className="absolute left-0 top-full z-60 mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-xl border border-white/25 bg-red-950/95 shadow-xl shadow-black/40 ring-1 ring-black/30 backdrop-blur-md sm:left-auto sm:right-0"
                    role="dialog"
                    aria-label="More streaming services"
                  >
                    <div className="border-b border-white/10 bg-red-900/40 px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                        Other services
                      </p>
                      {/* <p className="text-xs text-white/80">
                        TMDB providers in {watchRegion}; tap to filter
                      </p> */}
                    </div>
                    <div className="max-h-[min(55vh,22rem)] overflow-y-auto p-2">
                      {watchProvidersQuery.isPending ? (
                        <p className="px-2 py-6 text-center text-sm text-white/55">Loading…</p>
                      ) : watchProvidersQuery.isError ? (
                        <p className="px-2 py-4 text-center text-sm text-red-300" role="alert">
                          {watchProvidersQuery.error instanceof Error
                            ? watchProvidersQuery.error.message
                            : "Could not load providers"}
                        </p>
                      ) : otherProviders.length === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-white/55">
                          No other providers listed.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {otherProviders.map((prov) => {
                            const selected =
                              platformSelection.kind === "custom" &&
                              platformSelection.providerId === prov.providerId;
                            const logo = providerLogoUrl(prov.logoPath);
                            return (
                              <li key={prov.providerId}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    replace({
                                      parsedPlatform: {
                                        kind: "custom",
                                        providerId: prov.providerId,
                                      },
                                      page: 1,
                                    });
                                    setMorePlatformsOpen(false);
                                  }}
                                  className={cn(
                                    "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45",
                                    selected
                                      ? "border-[#E50914] bg-[#E50914]/20 text-white"
                                      : "border-white/12 bg-white/5 text-white/90 hover:border-white/25 hover:bg-white/10"
                                  )}
                                >
                                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-black/35">
                                    {logo ? (
                                      <Image
                                        src={logo}
                                        alt=""
                                        width={36}
                                        height={36}
                                        className="size-9 object-contain"
                                      />
                                    ) : (
                                      <span className="text-[10px] font-bold text-white/50">
                                        {prov.name.slice(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate font-medium">
                                    {prov.name}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="relative">
                <label htmlFor="movies-sort" className="sr-only">
                  Sort by
                </label>
                <select
                  id="movies-sort"
                  value={sortBy}
                  onChange={(e) =>
                    replace({ sortBy: e.target.value as DiscoverSortValue, page: 1 })
                  }
                  className={selectClass}
                >
                  {DISCOVER_SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-white/60"
                  aria-hidden
                />
              </div>

              <div className="relative min-w-34">
                <label htmlFor="movies-genre" className="sr-only">
                  Genre
                </label>
                <select
                  id="movies-genre"
                  value={genreId ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    replace({ genreId: v === "" ? null : Number(v), page: 1 });
                  }}
                  disabled={genresQuery.isPending}
                  className={cn(selectClass, "w-full min-w-34", genresQuery.isPending && "opacity-60")}
                >
                  <option value="">
                    All genres
                  </option>
                  {genresQuery.data?.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-white/60"
                  aria-hidden
                />
              </div>

              {isFetchingPage ? (
                <span className="text-xs text-white/50">Updating…</span>
              ) : null}
            </div>
          </div>
        </div>

        <section className="mt-10 px-4 sm:px-6 lg:px-0">
          {errorMessage ? (
            <p className="text-sm text-red-400" role="alert">
              {errorMessage}
            </p>
          ) : null}

          {platformUnavailable ? (
            <p className="text-sm text-white/70">
              {indiaOnlyPlatformUnavailable ? (
                <>
                  Sony LIV and Zee5 filters are for{" "}
                  <span className="font-semibold text-white/85">India (IN)</span> only. Choose{" "}
                  <span className="font-semibold text-white/85">All</span>, another platform, or
                  switch region in the header.
                </>
              ) : (
                <>
                  This streaming service is not mapped for your selected region in TMDB. Choose
                  another platform or change region in the header.
                </>
              )}
            </p>
          ) : null}

          {loading ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-2/3 animate-pulse rounded-xl border border-white/10 bg-white/10"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {movies.map((m) => (
                <Link
                  key={m.id}
                  href={`/movies/${m.id}`}
                  className="group block rounded-xl text-inherit no-underline outline-offset-2 focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  <article className="flex flex-col">
                  <div className="relative aspect-2/3 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <MoviePoster
                      title={m.title}
                      posterUrl={m.posterUrl}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />

                    {showPlatformBadge ? (
                      <div
                        className="absolute bottom-2 right-2 flex size-8 items-center justify-center overflow-hidden rounded-lg bg-black/55 backdrop-blur-sm"
                        aria-label={
                          platformSelection.kind === "preset"
                            ? (() => {
                                const pid = resolveMajorProviderId(
                                  watchRegion,
                                  platformSelection.key,
                                  providersList
                                );
                                const m =
                                  pid !== undefined ? providersById.get(pid) : undefined;
                                return m?.name ?? MAJOR_PLATFORM_FALLBACK_LABEL[platformSelection.key];
                              })()
                            : platformSelection.label
                        }
                      >
                        {platformSelection.kind === "preset" ? (
                          (() => {
                            const pid = resolveMajorProviderId(
                              watchRegion,
                              platformSelection.key,
                              providersList
                            );
                            const m = pid !== undefined ? providersById.get(pid) : undefined;
                            const badgeLabel =
                              m?.name ?? MAJOR_PLATFORM_FALLBACK_LABEL[platformSelection.key];
                            const badgeLogo = m ? providerLogoUrl(m.logoPath) : null;
                            return badgeLogo ? (
                              <Image
                                src={badgeLogo}
                                alt={badgeLabel}
                                width={18}
                                height={18}
                                className="h-4.5 w-4.5 object-contain"
                              />
                            ) : (
                              <span className="text-[8px] font-bold leading-none text-white/90">
                                {MAJOR_PLATFORM_FALLBACK_INITIALS[platformSelection.key]}
                              </span>
                            );
                          })()
                        ) : (
                          (() => {
                            const customLogo = providerLogoUrl(platformSelection.logoPath);
                            return customLogo ? (
                              <Image
                                src={customLogo}
                                alt={platformSelection.label}
                                width={18}
                                height={18}
                                className="h-4.5 w-4.5 object-contain"
                              />
                            ) : (
                              <span
                                className="text-[9px] font-bold leading-none text-white/90"
                                aria-hidden
                              >
                                {platformSelection.label.slice(0, 2).toUpperCase()}
                              </span>
                            );
                          })()
                        )}
                      </div>
                    ) : null}
                  </div>

                  <h3 className="mt-3 font-(family-name:--font-anton) text-base leading-snug text-white line-clamp-2">
                    {m.title}
                  </h3>
                  <p className="mt-1 text-xs text-white/60">{formatReleaseDate(m.releaseDate)}</p>
                  </article>
                </Link>
              ))}
            </div>
          )}

          {!platformUnavailable && !loading && !errorMessage && movies.length > 0 ? (
            <nav
              className="mt-10 flex flex-col items-center gap-4 border-t border-white/10 pt-10"
              aria-label="Pagination"
            >
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || discoverQuery.isFetching}
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/25 px-3 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:border-white/35 disabled:pointer-events-none disabled:opacity-35"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Previous
                </button>
                <p className="min-w-40 text-center text-sm text-white/80">
                  Page <span className="font-semibold text-white">{page}</span> of{" "}
                  <span className="font-semibold text-white">{totalPages}</span>
                  <span className="mt-0.5 block text-xs text-white/50">
                    {totalResults.toLocaleString()} titles
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages || discoverQuery.isFetching}
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/25 px-3 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:border-white/35 disabled:pointer-events-none disabled:opacity-35"
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </div>

              {totalPages > 1 ? (
                <div className="flex max-w-full flex-wrap justify-center gap-1.5">
                  {pageNumbers.map((p, idx) => {
                    const prevNum = pageNumbers[idx - 1];
                    const showEllipsis = idx > 0 && p - prevNum > 1;
                    return (
                      <span key={p} className="flex items-center gap-1.5">
                        {showEllipsis ? (
                          <span className="px-1 text-sm text-white/35" aria-hidden>
                            …
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => goToPage(p)}
                          disabled={discoverQuery.isFetching}
                          aria-label={`Page ${p}`}
                          aria-current={p === page ? "page" : undefined}
                          className={`min-w-9 rounded-lg border px-2.5 py-1.5 text-sm transition disabled:opacity-40 ${
                            p === page
                              ? "border-[#E50914] bg-[#E50914]/20 text-white"
                              : "border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10"
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </nav>
          ) : null}

          {!loading && !errorMessage && !platformUnavailable && movies.length === 0 ? (
            <p className="text-sm text-white/60">No movies found for these filters.</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
