import { notFound } from "next/navigation";
import { getDb } from "@/lib/db/mongodb";
import {
  HOME_SECTIONS_COLLECTION,
  SECTION_META,
  isValidSlug,
  type HomeSectionItem,
} from "@/lib/db/homeSection";
import { CollectionEditor } from "@/components/admin/CollectionEditor";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();

  const meta = SECTION_META[slug];

  let items: HomeSectionItem[] = [];
  try {
    const db = await getDb();
    const doc = await db
      .collection(HOME_SECTIONS_COLLECTION)
      .findOne({ slug });
    if (doc && Array.isArray(doc.items)) {
      items = (doc.items as HomeSectionItem[]).sort(
        (a, b) => a.order - b.order
      );
    }
  } catch {
    // DB unavailable — start with empty list
  }

  return (
    <CollectionEditor
      slug={slug}
      title={meta.title}
      initialItems={items}
      defaultMediaType={meta.defaultMediaType}
    />
  );
}
