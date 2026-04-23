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

function posterGalleryUrl(path: string | null): string | null {
  const p = typeof path === "string" ? path.trim() : "";
  if (!p) return null;
  return `${TMDB_IMAGE_BASE}/w500${p}`;
}

type VideoEntry = { key: string; name: string; type: string };

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
  id?: number;
  name?: string;
};

type TmdbMovieListResult = {
  id?: number;
  title?: string;
  release_date?: string;
  poster_path?: string | null;
  original_language?: string;
};

type TmdbImageEntry = {
  file_path?: string;
};

type TmdbReleaseDateEntry = {
  type?: number;
  release_date?: string;
};

type TmdbReleaseDateCountry = {
  iso_3166_1?: string;
  release_dates?: TmdbReleaseDateEntry[];
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
  images?: { backdrops?: TmdbImageEntry[]; posters?: TmdbImageEntry[] };
  recommendations?: { results?: TmdbMovieListResult[] };
  similar?: { results?: TmdbMovieListResult[] };
  release_dates?: { results?: TmdbReleaseDateCountry[] };
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
  excludeMovieId: number,
  viewedLanguage?: string
): MovieDetailRecommended[] {
  const pool = results ?? [];

  const sameLang: TmdbMovieListResult[] = [];
  const otherLang: TmdbMovieListResult[] = [];
  for (const item of pool) {
    if (
      viewedLanguage &&
      typeof item.original_language === "string" &&
      item.original_language === viewedLanguage
    ) {
      sameLang.push(item);
    } else {
      otherLang.push(item);
    }
  }

  const orderedPool = [...sameLang, ...otherLang];
  const out: MovieDetailRecommended[] = [];
  for (const s of orderedPool) {
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

const SAME_LANG_REC_THRESHOLD = 6;

async function fetchDiscoverMovieFill(
  apiKey: string,
  originalLanguage: string,
  genreIds: number[],
  excludeIds: Set<number>,
  limit: number
): Promise<TmdbMovieListResult[]> {
  const url = new URL(`${TMDB_API_V3_BASE}/discover/movie`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", DEFAULT_LANGUAGE);
  url.searchParams.set("sort_by", "popularity.desc");
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("with_original_language", originalLanguage);
  url.searchParams.set("page", "1");
  if (genreIds.length > 0) {
    url.searchParams.set("with_genres", genreIds.slice(0, 3).join("|"));
  }

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: TmdbMovieListResult[] };
    const out: TmdbMovieListResult[] = [];
    for (const m of data.results ?? []) {
      if (out.length >= limit) break;
      const mid = m.id;
      if (typeof mid !== "number" || !Number.isInteger(mid) || mid < 1) continue;
      if (excludeIds.has(mid)) continue;
      out.push(m);
    }
    return out;
  } catch {
    return [];
  }
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
  videos: VideoEntry[];
  backdrops: { src: string }[];
  posters: { src: string }[];
  recommended: MovieDetailRecommended[];
  isInTheaters: boolean;
};

function computeIsInTheaters(
  releaseDates: TmdbReleaseDateCountry[] | undefined
): boolean {
  if (!releaseDates?.length) return false;
  const now = Date.now();
  let hasTheatrical = false;
  let hasDigitalRelease = false;

  for (const country of releaseDates) {
    for (const rd of country.release_dates ?? []) {
      const type = rd.type;
      const dateStr = rd.release_date;
      if (!type || !dateStr) continue;
      const ts = new Date(dateStr).getTime();
      if (Number.isNaN(ts) || ts > now) continue;

      if (type === 2 || type === 3) hasTheatrical = true;
      if (type === 4 || type === 5 || type === 6) hasDigitalRelease = true;
    }
  }

  return hasTheatrical && !hasDigitalRelease;
}

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
    "credits,videos,images,recommendations,similar,release_dates"
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

  const videos: VideoEntry[] = [];
  for (const v of data.videos?.results ?? []) {
    if (videos.length >= 20) break;
    if (v.site !== "YouTube" || !v.key) continue;
    videos.push({ key: v.key, name: v.type ? `${v.type}: ${v.key}` : v.key, type: v.type ?? "" });
  }

  const backdropEntries: { src: string }[] = [];
  for (const b of data.images?.backdrops ?? []) {
    if (backdropEntries.length >= 20) break;
    const src = backdropGalleryUrl(b.file_path ?? null);
    if (src) backdropEntries.push({ src });
  }

  const posterEntries: { src: string }[] = [];
  for (const p of data.images?.posters ?? []) {
    if (posterEntries.length >= 20) break;
    const src = posterGalleryUrl(p.file_path ?? null);
    if (src) posterEntries.push({ src });
  }

  const viewedLanguage =
    typeof data.original_language === "string"
      ? data.original_language.trim()
      : "";

  const genreIds = (data.genres ?? [])
    .map((g) => (typeof g.id === "number" ? g.id : null))
    .filter((gid): gid is number => gid !== null);

  const recPool = data.recommendations?.results?.length
    ? data.recommendations.results
    : (data.similar?.results ?? []);

  const sameLangCount = viewedLanguage
    ? recPool.filter(
        (m) =>
          typeof m.original_language === "string" &&
          m.original_language === viewedLanguage
      ).length
    : SAME_LANG_REC_THRESHOLD;

  let finalPool = recPool;

  if (
    viewedLanguage &&
    viewedLanguage !== "en" &&
    sameLangCount < SAME_LANG_REC_THRESHOLD
  ) {
    const existingIds = new Set(
      recPool
        .map((m) => m.id)
        .filter((x): x is number => typeof x === "number")
    );
    existingIds.add(id);

    const discoverFill = await fetchDiscoverMovieFill(
      apiKey,
      viewedLanguage,
      genreIds,
      existingIds,
      14
    );

    finalPool = [...recPool, ...discoverFill];
  }

  const recommended = normalizeRecommendedMovies(
    finalPool,
    14,
    id,
    viewedLanguage || undefined
  );

  const poster = posterUrl(data.poster_path ?? null);
  let backdrop = backdropHeroUrl(data.backdrop_path ?? null);
  if (!backdrop && poster) {
    backdrop = poster.replace("/w500", "/original");
  }

  const isInTheaters = computeIsInTheaters(data.release_dates?.results);

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
    videos,
    backdrops: backdropEntries,
    posters: posterEntries,
    recommended,
    isInTheaters,
  };
}
