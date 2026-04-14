import { getDb } from "@/lib/db/mongodb";
import {
  TRAILER_SECTIONS_COLLECTION,
  TRAILER_SLUGS,
} from "@/lib/db/trailerSection";
import type { HomeTrailerCard, HomeLatestTrailersByCategory } from "@/lib/tmdb/latestTrailersTypes";

function formatDate(iso: string | undefined): string {
  if (!iso) return "\u2014";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function getCuratedTrailers(): Promise<HomeLatestTrailersByCategory | null> {
  try {
    const db = await getDb();
    const docs = await db
      .collection(TRAILER_SECTIONS_COLLECTION)
      .find({ slug: { $in: [...TRAILER_SLUGS] } })
      .toArray();

    const map = new Map(docs.map((d) => [d.slug as string, d]));

    const toCards = (slug: string): HomeTrailerCard[] => {
      const doc = map.get(slug);
      if (!doc || !Array.isArray(doc.items) || doc.items.length === 0)
        return [];
      return doc.items
        .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
        .map(
          (item: {
            tmdbId: number | null;
            mediaType: string;
            title: string;
            youtubeKey: string;
            thumbnailUrl: string;
            releaseDate: string;
            detailHref: string | null;
          }) => ({
            id: `${item.mediaType}-${item.tmdbId ?? "yt"}-${item.youtubeKey}`,
            title: item.title,
            date: formatDate(item.releaseDate),
            image: item.thumbnailUrl,
            youtubeKey: item.youtubeKey,
            ...(item.detailHref ? { detailHref: item.detailHref } : {}),
          })
        );
    };

    const theatre = toCards("trailer-theatre");
    const ottSeries = toCards("trailer-ott-series");
    const ottMovies = toCards("trailer-ott-movies");
    const upcoming = toCards("trailer-upcoming");

    // Only return curated data if at least one category has items
    if (
      theatre.length === 0 &&
      ottSeries.length === 0 &&
      ottMovies.length === 0 &&
      upcoming.length === 0
    ) {
      return null;
    }

    return {
      Theatre: theatre,
      "OTT Series": ottSeries,
      "OTT Movies": ottMovies,
      Upcoming: upcoming,
    } as HomeLatestTrailersByCategory;
  } catch {
    return null;
  }
}
