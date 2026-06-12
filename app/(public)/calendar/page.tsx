import { JsonLd } from "@/components/JsonLd";
import { buildItemListJsonLd } from "@/lib/seo/structuredData";
import { getServerHomePreferences } from "@/lib/server/homePreferences";
import {
  fetchNowPlayingMoviePage,
  fetchUpcomingMoviePage,
} from "@/lib/tmdb/discoverPages";
import CalendarPageContent, {
  type CalendarInitialData,
  type CalendarMovie,
} from "./CalendarPageContent";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isWithinNextMonths(iso: string, months: number): boolean {
  if (!iso || iso === "—") return false;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const maxFuture = new Date();
  maxFuture.setMonth(maxFuture.getMonth() + months);
  return date >= now && date <= maxFuture;
}

function calendarItemList(items: CalendarMovie[]) {
  return buildItemListJsonLd({
    name: "Upcoming Releases Calendar",
    url: "/calendar",
    items: items.map((item) => ({
      title: item.title,
      url: item.kind === "tv" ? `/tv-shows/${item.id}` : `/movies/${item.id}`,
      image: item.image,
    })),
  });
}

async function getInitialData(): Promise<CalendarInitialData | undefined> {
  const prefs = await getServerHomePreferences();
  const [nowPlaying, upcoming] = await Promise.all([
    fetchNowPlayingMoviePage({
      watchRegion: prefs.watchRegion,
      languages: prefs.languages,
      page: 1,
    }),
    fetchUpcomingMoviePage({
      watchRegion: prefs.watchRegion,
      languages: prefs.languages,
      page: 1,
    }),
  ]);

  if (!nowPlaying && !upcoming) return undefined;

  const deduped = new Map<number, NonNullable<typeof nowPlaying>["results"][number]>();
  for (const movie of [...(nowPlaying?.results ?? []), ...(upcoming?.results ?? [])]) {
    if (!deduped.has(movie.id)) deduped.set(movie.id, movie);
  }

  const data = [...deduped.values()]
    .filter((movie) => isWithinNextMonths(movie.releaseDate, 2))
    .map((movie) => ({
      id: movie.id,
      kind: "movie" as const,
      title: movie.title,
      date: movie.releaseDate || toIsoDate(new Date()),
      image: movie.posterUrl,
      overview: movie.overview,
    }));

  return {
    data,
    updatedAt: Date.now(),
    params: {
      activeTab: "In Theatres",
      watchRegion: prefs.watchRegion,
      languagesParam: prefs.languages.join(","),
    },
  };
}

export default async function ReleaseCalendarPage() {
  const initialData = await getInitialData();

  return (
    <>
      {initialData && initialData.data.length > 0 ? (
        <JsonLd data={calendarItemList(initialData.data)} />
      ) : null}
      <CalendarPageContent initialData={initialData} />
    </>
  );
}
