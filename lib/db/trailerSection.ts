export const TRAILER_CATEGORIES = [
  "Theatre",
  "OTT Series",
  "OTT Movies",
  "Upcoming",
] as const;
export type TrailerCategory = (typeof TRAILER_CATEGORIES)[number];

export type TrailerSectionItem = {
  tmdbId: number | null;
  mediaType: "movie" | "tv";
  title: string;
  youtubeKey: string;
  thumbnailUrl: string;
  releaseDate: string;
  detailHref: string | null;
  category: TrailerCategory;
  addedAt: string;
  order: number;
};

export const TRAILER_SLUGS = [
  "trailer-theatre",
  "trailer-ott-series",
  "trailer-ott-movies",
  "trailer-upcoming",
] as const;
export type TrailerSlug = (typeof TRAILER_SLUGS)[number];

export const TRAILER_META: Record<
  TrailerSlug,
  { title: string; category: string; defaultMediaType: "movie" | "tv" }
> = {
  "trailer-theatre": {
    title: "Theatre Trailers",
    category: "Theatre",
    defaultMediaType: "movie",
  },
  "trailer-ott-series": {
    title: "OTT Series Trailers",
    category: "OTT Series",
    defaultMediaType: "tv",
  },
  "trailer-ott-movies": {
    title: "OTT Movies Trailers",
    category: "OTT Movies",
    defaultMediaType: "movie",
  },
  "trailer-upcoming": {
    title: "Upcoming Trailers",
    category: "Upcoming",
    defaultMediaType: "movie",
  },
};

export const TRAILER_SECTIONS_COLLECTION = "trailer_sections";

export function isValidTrailerSlug(slug: string): slug is TrailerSlug {
  return (TRAILER_SLUGS as readonly string[]).includes(slug);
}

const SLUG_TO_CATEGORY: Record<TrailerSlug, TrailerCategory> = {
  "trailer-theatre": "Theatre",
  "trailer-ott-series": "OTT Series",
  "trailer-ott-movies": "OTT Movies",
  "trailer-upcoming": "Upcoming",
};

const CATEGORY_TO_SLUG: Record<TrailerCategory, TrailerSlug> = {
  Theatre: "trailer-theatre",
  "OTT Series": "trailer-ott-series",
  "OTT Movies": "trailer-ott-movies",
  Upcoming: "trailer-upcoming",
};

export function slugToCategory(slug: TrailerSlug): TrailerCategory {
  return SLUG_TO_CATEGORY[slug];
}

export function categoryToSlug(category: TrailerCategory): TrailerSlug {
  return CATEGORY_TO_SLUG[category];
}
