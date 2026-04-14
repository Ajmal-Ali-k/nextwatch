import type { Movie } from "@/components/MoviesRow";
import { getDb } from "@/lib/db/mongodb";
import { HOME_SECTIONS_COLLECTION } from "@/lib/db/homeSection";
import { posterUrl } from "@/lib/tmdb/constants";

function formatDate(iso: string | undefined): string {
  if (!iso) return "\u2014";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type CuratedRows = {
  theatres: Movie[];
  ottMovies: Movie[];
  ottSeries: Movie[];
};

export async function getCuratedHomeRows(): Promise<CuratedRows | null> {
  try {
    const db = await getDb();
    const docs = await db
      .collection(HOME_SECTIONS_COLLECTION)
      .find({ slug: { $in: ["theatres", "ott-movies", "ott-series"] } })
      .toArray();

    const map = new Map(docs.map((d) => [d.slug as string, d]));

    const toMovies = (slug: string): Movie[] => {
      const doc = map.get(slug);
      if (!doc || !Array.isArray(doc.items) || doc.items.length === 0)
        return [];
      return doc.items
        .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
        .map(
          (item: {
            tmdbId: number;
            title: string;
            releaseDate: string;
            posterPath: string | null;
          }) => ({
            id: item.tmdbId,
            title: item.title,
            date: formatDate(item.releaseDate),
            image: posterUrl(item.posterPath) ?? "",
          })
        )
        .filter((m: Movie) => m.image);
    };

    const theatres = toMovies("theatres");
    const ottMovies = toMovies("ott-movies");
    const ottSeries = toMovies("ott-series");

    // Only return curated data if at least one section has items
    if (theatres.length === 0 && ottMovies.length === 0 && ottSeries.length === 0) {
      return null;
    }

    return { theatres, ottMovies, ottSeries };
  } catch {
    return null;
  }
}
