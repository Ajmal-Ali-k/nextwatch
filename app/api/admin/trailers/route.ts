import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db/mongodb";
import {
  TRAILER_SECTIONS_COLLECTION,
  TRAILER_SLUGS,
  TRAILER_META,
  TRAILER_CATEGORIES,
  filterTrailerSectionItems,
  slugToCategory,
  categoryToSlug,
  type TrailerSectionItem,
  type TrailerCategory,
} from "@/lib/db/trailerSection";

export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const db = await getDb();
  const docs = await db
    .collection(TRAILER_SECTIONS_COLLECTION)
    .find({ slug: { $in: [...TRAILER_SLUGS] } })
    .toArray();

  const searchParams = new URL(request.url).searchParams;
  const searchQuery =
    searchParams.get("query") ??
    searchParams.get("q") ??
    searchParams.get("search") ??
    "";
  const items: TrailerSectionItem[] = [];

  for (const doc of docs) {
    const slug = doc.slug as string;
    const meta = TRAILER_META[slug as keyof typeof TRAILER_META];
    if (!meta) continue;
    const category = slugToCategory(slug as (typeof TRAILER_SLUGS)[number]);
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

  // Sort by category order then by item order
  items.sort((a, b) => {
    const catA = TRAILER_CATEGORIES.indexOf(a.category);
    const catB = TRAILER_CATEGORIES.indexOf(b.category);
    if (catA !== catB) return catA - catB;
    return a.order - b.order;
  });

  const filteredItems = filterTrailerSectionItems(items, searchQuery);
  const counts: Record<string, number> = {};

  for (const cat of TRAILER_CATEGORIES) {
    counts[cat] = filteredItems.filter((item) => item.category === cat).length;
  }

  return NextResponse.json({
    items: filteredItems,
    counts,
    totalCount: items.length,
    query: searchQuery.trim(),
  });
}

export async function PUT(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  let body: { items?: TrailerSectionItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items must be an array" }, { status: 400 });
  }

  // Group items by category
  const grouped = new Map<TrailerCategory, TrailerSectionItem[]>();
  for (const cat of TRAILER_CATEGORIES) {
    grouped.set(cat, []);
  }

  for (const item of body.items) {
    const cat = item.category;
    if (!TRAILER_CATEGORIES.includes(cat)) continue;
    const list = grouped.get(cat)!;
    list.push({
      tmdbId: item.tmdbId ?? null,
      mediaType: item.mediaType,
      title: item.title,
      youtubeKey: item.youtubeKey,
      thumbnailUrl: item.thumbnailUrl,
      releaseDate: item.releaseDate,
      detailHref: item.detailHref ?? null,
      category: cat,
      addedAt: item.addedAt || new Date().toISOString(),
      order: list.length,
    });
  }

  const db = await getDb();
  const now = new Date();

  // Upsert each slug document
  const ops = [...grouped.entries()].map(([category, categoryItems]) => {
    const slug = categoryToSlug(category);
    const orderedItems = categoryItems.map((item, i) => ({ ...item, order: i }));
    return db.collection(TRAILER_SECTIONS_COLLECTION).updateOne(
      { slug },
      {
        $set: {
          slug,
          title: TRAILER_META[slug].title,
          items: orderedItems,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
  });

  await Promise.all(ops);

  revalidatePath("/admin/trailers");
  revalidatePath("/admin");
  revalidatePath("/");

  return NextResponse.json({ ok: true, itemCount: body.items.length });
}
