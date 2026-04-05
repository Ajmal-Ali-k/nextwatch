import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart } from "lucide-react";

import { DetailCreditsSection } from "@/components/DetailCreditsSection";
import { DetailSectionHeading } from "@/components/DetailSectionHeading";
import MoviesRow, { type Movie } from "@/components/MoviesRow";
import { MovieGallery } from "@/components/MovieGallery";
import { MovieDetailWatchProviders } from "@/components/MovieDetailWatchProviders";
import { MovieTrailerModal } from "@/components/MovieTrailerModal";
import type { TvDetailPageData } from "@/lib/tmdb/tvDetail";

function toRecommendedShows(recommended: TvDetailPageData["recommended"]): Movie[] {
  return recommended.map((m) => ({
    id: m.id,
    title: m.title,
    date: m.date,
    image: m.image,
  }));
}

export default function TvDetailView({ data }: { data: TvDetailPageData }) {
  const recommendedShows = toRecommendedShows(data.recommended);

  return (
    <div className="text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0">
          {data.backdropUrl ? (
            <Image
              src={data.backdropUrl}
              alt=""
              fill
              className="object-cover object-center"
              priority
              quality={90}
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-900" />
          )}
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-neutral-900 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen container flex-col justify-center py-16">
          <div className="px-4 sm:px-6">
            <div className="mb-6">
              <h1 className="font-(family-name:--font-anton) text-5xl uppercase tracking-tight sm:text-6xl lg:text-7xl">
                {data.title}
              </h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#F5C518]">
                First aired
              </p>
              <p className="text-lg font-bold sm:text-xl">{data.firstAirDateFormatted}</p>
              <p className="mt-1 text-sm text-white/70">{data.statusLabel}</p>
              {data.episodeRuntimeLabel ? (
                <p className="mt-1 text-sm text-white/70">
                  Avg. episode: {data.episodeRuntimeLabel}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-8 sm:flex-row sm:gap-10 lg:gap-14">
              <div className="w-[180px] shrink-0 sm:w-[200px] lg:w-[240px]">
                <div className="relative aspect-2/3 overflow-hidden rounded-md shadow-2xl">
                  {data.posterUrl ? (
                    <Image
                      src={data.posterUrl}
                      alt={data.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 180px, 240px"
                      priority
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-black/40 text-sm text-white/40">
                      No poster
                    </div>
                  )}
                </div>
              </div>

              <div className="flex max-w-xl flex-col gap-5">
                {data.genres.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {data.genres.map((genre, i) => (
                      <span
                        key={genre}
                        className={`rounded-full border px-5 py-1.5 text-sm font-medium transition ${
                          i === 0
                            ? "border-[#F5C518] bg-[#F5C518]/20 text-white"
                            : "border-white/30 text-white/90 hover:border-white/60"
                        }`}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="text-sm leading-relaxed text-white/75 sm:text-base">
                  {data.overview}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {data.trailerYoutubeKey ? (
                    <MovieTrailerModal
                      youtubeKey={data.trailerYoutubeKey}
                      movieTitle={data.title}
                    />
                  ) : null}
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-[#E50914] px-6 py-2.5 text-sm font-medium text-white transition hover:border-white/60 hover:bg-white/5"
                  >
                    <Bookmark className="size-4" />
                    Add to Watchlist
                  </button>
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-full border border-[#E50914] text-white transition hover:border-white/60 hover:bg-white/5"
                    aria-label="Favorite"
                  >
                    <Heart className="size-4" />
                  </button>
                </div>

                <MovieDetailWatchProviders tvId={data.id} mediaTitle={data.title} />
              </div>
            </div>

            <DetailCreditsSection cast={data.cast} crew={data.crew} />

            {data.gallery.length > 0 ? (
              <div className="mt-12 border-t border-white/10 pt-10" id="gallery">
                <DetailSectionHeading className="mb-6">Gallery</DetailSectionHeading>
                <MovieGallery images={data.gallery} />
              </div>
            ) : null}

            <p className="mt-8 text-[10px] leading-snug text-white/40">
              This product uses the TMDB API but is not endorsed or certified by TMDB.{" "}
              <Link
                href={`https://www.themoviedb.org/tv/${data.id}`}
                className="underline hover:text-white/60"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on TMDB
              </Link>
            </p>
          </div>
        </div>
      </section>

      {recommendedShows.length > 0 ? (
        <section className="bg-black">
          <div className="mx-auto container py-16">
            <MoviesRow
              title="Similar shows"
              heading={
                <>
                  You Might Also Like
                </>
              }
              movies={recommendedShows}
              showViewAll={false}
              linkBase="tv"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
