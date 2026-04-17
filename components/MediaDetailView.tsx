import Image from "next/image";
import { Heart } from "lucide-react";

import { DetailCreditsSection } from "@/components/DetailCreditsSection";
import { MediaGallerySection } from "@/components/MediaGallerySection";
import { MovieDetailWatchProviders } from "@/components/MovieDetailWatchProviders";
import { MediaDetailWatchlistButton } from "@/components/MediaDetailWatchlistButton";
import { MovieTrailerModal } from "@/components/MovieTrailerModal";
import MoviesRow, { type Movie } from "@/components/MoviesRow";
import type { MediaDetailPresentation } from "@/lib/tmdb/mediaDetailPresentation";

export default function MediaDetailView({ model }: { model: MediaDetailPresentation }) {
  const similarRowTitle = model.kind === "movie" ? "Similar Movies" : "Similar shows";

  return (
    <div className="text-white">
      <section className="relative min-h-screen">
        <div className="absolute inset-0">
          {model.backdropUrl ? (
            <Image
              src={model.backdropUrl}
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
                {model.title}
              </h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#F5C518]">
                {model.dateEyebrow}
              </p>
              <p className="text-lg font-bold sm:text-xl">{model.datePrimary}</p>
              {model.sublines.map((line) => (
                <p key={line} className="mt-1 text-sm text-white/70">
                  {line}
                </p>
              ))}
            </div>

            <div className="flex flex-col gap-8 sm:flex-row sm:gap-10 lg:gap-14">
              <div className="w-[180px] shrink-0 sm:w-[200px] lg:w-[240px]">
                <div className="relative aspect-2/3 overflow-hidden rounded-md shadow-2xl">
                  {model.posterUrl ? (
                    <Image
                      src={model.posterUrl}
                      alt={model.title}
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
                {model.languageLabel || model.genres.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {model.languageLabel ? (
                      <span className="rounded-full border border-[#F5C518] bg-[#F5C518]/20 px-5 py-1.5 text-sm font-medium text-white">
                        {model.languageLabel}
                      </span>
                    ) : null}
                    {model.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full border border-white/30 px-5 py-1.5 text-sm font-medium text-white/90 transition hover:border-white/60"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="text-sm leading-relaxed text-white/75 sm:text-base">
                  {model.overview}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {model.trailerYoutubeKey ? (
                    <MovieTrailerModal
                      youtubeKey={model.trailerYoutubeKey}
                      movieTitle={model.title}
                    />
                  ) : null}
                  <MediaDetailWatchlistButton
                    kind={model.kind}
                    id={model.id}
                    title={model.title}
                    posterUrl={model.posterUrl}
                    dateLine={model.datePrimary}
                  />
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-full border border-[#E50914] text-white transition hover:border-white/60 hover:bg-white/5"
                    aria-label="Favorite"
                  >
                    <Heart className="size-4" />
                  </button>
                </div>

                {model.kind === "movie" ? (
                  <MovieDetailWatchProviders movieId={model.id} mediaTitle={model.title} />
                ) : (
                  <MovieDetailWatchProviders tvId={model.id} mediaTitle={model.title} />
                )}
              </div>
            </div>

            <DetailCreditsSection cast={model.cast} crew={model.crew} />

            <MediaGallerySection
              videos={model.videos}
              backdrops={model.backdrops}
              posters={model.posters}
              mediaTitle={model.title}
            />

            {/* <p className="mt-8 text-[10px] leading-snug text-white/40">
              This product uses the TMDB API but is not endorsed or certified by TMDB.{" "}
              <Link
                href={`https://www.themoviedb.org/${tmdbKind}/${model.id}`}
                className="underline hover:text-white/60"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on TMDB
              </Link>
            </p> */}
          </div>
        </div>
      </section>

      {model.recommended.length > 0 ? (
        <section className="bg-black">
          <div className="mx-auto container py-16">
            <MoviesRow
              title={similarRowTitle}
              heading={<>You Might Also Like</>}
              movies={model.recommended as Movie[]}
              showViewAll={false}
              linkBase={model.kind === "tv" ? "tv" : "movie"}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
