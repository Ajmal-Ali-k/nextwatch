import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db/mongodb";
import {
  HOME_SECTIONS_COLLECTION,
  SECTION_META,
  SECTION_SLUGS,
} from "@/lib/db/homeSection";

export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const db = await getDb();
  const docs = await db
    .collection(HOME_SECTIONS_COLLECTION)
    .find({ slug: { $in: [...SECTION_SLUGS] } })
    .toArray();

  const map = new Map(docs.map((d) => [d.slug as string, d]));

  const sections = SECTION_SLUGS.map((slug) => {
    const doc = map.get(slug);
    const items = Array.isArray(doc?.items) ? doc.items : [];
    return {
      slug,
      title: SECTION_META[slug].title,
      itemCount: items.length,
      updatedAt: doc?.updatedAt ? doc.updatedAt : null,
    };
  });

  return NextResponse.json({ sections });
}
