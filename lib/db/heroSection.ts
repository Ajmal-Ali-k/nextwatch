export const HERO_SLIDES_COLLECTION = "hero_slides";
export const HERO_SLUG = "hero";

export type HeroSlideSource = "tmdb" | "custom";

export type HeroSlideItem = {
  source: HeroSlideSource;
  tmdbId: number | null;
  mediaType: "movie" | "tv" | null;
  title: string;
  subtitle: string;
  imageUrl: string;
  s3Key: string | null;
  href: string;
  addedAt: string;
  order: number;
};

export function addHeroSlideItemToTop(
  items: HeroSlideItem[],
  item: Omit<HeroSlideItem, "addedAt" | "order">,
  addedAt = new Date().toISOString()
): HeroSlideItem[] {
  return [
    {
      ...item,
      addedAt,
      order: 0,
    },
    ...items,
  ];
}
