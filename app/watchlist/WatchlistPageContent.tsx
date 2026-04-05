"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { MoviePoster } from "@/components/MoviePoster";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";

/** If `line` is ISO `YYYY-MM-DD`, format nicely; otherwise use as stored (e.g. long month name). */
function displayDateLine(line: string): string {
  if (!line) return "—";
  const trimmed = line.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    }
  }
  return line;
}

export default function WatchlistPageContent() {
  const { items, toggle } = useWatchlist();

  return (
    <main className="relative min-h-screen pb-16 pt-12 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-neutral-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(214,33,42,0.45)_0%,rgba(214,33,42,0.18)_28%,rgba(10,10,10,0.92)_62%,rgba(10,10,10,1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.7)_30%,rgba(10,10,10,0.35)_55%,rgba(10,10,10,0.95)_100%)]" />
      </div>

      <div className="mx-auto container px-4 sm:px-6 lg:px-0">
        <h1 className="font-(family-name:--font-anton) text-3xl uppercase tracking-tight text-white sm:text-4xl md:text-5xl">
          Watchlist
        </h1>
        {/* <p className="mt-2 text-sm text-white/60">
          Saved on this device only. {items.length} {items.length === 1 ? "title" : "titles"}.
        </p> */}

        {items.length === 0 ? (
          <p className="mt-12 text-center text-sm text-white/55">
            Nothing saved yet. Open a movie or TV show and tap{" "}
            <span className="font-medium text-white/80">Add to Watchlist</span>.
          </p>
        ) : (
          <section className="mt-10" aria-label="Watchlist items">
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {items.map((item) => {
                const href = item.kind === "movie" ? `/movies/${item.id}` : `/tv-shows/${item.id}`;
                const displayDate = displayDateLine(item.dateLine);
                return (
                  <div key={`${item.kind}-${item.id}`} className="group relative">
                    <Link
                      href={href}
                      className="block rounded-xl text-inherit no-underline outline-offset-2 focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      <article className="flex flex-col">
                        <div className="relative aspect-2/3 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                          <MoviePoster
                            title={item.title}
                            posterUrl={item.posterUrl}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                        <span
                          className={cn(
                            "mt-2 inline-flex w-fit rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            item.kind === "movie"
                              ? "border-white/20 text-white/65"
                              : "border-[#F5C518]/40 text-[#F5C518]/90"
                          )}
                        >
                          {item.kind === "movie" ? "Movie" : "TV"}
                        </span>
                        <h2 className="mt-1 font-(family-name:--font-anton) text-base leading-snug text-white line-clamp-2">
                          {item.title}
                        </h2>
                        <p className="mt-1 text-xs text-white/60">{displayDate}</p>
                      </article>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle({
                          kind: item.kind,
                          id: item.id,
                          title: item.title,
                          posterUrl: item.posterUrl,
                          dateLine: item.dateLine,
                        });
                      }}
                      className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full border border-white/25 bg-black/70 text-white shadow-md backdrop-blur-sm transition hover:border-red-400/60 hover:bg-red-950/80 hover:text-red-200"
                      aria-label={`Remove ${item.title} from watchlist`}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
