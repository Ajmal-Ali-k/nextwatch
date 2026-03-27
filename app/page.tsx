import movie1917 from "@/assets/movies/1971.png"
import movieHer from "@/assets/movies/her.png"
import movieEternalSunshine from "@/assets/movies/eternal_sunshine.png"
import movieOnceUponATime from "@/assets/movies/onece_uponeatime_hollywood.png"
import movieTenet from "@/assets/movies/tenet.png"
import MoviesRow from "@/components/MoviesRow"
import LatestTrailersRow from "@/components/LatestTrailersRow"

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
];

const latestTrailers = [
  { title: "One Battle After Another", date: "Jan 17, 2020", image: movieOnceUponATime },
  { title: "Peaky Blinders", date: "Jan 17, 2020", image: movieTenet },
  { title: "1917", date: "Jan 17, 2020", image: movie1917 },
  { title: "Her", date: "Jan 17, 2020", image: movieHer },
  { title: "Tenet", date: "Jan 17, 2020", image: movieTenet },
];

export default function Home() {
  return (
    <main className="min-h-screen pb-16 pt-12 text-white">
      <div className="mx-auto flex container flex-col gap-16">

        <LatestTrailersRow trailers={latestTrailers} />
        <MoviesRow
          title="New Releases in Cinemas"
          movies={experienceInTheatres}
          filters={["Today", "This Week", "This Month"]}
        />
        <MoviesRow
          title="Latest Movies on OTT"
          movies={newMoviesOnOtt}
          filters={["Today", "This Week", "This Month"]}
        />
        <MoviesRow title="LATEST TV SHOWS" movies={newMoviesOnOtt} />
        <MoviesRow title="THIS MONTH RELEASES" movies={newMoviesOnOtt} />
      </div>
    </main>
  );
}
