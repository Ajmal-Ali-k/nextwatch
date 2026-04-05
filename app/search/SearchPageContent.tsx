"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { MoviePoster } from "@/components/MoviePoster";
import { cn } from "@/lib/utils";
import type { SearchMovieItem, SearchTvItem } from "@/app/api/search/route";

type SearchJson = {
  query: string;
  movies: {
    page: number;
    totalPages: number;
    totalResults: number;
    results: SearchMovieItem[];
  };
  tv: {
    page: number;
    totalPages: number;
    totalResults: number;
    results: SearchTvItem[];
  };
  error?: string;
};

const MAX_PAGE_BUTTONS = 9;

function formatListDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function parsePage(raw: string | null): number {
  if (raw == null || raw === "") return 1;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export default function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = (searchParams.get("q") ?? searchParams.get("query") ?? "").trim();
  const page = parsePage(searchParams.get("page"));

  const replacePage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const enabled = q.length >= 2;

  const query = useQuery({
    queryKey: ["combined-search", q, page],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ query: q, page: String(page) });
      const res = await fetch(`/api/search?${params.toString()}`, { signal });
      const data = (await res.json()) as SearchJson;
      if (res.status === 429) {
        throw new Error(data.error ?? "Too many searches. Please wait a moment.");
      }
      if (!res.ok) throw new Error(data.error ?? "Search failed.");
      return data;
    },
    enabled,
    placeholderData: keepPreviousData,
  });

  const movies = query.data?.movies.results ?? [];
  const tv = query.data?.tv.results ?? [];
  const movieTotalPages = query.data?.movies.totalPages ?? 1;
  const tvTotalPages = query.data?.tv.totalPages ?? 1;
  const totalPages = Math.max(1, movieTotalPages, tvTotalPages);
  const movieTotal = query.data?.movies.totalResults ?? 0;
  const tvTotal = query.data?.tv.totalResults ?? 0;
  const errorMessage = query.error instanceof Error ? query.error.message : null;

  useEffect(() => {
    if (!query.data || !enabled) return;
    const tp = Math.max(1, movieTotalPages, tvTotalPages);
    if (page > tp) queueMicrotask(() => replacePage(tp));
  }, [query.data, enabled, page, movieTotalPages, tvTotalPages, replacePage]);

  const goToPage = (next: number) => {
    replacePage(next);
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

  const loading = enabled && query.isPending && !query.data;
  const isFetchingPage = query.isFetching && !query.isPending;

  return (
    <main className="relative min-h-screen pb-16 pt-12 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-neutral-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(214,33,42,0.45)_0%,rgba(214,33,42,0.18)_28%,rgba(10,10,10,0.92)_62%,rgba(10,10,10,1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.7)_30%,rgba(10,10,10,0.35)_55%,rgba(10,10,10,0.95)_100%)]" />
      </div>

      <div className="mx-auto container px-4 sm:px-6 lg:px-0">
        <h1 className="font-(family-name:--font-anton) text-2xl uppercase tracking-tight text-white sm:text-3xl md:text-4xl">
          Search results for:{" "}
          <span className="text-[#F5C518]">&ldquo;{q || "…"}&rdquo;</span>
        </h1>
        {enabled ? (
          <p className="mt-2 text-sm text-white/60">
            {movieTotal.toLocaleString()} movies · {tvTotal.toLocaleString()} TV shows (TMDB)
            {isFetchingPage ? <span className="ml-2 text-white/40">Updating…</span> : null}
          </p>
        ) : (
          <p className="mt-2 text-sm text-white/60">
            Enter a search from the header (at least 2 characters).
          </p>
        )}

        {errorMessage ? (
          <p className="mt-6 text-sm text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {!enabled ? null : loading ? (
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-2/3 animate-pulse rounded-xl border border-white/10 bg-white/10"
              />
            ))}
          </div>
        ) : (
          <>
            <section id="movies" className="mt-10 scroll-mt-24">
              <h2 className="font-(family-name:--font-anton) mb-4 text-xl uppercase tracking-tight text-white/95 sm:text-2xl">
                Movies
              </h2>
              {movies.length === 0 ? (
                <p className="text-sm text-white/55">No movie matches on this page.</p>
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
                        </div>
                        <h3 className="mt-3 font-(family-name:--font-anton) text-base leading-snug text-white line-clamp-2">
                          {m.title}
                        </h3>
                        <p className="mt-1 text-xs text-white/60">{formatListDate(m.releaseDate)}</p>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section id="tv" className="mt-12 scroll-mt-24">
              <h2 className="font-(family-name:--font-anton) mb-4 text-xl uppercase tracking-tight text-white/95 sm:text-2xl">
                TV shows
              </h2>
              {tv.length === 0 ? (
                <p className="text-sm text-white/55">No TV matches on this page.</p>
              ) : (
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {tv.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tv-shows/${t.id}`}
                      className="group block rounded-xl text-inherit no-underline outline-offset-2 focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      <article className="flex flex-col">
                        <div className="relative aspect-2/3 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                          <MoviePoster
                            title={t.title}
                            posterUrl={t.posterUrl}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                        <h3 className="mt-3 font-(family-name:--font-anton) text-base leading-snug text-white line-clamp-2">
                          {t.title}
                        </h3>
                        <p className="mt-1 text-xs text-white/60">{formatListDate(t.firstAirDate)}</p>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {totalPages > 1 && movies.length + tv.length > 0 ? (
              <nav
                className="mt-10 flex flex-col items-center gap-4 border-t border-white/10 pt-10"
                aria-label="Pagination"
              >
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1 || query.isFetching}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/25 px-3 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:border-white/35 disabled:pointer-events-none disabled:opacity-35"
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                    Previous
                  </button>
                  <p className="min-w-40 text-center text-sm text-white/80">
                    Page <span className="font-semibold text-white">{page}</span> of{" "}
                    <span className="font-semibold text-white">{totalPages}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages || query.isFetching}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/25 px-3 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:border-white/35 disabled:pointer-events-none disabled:opacity-35"
                  >
                    Next
                    <ChevronRight className="size-4" aria-hidden />
                  </button>
                </div>
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
                          disabled={query.isFetching}
                          aria-label={`Page ${p}`}
                          aria-current={p === page ? "page" : undefined}
                          className={cn(
                            "min-w-9 rounded-lg border px-2.5 py-1.5 text-sm transition disabled:opacity-40",
                            p === page
                              ? "border-[#E50914] bg-[#E50914]/20 text-white"
                              : "border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10"
                          )}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}
                </div>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
