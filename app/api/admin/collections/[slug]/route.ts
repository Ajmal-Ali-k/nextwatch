import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db/mongodb";
import {
  HOME_SECTIONS_COLLECTION,
  SECTION_META,
  isValidSlug,
  type HomeSectionItem,
} from "@/lib/db/homeSection";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid section slug" }, { status: 400 });
  }

  const db = await getDb();
  const doc = await db
    .collection(HOME_SECTIONS_COLLECTION)
    .findOne({ slug });

  if (!doc) {
    return NextResponse.json({
      slug,
      title: SECTION_META[slug].title,
      items: [],
    });
  }

  return NextResponse.json({
    slug: doc.slug,
    title: doc.title ?? SECTION_META[slug].title,
    items: Array.isArray(doc.items) ? doc.items : [],
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid section slug" }, { status: 400 });
  }

  let body: { items?: HomeSectionItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items must be an array" }, { status: 400 });
  }

  const items: HomeSectionItem[] = body.items.map((item, i) => ({
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath,
    releaseDate: item.releaseDate,
    addedAt: item.addedAt || new Date().toISOString(),
    order: i,
  }));

  const db = await getDb();
  const now = new Date();

  await db.collection(HOME_SECTIONS_COLLECTION).updateOne(
    { slug },
    {
      $set: {
        slug,
        title: SECTION_META[slug].title,
        items,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  // Bust cache so admin pages and the public home page show fresh data
  revalidatePath(`/admin/home-sections/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/");

  return NextResponse.json({ ok: true, itemCount: items.length });
}
