import Image from "next/image";

import { DetailSectionHeading } from "@/components/DetailSectionHeading";
import type { TvSeason } from "@/lib/tmdb/tvDetail";

function formatSeasonAirDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric" });
}

export function TvSeasonsSection({ seasons }: { seasons: TvSeason[] }) {
  if (seasons.length === 0) return null;

  return (
    <div className="mt-12 border-t border-white/10 pt-10" id="seasons">
      <DetailSectionHeading className="mb-6">
        Seasons{" "}
        <span className="text-white/40 text-sm font-normal normal-case tracking-normal">
          {seasons.length}
        </span>
      </DetailSectionHeading>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {seasons.map((season) => {
          const year = formatSeasonAirDate(season.airDate);
          return (
            <div
              key={season.seasonNumber}
              className="flex gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              {/* Poster */}
              <div className="relative aspect-2/3 w-16 shrink-0 overflow-hidden rounded-md bg-white/5 sm:w-20">
                {season.posterUrl ? (
                  <Image
                    src={season.posterUrl}
                    alt={season.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-[10px] font-semibold text-white/30">
                    S{season.seasonNumber}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <h3 className="text-sm font-semibold text-white sm:text-base">
                  {season.name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/50">
                  {year ? <span>{year}</span> : null}
                  {season.episodeCount > 0 ? (
                    <span>
                      {season.episodeCount} Episode{season.episodeCount !== 1 ? "s" : ""}
                    </span>
                  ) : null}
                </div>
                {season.overview ? (
                  <p className="mt-1 text-xs leading-relaxed text-white/40 line-clamp-2 sm:text-sm">
                    {season.overview}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
