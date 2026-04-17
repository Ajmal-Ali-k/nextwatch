import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db/mongodb";
import {
  HERO_SLIDES_COLLECTION,
  HERO_SLUG,
  type HeroSlideItem,
} from "@/lib/db/heroSection";

export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const db = await getDb();
  const doc = await db
    .collection(HERO_SLIDES_COLLECTION)
    .findOne({ slug: HERO_SLUG });

  const items: HeroSlideItem[] = Array.isArray(doc?.items)
    ? doc.items.map(
        (item: Record<string, unknown>, i: number): HeroSlideItem => ({
          source: (item.source as HeroSlideItem["source"]) ?? "tmdb",
          tmdbId: (item.tmdbId as number) ?? null,
          mediaType: (item.mediaType as HeroSlideItem["mediaType"]) ?? null,
          title: (item.title as string) ?? "",
          subtitle: (item.subtitle as string) ?? "",
          imageUrl: (item.imageUrl as string) ?? "",
          s3Key: (item.s3Key as string) ?? null,
          href: (item.href as string) ?? "",
          addedAt: (item.addedAt as string) ?? new Date().toISOString(),
          order: (item.order as number) ?? i,
        })
      )
    : [];

  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  let body: { items?: HeroSlideItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json(
      { error: "items must be an array" },
      { status: 400 }
    );
  }

  const orderedItems = body.items.map((item, i) => ({ ...item, order: i }));

  const db = await getDb();
  const now = new Date();

  await db.collection(HERO_SLIDES_COLLECTION).updateOne(
    { slug: HERO_SLUG },
    {
      $set: {
        slug: HERO_SLUG,
        items: orderedItems,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  revalidatePath("/admin/hero");
  revalidatePath("/admin");
  revalidatePath("/");

  return NextResponse.json({ ok: true, itemCount: orderedItems.length });
}
