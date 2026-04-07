import {
  TMDB_API_V3_BASE,
  TMDB_IMAGE_BASE,
  backdropHeroUrl,
  posterUrl,
} from "@/lib/tmdb/constants";
import {
  buildCastCreditList,
  buildCrewCreditList,
  type DetailCreditPerson,
} from "@/lib/tmdb/detailCredits";
import { tmdbLanguageLabel } from "@/lib/tmdb/languageLabel";
import { pickYoutubeTrailer, type TmdbVideo } from "@/lib/tmdb/videoPicker";

const DEFAULT_LANGUAGE = "en-US";

/**
 * Widen appended `videos` beyond the request `language` (TMDB filters video tracks by language).
 * `null` = language-agnostic entries; ISO 639-1 codes cover common Indian originals + English.
 */
const INCLUDE_VIDEO_LANGUAGE = "en,null,ml,hi,ta,te,kn,mr";

function backdropGalleryUrl(path: string | null): string | null {
  const p = typeof path === "string" ? path.trim() : "";
  if (!p) return null;
  return `${TMDB_IMAGE_BASE}/w780${p}`;
}

type TmdbCastMember = {
  name?: string;
  character?: string;
  profile_path?: string | null;
};

type TmdbCrewMember = {
  name?: string;
  job?: string;
  profile_path?: string | null;
};

type TmdbGenre = {
  name?: string;
};

type TmdbMovieListResult = {
  id?: number;
  title?: string;
  release_date?: string;
  poster_path?: string | null;
};

type TmdbBackdrop = {
  file_path?: string;
};

type TmdbMovieDetailAppended = {
  id?: number;
  title?: string;
  overview?: string;
  release_date?: string;
  original_language?: string | null;
  runtime?: number | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  genres?: TmdbGenre[];
  credits?: { cast?: TmdbCastMember[]; crew?: TmdbCrewMember[] };
  videos?: { results?: TmdbVideo[] };
  images?: { backdrops?: TmdbBackdrop[] };
  recommendations?: { results?: TmdbMovieListResult[] };
  similar?: { results?: TmdbMovieListResult[] };
};

export type MovieDetailRecommended = {
  id: number;
  title: string;
  date: string;
  image: string;
};

function formatReleaseDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatListMovieDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function normalizeRecommendedMovies(
  results: TmdbMovieListResult[] | undefined,
  limit: number,
  excludeMovieId: number
): MovieDetailRecommended[] {
  const out: MovieDetailRecommended[] = [];
  for (const s of results ?? []) {
    if (out.length >= limit) break;
    const sid = s.id;
    if (typeof sid !== "number" || !Number.isInteger(sid) || sid < 1) continue;
    if (sid === excludeMovieId) continue;
    const st = typeof s.title === "string" ? s.title.trim() : "";
    if (!st) continue;
    const pu = posterUrl(s.poster_path ?? null);
    if (!pu) continue;
    out.push({
      id: sid,
      title: st,
      date: formatListMovieDate(
        typeof s.release_date === "string" ? s.release_date : ""
      ),
      image: pu,
    });
  }
  return out;
}

export type MovieDetailPageData = {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  releaseDateFormatted: string;
  languageLabel: string | null;
  runtimeLabel: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: string[];
  cast: DetailCreditPerson[];
  crew: DetailCreditPerson[];
  trailerYoutubeKey: string | null;
  gallery: { src: string }[];
  recommended: MovieDetailRecommended[];
};

export async function loadMovieDetail(
  movieId: number,
  language: string = DEFAULT_LANGUAGE
): Promise<MovieDetailPageData | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const url = new URL(`${TMDB_API_V3_BASE}/movie/${movieId}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", language);
  url.searchParams.set("include_video_language", INCLUDE_VIDEO_LANGUAGE);
  url.searchParams.set(
    "append_to_response",
    "credits,videos,images,recommendations,similar"
  );

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const data = (await res.json()) as TmdbMovieDetailAppended;

  const id = data.id;
  if (typeof id !== "number" || !Number.isInteger(id) || id < 1) return null;

  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!title) return null;

  const overview = typeof data.overview === "string" ? data.overview : "";
  const releaseDate = typeof data.release_date === "string" ? data.release_date : "";
  const languageLabel = tmdbLanguageLabel(data.original_language ?? null);

  const runtimeMin =
    typeof data.runtime === "number" && data.runtime > 0 ? data.runtime : null;
  const runtimeLabel =
    runtimeMin === null
      ? null
      : runtimeMin >= 60
        ? `${Math.floor(runtimeMin / 60)}h ${runtimeMin % 60}m`
        : `${runtimeMin}m`;

  const genres = (data.genres ?? [])
    .map((g) => (typeof g.name === "string" ? g.name.trim() : ""))
    .filter(Boolean);

  const cast = buildCastCreditList(data.credits?.cast, 18);
  const crew = buildCrewCreditList(data.credits?.crew, 12);

  const trailerYoutubeKey = pickYoutubeTrailer(data.videos?.results);

  const backdrops = data.images?.backdrops ?? [];
  const gallery: { src: string }[] = [];
  for (const b of backdrops) {
    if (gallery.length >= 6) break;
    const src = backdropGalleryUrl(b.file_path ?? null);
    if (src) gallery.push({ src });
  }

  const fromRecommendations = normalizeRecommendedMovies(
    data.recommendations?.results,
    14,
    id
  );
  const fromSimilar = normalizeRecommendedMovies(data.similar?.results, 14, id);
  const recommended =
    fromRecommendations.length > 0 ? fromRecommendations : fromSimilar;

  const poster = posterUrl(data.poster_path ?? null);
  let backdrop = backdropHeroUrl(data.backdrop_path ?? null);
  if (!backdrop && poster) {
    backdrop = poster.replace("/w500", "/original");
  }

  return {
    id,
    title,
    overview: overview || "No overview available.",
    releaseDate,
    releaseDateFormatted: formatReleaseDate(releaseDate),
    languageLabel,
    runtimeLabel,
    posterUrl: poster,
    backdropUrl: backdrop,
    genres,
    cast,
    crew,
    trailerYoutubeKey,
    gallery,
    recommended,
  };
}
