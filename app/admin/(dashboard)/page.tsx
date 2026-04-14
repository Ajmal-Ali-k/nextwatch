import Link from "next/link";
import { Film, Tv, Clapperboard, Play, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/lib/db/mongodb";
import {
  HOME_SECTIONS_COLLECTION,
  SECTION_META,
  SECTION_SLUGS,
  type SectionSlug,
} from "@/lib/db/homeSection";
import {
  TRAILER_SECTIONS_COLLECTION,
  TRAILER_SLUGS,
} from "@/lib/db/trailerSection";

export const dynamic = "force-dynamic";

const SECTION_ICONS: Record<SectionSlug, LucideIcon> = {
  theatres: Clapperboard,
  "ott-movies": Film,
  "ott-series": Tv,
};

type SummaryCard = {
  slug: string;
  title: string;
  itemCount: number;
  updatedAt: string;
  href: string;
  icon: LucideIcon;
};

async function getSummaries(): Promise<{
  sections: SummaryCard[];
  trailerCard: SummaryCard;
}> {
  try {
    const db = await getDb();
    const [sectionDocs, trailerDocs] = await Promise.all([
      db
        .collection(HOME_SECTIONS_COLLECTION)
        .find({ slug: { $in: [...SECTION_SLUGS] } })
        .toArray(),
      db
        .collection(TRAILER_SECTIONS_COLLECTION)
        .find({ slug: { $in: [...TRAILER_SLUGS] } })
        .toArray(),
    ]);

    const sectionMap = new Map(sectionDocs.map((d) => [d.slug as string, d]));

    const sections: SummaryCard[] = SECTION_SLUGS.map((slug) => {
      const doc = sectionMap.get(slug);
      const items = Array.isArray(doc?.items) ? doc.items : [];
      return {
        slug,
        title: SECTION_META[slug].title,
        itemCount: items.length,
        updatedAt: doc?.updatedAt
          ? new Date(doc.updatedAt).toLocaleDateString()
          : "Never",
        href: `/admin/home-sections/${slug}`,
        icon: SECTION_ICONS[slug],
      };
    });

    // Single trailer summary card
    let totalTrailers = 0;
    let latestUpdate: Date | null = null;
    for (const doc of trailerDocs) {
      const items = Array.isArray(doc.items) ? doc.items : [];
      totalTrailers += items.length;
      if (doc.updatedAt) {
        const d = new Date(doc.updatedAt);
        if (!latestUpdate || d > latestUpdate) latestUpdate = d;
      }
    }

    const trailerCard: SummaryCard = {
      slug: "trailers",
      title: "Trailers",
      itemCount: totalTrailers,
      updatedAt: latestUpdate
        ? latestUpdate.toLocaleDateString()
        : "Never",
      href: "/admin/trailers",
      icon: Play,
    };

    return { sections, trailerCard };
  } catch {
    const sections: SummaryCard[] = SECTION_SLUGS.map((slug) => ({
      slug,
      title: SECTION_META[slug].title,
      itemCount: 0,
      updatedAt: "Unavailable",
      href: `/admin/home-sections/${slug}`,
      icon: SECTION_ICONS[slug],
    }));
    const trailerCard: SummaryCard = {
      slug: "trailers",
      title: "Trailers",
      itemCount: 0,
      updatedAt: "Unavailable",
      href: "/admin/trailers",
      icon: Play,
    };
    return { sections, trailerCard };
  }
}

function SummaryGrid({ cards }: { cards: SummaryCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link key={card.slug} href={card.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <Icon className="size-5 text-gray-500" />
                <CardTitle className="text-base">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{card.itemCount}</p>
                <p className="text-xs text-gray-500">
                  {card.itemCount === 1 ? "item" : "items"} &middot; Updated{" "}
                  {card.updatedAt}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { sections, trailerCard } = await getSummaries();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Manage curated home page sections and trailers
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Home Sections
        </h2>
        <SummaryGrid cards={sections} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Trailers
        </h2>
        <SummaryGrid cards={[trailerCard]} />
      </div>
    </div>
  );
}
