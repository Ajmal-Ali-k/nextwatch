import mainBanner from "@/assets/movies/main_banner.png"
import MoviesRow from "@/components/MoviesRow"
import LatestTrailersRow from "@/components/LatestTrailersRow"
import HeroBannerSwiper from "@/components/HeroBannerSwiper"
import { HomePageReveal } from "@/components/HomePageReveal"
import { getServerHomePreferences } from "@/lib/server/homePreferences"
import { getHomeHeroSlides } from "@/lib/tmdb/homeHero"
import { getHomeLatestTrailersByCategory } from "@/lib/tmdb/latestTrailersHome"
import { getHomeRows } from "@/lib/tmdb/homeRows"

export const dynamic = "force-dynamic"

const TRAILER_FILTERS = ["Theatre", "OTT Series", "OTT Movies","Upcoming"] as const

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
