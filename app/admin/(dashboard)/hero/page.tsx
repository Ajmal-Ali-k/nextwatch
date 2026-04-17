import { getDb } from "@/lib/db/mongodb";
import {
  HERO_SLIDES_COLLECTION,
  HERO_SLUG,
  type HeroSlideItem,
} from "@/lib/db/heroSection";
import { HeroBannerEditor } from "@/components/admin/HeroBannerEditor";

export const dynamic = "force-dynamic";

export default async function HeroBannerPage() {
  let items: HeroSlideItem[] = [];

  try {
    const db = await getDb();
    const doc = await db
      .collection(HERO_SLIDES_COLLECTION)
      .findOne({ slug: HERO_SLUG });

    if (doc && Array.isArray(doc.items)) {
      items = doc.items
        .sort(
          (a: { order: number }, b: { order: number }) => a.order - b.order
        )
        .map(
          (item: Record<string, unknown>, i: number): HeroSlideItem => ({
            source: (item.source as HeroSlideItem["source"]) ?? "tmdb",
            tmdbId: (item.tmdbId as number) ?? null,
            mediaType: (item.mediaType as HeroSlideItem["mediaType"]) ?? null,
            title: (item.title as string) ?? "",
            subtitle: (item.subtitle as string) ?? "",
            imageUrl: (item.imageUrl as string) ?? "",
            s3Key: (item.s3Key as string) ?? null,
            href: (item.href as string) ?? "",
            addedAt:
              (item.addedAt as string) ?? new Date().toISOString(),
            order: (item.order as number) ?? i,
          })
        );
    }
  } catch {
    // DB unavailable — start with empty list
  }

  return <HeroBannerEditor initialItems={items} />;
}
