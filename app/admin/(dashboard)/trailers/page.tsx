import { getDb } from "@/lib/db/mongodb";
import {
  TRAILER_SECTIONS_COLLECTION,
  TRAILER_SLUGS,
  slugToCategory,
  type TrailerSectionItem,
  type TrailerSlug,
} from "@/lib/db/trailerSection";
import { UnifiedTrailerEditor } from "@/components/admin/UnifiedTrailerEditor";

export const dynamic = "force-dynamic";

export default async function TrailersPage() {
  let items: TrailerSectionItem[] = [];

  try {
    const db = await getDb();
    const docs = await db
      .collection(TRAILER_SECTIONS_COLLECTION)
      .find({ slug: { $in: [...TRAILER_SLUGS] } })
      .toArray();

    for (const doc of docs) {
      const slug = doc.slug as TrailerSlug;
      const category = slugToCategory(slug);
      const docItems = Array.isArray(doc.items) ? doc.items : [];

      for (const item of docItems) {
        items.push({
          tmdbId: item.tmdbId ?? null,
          mediaType: item.mediaType ?? "movie",
          title: item.title ?? "",
          youtubeKey: item.youtubeKey ?? "",
          thumbnailUrl: item.thumbnailUrl ?? "",
          releaseDate: item.releaseDate ?? "",
          detailHref: item.detailHref ?? null,
          category,
          addedAt: item.addedAt ?? new Date().toISOString(),
          order: item.order ?? 0,
        });
      }
    }

    // Sort by category order then item order
    const slugOrder = TRAILER_SLUGS.reduce(
      (acc, s, i) => ({ ...acc, [slugToCategory(s)]: i }),
      {} as Record<string, number>
    );
    items.sort((a, b) => {
      const catA = slugOrder[a.category] ?? 0;
      const catB = slugOrder[b.category] ?? 0;
      if (catA !== catB) return catA - catB;
      return a.order - b.order;
    });
  } catch {
    // DB unavailable — start with empty list
  }

  return <UnifiedTrailerEditor initialItems={items} />;
}
