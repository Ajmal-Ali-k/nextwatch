import type { HeroSlide } from "@/components/HeroBannerSwiper";
import { TMDB_API_V3_BASE, backdropHeroUrl } from "@/lib/tmdb/constants";

const DEFAULT_LANGUAGE = "en-US";
const HERO_LIMIT = 8;

type TmdbTrendingMovie = {
  id?: number;
  title?: string;
  backdrop_path?: string | null;
};

type TmdbTrendingResponse = {
  results?: TmdbTrendingMovie[];
};

export async function getHomeHeroSlides(): Promise<HeroSlide[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  const url = new URL(`${TMDB_API_V3_BASE}/trending/movie/week`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", DEFAULT_LANGUAGE);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 900 } });
    if (!res.ok) return [];

    const data = (await res.json()) as TmdbTrendingResponse;
    const results = data.results ?? [];
    const slides: HeroSlide[] = [];

    for (const item of results) {
      if (slides.length >= HERO_LIMIT) break;
      const id = item.id;
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const backdropUrl = backdropHeroUrl(item.backdrop_path ?? null);
      if (typeof id !== "number" || !Number.isInteger(id) || id < 1) continue;
      if (!title || !backdropUrl) continue;

      slides.push({
        id,
        image: backdropUrl,
        alt: title,
        title,
        href: `/movies/${id}`,
      });
    }

    return slides;
  } catch {
    return [];
  }
}
