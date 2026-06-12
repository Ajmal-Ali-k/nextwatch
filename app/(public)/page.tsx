import mainBanner from "@/assets/movies/main_banner.png"
import { JsonLd } from "@/components/JsonLd"
import MoviesRow from "@/components/MoviesRow"
import LatestTrailersRow from "@/components/LatestTrailersRow"
import HeroBannerSwiper from "@/components/HeroBannerSwiper"
import { HomePageReveal } from "@/components/HomePageReveal"
import { getServerHomePreferences } from "@/lib/server/homePreferences"
import { buildItemListJsonLd } from "@/lib/seo/structuredData"
import { getHomeHeroSlides } from "@/lib/tmdb/homeHero"
import { getHomeLatestTrailersByCategory } from "@/lib/tmdb/latestTrailersHome"
import { getHomeRows } from "@/lib/tmdb/homeRows"
import type { Movie } from "@/components/MoviesRow"

export const dynamic = "force-dynamic"

const TRAILER_FILTERS = ["Theatre", "OTT Series", "OTT Movies","Upcoming"] as const

function homeRowItemList({
  title,
  url,
  items,
  linkBase = "movies",
}: {
  title: string
  url: string
  items: Movie[]
  linkBase?: "movies" | "tv-shows"
}) {
  return buildItemListJsonLd({
    name: title,
    url,
    items: items
      .filter((item) => typeof item.id === "number")
      .map((item) => ({
        title: item.title,
        url: `/${linkBase}/${item.id}`,
        image: typeof item.image === "string" ? item.image : null,
      })),
  })
}

export default async function Home() {
  const homePrefs = await getServerHomePreferences()

  let heroSlides = await getHomeHeroSlides()
  if (heroSlides.length === 0) {
    heroSlides = [{ image: mainBanner, alt: "Featured on NextWatch" }]
  }

  const trailersByCategory = await getHomeLatestTrailersByCategory(homePrefs)
  const dynamicRows = await getHomeRows(homePrefs)
  const initialTrailerFilter =
    TRAILER_FILTERS.find((k) => trailersByCategory[k].length > 0) ?? TRAILER_FILTERS[0]

  return (
    <main className="min-h-screen pb-16 text-white bg-black">
      {dynamicRows.theatres.length > 0 ? (
        <JsonLd
          data={homeRowItemList({
            title: "New Releases in Cinemas",
            url: "/in-theaters",
            items: dynamicRows.theatres,
          })}
        />
      ) : null}
      {dynamicRows.ottMovies.length > 0 ? (
        <JsonLd
          data={homeRowItemList({
            title: "Latest Movies on OTT",
            url: "/movies",
            items: dynamicRows.ottMovies,
          })}
        />
      ) : null}
      {dynamicRows.ottSeries.length > 0 ? (
        <JsonLd
          data={homeRowItemList({
            title: "Latest TV Shows on OTT",
            url: "/tv-shows",
            items: dynamicRows.ottSeries,
            linkBase: "tv-shows",
          })}
        />
      ) : null}
      <HomePageReveal
        hero={<HeroBannerSwiper slides={heroSlides} />}
        trailers={
          <LatestTrailersRow
            trailersByCategory={trailersByCategory}
            initialFilter={initialTrailerFilter}
            filters={[...TRAILER_FILTERS]}
          />
        }
        rows={
          <>
            {dynamicRows.theatres.length > 0 && (
              <MoviesRow
                title="New Releases in Cinemas"
                movies={dynamicRows.theatres}
                viewAllLink="/in-theaters"
              />
            )}
            {dynamicRows.ottMovies.length > 0 && (
              <MoviesRow
                title="Latest Movies on OTT"
                movies={dynamicRows.ottMovies}
                viewAllLink="/movies"
              />
            )}
            {dynamicRows.ottSeries.length > 0 && (
              <MoviesRow
                title="Latest TV Shows on OTT"
                movies={dynamicRows.ottSeries}
                linkBase="tv"
                viewAllLink="/tv-shows"
              />
            )}
          </>
        }
      />
    </main>
  )
}
