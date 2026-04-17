import { getDb } from "@/lib/db/mongodb";
import { HERO_SLIDES_COLLECTION, HERO_SLUG } from "@/lib/db/heroSection";
import type { HeroSlide } from "@/components/HeroBannerSwiper";

export async function getCuratedHeroSlides(): Promise<HeroSlide[] | null> {
  try {
    const db = await getDb();
    const doc = await db
      .collection(HERO_SLIDES_COLLECTION)
      .findOne({ slug: HERO_SLUG });

    if (!doc || !Array.isArray(doc.items) || doc.items.length === 0) {
      return null;
    }

    const slides: HeroSlide[] = doc.items
      .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
      .map(
        (item: {
          title: string;
          subtitle: string;
          imageUrl: string;
          href: string;
          tmdbId: number | null;
        }) => ({
          image: item.imageUrl,
          alt: item.title,
          title: item.title,
          subtitle: item.subtitle || undefined,
          href: item.href || undefined,
          id: item.tmdbId ?? undefined,
        })
      );

    return slides;
  } catch {
    return null;
  }
}
