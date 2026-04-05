import type { DetailCreditPerson } from "@/lib/tmdb/detailCredits";
import type { MovieDetailPageData } from "@/lib/tmdb/movieDetail";
import type { TvDetailPageData } from "@/lib/tmdb/tvDetail";

export type MediaDetailGalleryImage = { src: string };

export type MediaDetailRecommended = {
  id: number;
  title: string;
  date: string;
  image: string;
};

/**
 * Normalized shape for the shared movie/TV detail layout ({@link MediaDetailView}).
 */
export type MediaDetailPresentation = {
  kind: "movie" | "tv";
  id: number;
  title: string;
  backdropUrl: string | null;
  posterUrl: string | null;
  overview: string;
  genres: string[];
  /** Small gold label above the main date (e.g. Released / First aired). */
  dateEyebrow: string;
  /** Primary date line under the eyebrow. */
  datePrimary: string;
  /** Extra meta lines (runtime, status, episode length, …). */
  sublines: string[];
  trailerYoutubeKey: string | null;
  cast: DetailCreditPerson[];
  crew: DetailCreditPerson[];
  gallery: MediaDetailGalleryImage[];
  recommended: MediaDetailRecommended[];
};

export function movieToMediaPresentation(data: MovieDetailPageData): MediaDetailPresentation {
  const sublines: string[] = [];
  if (data.runtimeLabel) sublines.push(`Runtime: ${data.runtimeLabel}`);
  return {
    kind: "movie",
    id: data.id,
    title: data.title,
    backdropUrl: data.backdropUrl,
    posterUrl: data.posterUrl,
    overview: data.overview,
    genres: data.genres,
    dateEyebrow: "Released",
    datePrimary: data.releaseDateFormatted,
    sublines,
    trailerYoutubeKey: data.trailerYoutubeKey,
    cast: data.cast,
    crew: data.crew,
    gallery: data.gallery,
    recommended: data.recommended.map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      image: m.image,
    })),
  };
}

export function tvToMediaPresentation(data: TvDetailPageData): MediaDetailPresentation {
  const sublines: string[] = [data.statusLabel];
  if (data.episodeRuntimeLabel) {
    sublines.push(`Avg. episode: ${data.episodeRuntimeLabel}`);
  }
  return {
    kind: "tv",
    id: data.id,
    title: data.title,
    backdropUrl: data.backdropUrl,
    posterUrl: data.posterUrl,
    overview: data.overview,
    genres: data.genres,
    dateEyebrow: "First aired",
    datePrimary: data.firstAirDateFormatted,
    sublines,
    trailerYoutubeKey: data.trailerYoutubeKey,
    cast: data.cast,
    crew: data.crew,
    gallery: data.gallery,
    recommended: data.recommended.map((m) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      image: m.image,
    })),
  };
}
