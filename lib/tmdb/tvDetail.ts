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
import { pickYoutubeTrailer, type TmdbVideo } from "@/lib/tmdb/videoPicker";

const DEFAULT_LANGUAGE = "en-US";

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

type TmdbTvListResult = {
  id?: number;
  name?: string;
  first_air_date?: string;
  poster_path?: string | null;
};

type TmdbBackdrop = {
  file_path?: string;
};

type TmdbTvDetailAppended = {
  id?: number;
  name?: string;
  overview?: string;
  first_air_date?: string;
  status?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  episode_run_time?: number[];
  genres?: TmdbGenre[];
  credits?: { cast?: TmdbCastMember[]; crew?: TmdbCrewMember[] };
  videos?: { results?: TmdbVideo[] };
  images?: { backdrops?: TmdbBackdrop[] };
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
  excludeTvId: number
): TvDetailRecommended[] {
  const out: TvDetailRecommended[] = [];
  for (const s of results ?? []) {
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

export type TvDetailPageData = {
  id: number;
  title: string;
  overview: string;
  firstAirDate: string;
  firstAirDateFormatted: string;
  statusLabel: string;
  episodeRuntimeLabel: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: string[];
  cast: DetailCreditPerson[];
  crew: DetailCreditPerson[];
  trailerYoutubeKey: string | null;
  gallery: { src: string }[];
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

  const rawStatus = typeof data.status === "string" ? data.status.trim() : "";
  const statusLabel = rawStatus || "Series";

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

  const fromRecommendations = normalizeRecommendedTv(
    data.recommendations?.results,
    14,
    id
  );
  const fromSimilar = normalizeRecommendedTv(data.similar?.results, 14, id);
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
    firstAirDate,
    firstAirDateFormatted: formatFirstAirDate(firstAirDate),
    statusLabel,
    episodeRuntimeLabel: episodeRuntimeLabel(data.episode_run_time),
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
