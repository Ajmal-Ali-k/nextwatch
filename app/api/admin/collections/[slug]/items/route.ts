import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db/mongodb";
import {
  HOME_SECTIONS_COLLECTION,
  SECTION_META,
  isValidSlug,
  type HomeSectionItem,
} from "@/lib/db/homeSection";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid section slug" }, { status: 400 });
  }

  let body: {
    tmdbId?: number;
    mediaType?: "movie" | "tv";
    title?: string;
    posterPath?: string | null;
    releaseDate?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body.tmdbId !== "number" ||
    !Number.isInteger(body.tmdbId) ||
    body.tmdbId < 1
  ) {
    return NextResponse.json({ error: "Invalid tmdbId" }, { status: 400 });
  }
  if (body.mediaType !== "movie" && body.mediaType !== "tv") {
    return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
  }
  if (typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date();

  // Ensure document exists
  await db.collection(HOME_SECTIONS_COLLECTION).updateOne(
    { slug },
    {
      $setOnInsert: {
        slug,
        title: SECTION_META[slug].title,
        items: [],
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  // Check for duplicate
  const existing = await db.collection(HOME_SECTIONS_COLLECTION).findOne({
    slug,
    "items.tmdbId": body.tmdbId,
    "items.mediaType": body.mediaType,
  });

  if (existing) {
    return NextResponse.json(
      { error: "Item already exists in this section" },
      { status: 409 }
    );
  }

  // Get current max order
  const doc = await db
    .collection(HOME_SECTIONS_COLLECTION)
    .findOne({ slug });
  const currentItems: HomeSectionItem[] = doc?.items ?? [];
  const maxOrder = currentItems.reduce(
    (max, it) => Math.max(max, it.order),
    -1
  );

  const newItem: HomeSectionItem = {
    tmdbId: body.tmdbId,
    mediaType: body.mediaType,
    title: body.title.trim(),
    posterPath: body.posterPath ?? null,
    releaseDate: body.releaseDate ?? "",
    addedAt: now.toISOString(),
    order: maxOrder + 1,
  };

  await db.collection(HOME_SECTIONS_COLLECTION).updateOne(
    { slug },
    {
      $push: { items: newItem as never },
      $set: { updatedAt: now },
    }
  );

  return NextResponse.json({ ok: true, item: newItem });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid section slug" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const tmdbIdRaw = searchParams.get("tmdbId");
  const mediaType = searchParams.get("mediaType");

  const tmdbId = Number(tmdbIdRaw);
  if (!Number.isInteger(tmdbId) || tmdbId < 1) {
    return NextResponse.json({ error: "Invalid tmdbId" }, { status: 400 });
  }
  if (mediaType !== "movie" && mediaType !== "tv") {
    return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection(HOME_SECTIONS_COLLECTION).updateOne(
    { slug },
    {
      $pull: { items: { tmdbId, mediaType } as never },
      $set: { updatedAt: new Date() },
    }
  );

  return NextResponse.json({ ok: true });
}
