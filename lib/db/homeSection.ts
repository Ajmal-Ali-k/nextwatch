import type { WithId, Document } from "mongodb";

export type HomeSectionItem = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  releaseDate: string;
  addedAt: string;
  order: number;
};

export type HomeSectionDoc = Document & {
  slug: string;
  title: string;
  items: HomeSectionItem[];
  updatedAt: Date;
  createdAt: Date;
};

export const SECTION_SLUGS = ["theatres", "ott-movies", "ott-series"] as const;
export type SectionSlug = (typeof SECTION_SLUGS)[number];

export const SECTION_META: Record<
  SectionSlug,
  { title: string; defaultMediaType: "movie" | "tv" }
> = {
  theatres: { title: "New Releases in Cinemas", defaultMediaType: "movie" },
  "ott-movies": { title: "Latest Movies on OTT", defaultMediaType: "movie" },
  "ott-series": { title: "Latest TV Shows on OTT", defaultMediaType: "tv" },
};

export const HOME_SECTIONS_COLLECTION = "home_sections";

export function isValidSlug(slug: string): slug is SectionSlug {
  return (SECTION_SLUGS as readonly string[]).includes(slug);
}

export function docToSection(doc: WithId<HomeSectionDoc>) {
  return {
    slug: doc.slug,
    title: doc.title,
    items: doc.items,
    itemCount: doc.items.length,
    updatedAt: doc.updatedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  };
}
