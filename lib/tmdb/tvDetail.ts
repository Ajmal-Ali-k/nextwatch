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

type TmdbTvListResult = {
  id?: number;
  name?: string;
  first_air_date?: string;
  poster_path?: string | null;
  original_language?: string;
};

type TmdbImageEntry = {
  file_path?: string;
};

type TmdbTvSeason = {
  id?: number;
  name?: string;
  season_number?: number;
  episode_count?: number;
  air_date?: string | null;
  poster_path?: string | null;
  overview?: string;
  vote_average?: number;
};

type TmdbTvDetailAppended = {
  id?: number;
  name?: string;
  overview?: string;
  first_air_date?: string;
  original_language?: string | null;
  status?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  episode_run_time?: number[];
  genres?: TmdbGenre[];
  seasons?: TmdbTvSeason[];
  credits?: { cast?: TmdbCastMember[]; crew?: TmdbCrewMember[] };
  videos?: { results?: TmdbVideo[] };
  images?: { backdrops?: TmdbImageEntry[]; posters?: TmdbImageEntry[] };
  recommendations?: { results?: TmdbTvListResult[] };
  similar?: { results?: TmdbTvListResult[] };
};

export type TvDetailRecommended = {
  id: number;
  title: string;
  date: string;
  image: string;
};

function formatFirstAirDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatListTvDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function episodeRuntimeLabel(minutes: number[] | undefined): string | null {
  if (!minutes?.length) return null;
  const valid = minutes.filter((m) => typeof m === "number" && m > 0);
  if (!valid.length) return null;
  const avg = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  return `${avg}m`;
}

function normalizeRecommendedTv(
  results: TmdbTvListResult[] | undefined,
  limit: number,
  excludeTvId: number,
  viewedLanguage?: string
): TvDetailRecommended[] {
  const pool = results ?? [];

  const sameLang: TmdbTvListResult[] = [];
  const otherLang: TmdbTvListResult[] = [];
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
  const out: TvDetailRecommended[] = [];
  for (const s of orderedPool) {
    if (out.length >= limit) break;
    const sid = s.id;
    if (typeof sid !== "number" || !Number.isInteger(sid) || sid < 1) continue;
    if (sid === excludeTvId) continue;
    const st = typeof s.name === "string" ? s.name.trim() : "";
    if (!st) continue;
    const pu = posterUrl(s.poster_path ?? null);
    if (!pu) continue;
    out.push({
      id: sid,
      title: st,
      date: formatListTvDate(
        typeof s.first_air_date === "string" ? s.first_air_date : ""
      ),
      image: pu,
    });
  }
  return out;
}

const SAME_LANG_REC_THRESHOLD = 6;

async function fetchDiscoverTvFill(
  apiKey: string,
  originalLanguage: string,
  genreIds: number[],
  excludeIds: Set<number>,
  limit: number
): Promise<TmdbTvListResult[]> {
  const url = new URL(`${TMDB_API_V3_BASE}/discover/tv`);
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
    const data = (await res.json()) as { results?: TmdbTvListResult[] };
    const out: TmdbTvListResult[] = [];
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

export type TvSeason = {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string;
  posterUrl: string | null;
  overview: string;
};

export type TvDetailPageData = {
  id: number;
  title: string;
  overview: string;
  firstAirDate: string;
  firstAirDateFormatted: string;
  languageLabel: string | null;
  statusLabel: string;
  episodeRuntimeLabel: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: string[];
  cast: DetailCreditPerson[];
  crew: DetailCreditPerson[];
  trailerYoutubeKey: string | null;
  videos: VideoEntry[];
  backdrops: { src: string }[];
  posters: { src: string }[];
  seasons: TvSeason[];
  recommended: TvDetailRecommended[];
};

export async function loadTvDetail(
  tvId: number,
  language: string = DEFAULT_LANGUAGE
): Promise<TvDetailPageData | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const url = new URL(`${TMDB_API_V3_BASE}/tv/${tvId}`);
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

  const data = (await res.json()) as TmdbTvDetailAppended;

  const id = data.id;
  if (typeof id !== "number" || !Number.isInteger(id) || id < 1) return null;

  const title = typeof data.name === "string" ? data.name.trim() : "";
  if (!title) return null;

  const overview = typeof data.overview === "string" ? data.overview : "";
  const firstAirDate =
    typeof data.first_air_date === "string" ? data.first_air_date : "";
  const languageLabel = tmdbLanguageLabel(data.original_language ?? null);

  const rawStatus = typeof data.status === "string" ? data.status.trim() : "";
  const statusLabel = rawStatus || "Series";

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

    const discoverFill = await fetchDiscoverTvFill(
      apiKey,
      viewedLanguage,
      genreIds,
      existingIds,
      14
    );

    finalPool = [...recPool, ...discoverFill];
  }

  const recommended = normalizeRecommendedTv(
    finalPool,
    14,
    id,
    viewedLanguage || undefined
  );

  const seasons: TvSeason[] = [];
  for (const s of data.seasons ?? []) {
    const sn = s.season_number;
    if (typeof sn !== "number" || sn < 0) continue;
    const sName = typeof s.name === "string" ? s.name.trim() : `Season ${sn}`;
    seasons.push({
      seasonNumber: sn,
      name: sName,
      episodeCount: typeof s.episode_count === "number" ? s.episode_count : 0,
      airDate: typeof s.air_date === "string" ? s.air_date : "",
      posterUrl: posterUrl(s.poster_path ?? null),
      overview: typeof s.overview === "string" ? s.overview : "",
    });
  }
  seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);

  const poster = posterUrl(data.poster_path ?? null);
  let backdrop = backdropHeroUrl(data.backdrop_path ?? null);
  if (!backdrop && poster) {
    backdrop = poster.replace("/w500", "/original");
  }

  return {
    id,
    title,
    overview: overview || "No overview available.",
    firstAirDate,
    firstAirDateFormatted: formatFirstAirDate(firstAirDate),
    languageLabel,
    statusLabel,
    episodeRuntimeLabel: episodeRuntimeLabel(data.episode_run_time),
    posterUrl: poster,
    backdropUrl: backdrop,
    genres,
    cast,
    crew,
    trailerYoutubeKey,
    videos,
    backdrops: backdropEntries,
    posters: posterEntries,
    seasons,
    recommended,
  };
}
