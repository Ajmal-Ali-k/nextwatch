import movie1917 from "@/assets/movies/1971.png"
import movieHer from "@/assets/movies/her.png"
import movieEternalSunshine from "@/assets/movies/eternal_sunshine.png"
import movieOnceUponATime from "@/assets/movies/onece_uponeatime_hollywood.png"
import movieTenet from "@/assets/movies/tenet.png"
import mainBanner from "@/assets/movies/main_banner.png"
import MoviesRow from "@/components/MoviesRow"
import LatestTrailersRow from "@/components/LatestTrailersRow"
import HeroBannerSwiper from "@/components/HeroBannerSwiper"
import { HomePageReveal } from "@/components/HomePageReveal"
import { getServerHomePreferences } from "@/lib/server/homePreferences"
import { getHomeHeroSlides } from "@/lib/tmdb/homeHero"
import { getHomeLatestTrailersByCategory } from "@/lib/tmdb/latestTrailersHome"
import { getHomeRows } from "@/lib/tmdb/homeRows"

const experienceInTheatres = [
  { title: "1917", date: "Jan 17, 2020", image: movie1917 },
  { title: "Her", date: "Jan 17, 2020", image: movieHer },
  {
    title: "Eternal Sunshine of the Spotless Mind",
    date: "Jan 17, 2020",
    image: movieEternalSunshine,
  },
  {
    title: "Once Upon a Time in Hollywood",
    date: "Jan 17, 2020",
    image: movieOnceUponATime,
  },
  { title: "Tenet", date: "Jan 17, 2020", image: movieTenet },
  {
    title: "Eternal Sunshine of the Spotles Mind",
    date: "Jan 17, 2020",
    image: movieEternalSunshine,
  },
];

const newMoviesOnOtt = [
  { title: "1917", date: "Jan 17, 2020", image: movie1917 },
  { title: "Her", date: "Jan 17, 2020", image: movieHer },
  {
    title: "Eternal Sunshine of the Spotless Mind",
    date: "Jan 17, 2020",
    image: movieEternalSunshine,
  },
  {
    title: "Once Upon a Time in Hollywood",
    date: "Jan 17, 2020",
    image: movieOnceUponATime,
  },
  { title: "Tenet", date: "Jan 17, 2020", image: movieTenet },
  {
    title: "Eternal Sunshine of the Spotles Mind",
    date: "Jan 17, 2020",
    image: movieEternalSunshine,
  },
];

const TRAILER_FILTERS = ["Theatre", "OTT Series", "OTT Movies"] as const

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
  const theatreMovies = dynamicRows.theatres.length > 0 ? dynamicRows.theatres : experienceInTheatres
  const ottMovies = dynamicRows.ottMovies.length > 0 ? dynamicRows.ottMovies : newMoviesOnOtt
  const ottSeries = dynamicRows.ottSeries.length > 0 ? dynamicRows.ottSeries : newMoviesOnOtt

  return (
    <main className="min-h-screen pb-16 text-white">
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
            <MoviesRow
              title="New Releases in Cinemas"
              movies={theatreMovies}
              filters={["Today", "This Week", "This Month"]}
              viewAllLink="/in-theaters"
            />
            <MoviesRow
              title="Latest Movies on OTT"
              movies={ottMovies}
              filters={["Today", "This Week", "This Month"]}
              viewAllLink={"/movies"}
            />
            <MoviesRow
              title="Latest TV Shows on OTT"
              movies={ottSeries}
              linkBase="tv"
              filters={["Today", "This Week", "This Month"]}
              viewAllLink={"/tv-shows"}
            />
            {/* <MoviesRow
              title="LATEST anime"
              movies={animeSeries}
              linkBase="tv"
              filters={["Today", "This Week", "This Month"]}
            /> */}
          </>
        }
      />
    </main>
  );
}
