import assert from "node:assert/strict";
import test from "node:test";

import {
  buildItemListJsonLd,
  buildMovieJsonLd,
  buildTvSeriesJsonLd,
  safeJsonLd,
} from "../lib/seo/structuredData.ts";

test("safeJsonLd escapes script-breaking characters", () => {
  const json = safeJsonLd({
    "@context": "https://schema.org",
    name: "Alien </script><script>alert(1)</script>",
  });

  assert.equal(json.includes("</script>"), false);
  assert.equal(json.includes("\\u003c/script>"), true);
});

test("buildMovieJsonLd maps movie detail data to schema.org Movie", () => {
  const data = buildMovieJsonLd({
    id: 550,
    title: "Fight Club",
    overview: "An insomniac meets a soap maker.",
    posterUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
    releaseDate: "1999-10-15",
    genres: ["Drama"],
    runtimeLabel: "2h 19m",
    cast: [{ name: "Brad Pitt", role: "Tyler Durden", image: null }],
    crew: [{ name: "David Fincher", role: "Director", image: null }],
  });

  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "Movie");
  assert.equal(data.name, "Fight Club");
  assert.equal(data.url, "https://nextwatchlist.com/movies/550");
  assert.equal(data.image, "https://image.tmdb.org/t/p/w500/poster.jpg");
  assert.deepEqual(data.genre, ["Drama"]);
  assert.deepEqual(data.actor, [{ "@type": "Person", name: "Brad Pitt" }]);
  assert.deepEqual(data.director, [{ "@type": "Person", name: "David Fincher" }]);
});

test("buildTvSeriesJsonLd maps TV detail data to schema.org TVSeries", () => {
  const data = buildTvSeriesJsonLd({
    id: 1399,
    title: "Game of Thrones",
    overview: "Noble families fight for Westeros.",
    posterUrl: null,
    firstAirDate: "2011-04-17",
    genres: ["Drama", "Sci-Fi & Fantasy"],
    seasons: [{ seasonNumber: 1, name: "Season 1", episodeCount: 10, airDate: "2011-04-17", posterUrl: null, overview: "" }],
    cast: [{ name: "Emilia Clarke", role: "Daenerys Targaryen", image: null }],
  });

  assert.equal(data["@type"], "TVSeries");
  assert.equal(data.url, "https://nextwatchlist.com/tv-shows/1399");
  assert.equal(data.numberOfSeasons, 1);
  assert.deepEqual(data.actor, [{ "@type": "Person", name: "Emilia Clarke" }]);
});

test("buildItemListJsonLd builds absolute item URLs and positions", () => {
  const data = buildItemListJsonLd({
    name: "New Movies on OTT",
    url: "/movies",
    items: [
      { title: "Premalu", url: "/movies/123", image: "https://image.tmdb.org/t/p/w500/p.jpg" },
      { title: "Aavesham", url: "/movies/456", image: null },
    ],
  });

  assert.equal(data["@type"], "ItemList");
  assert.equal(data.url, "https://nextwatchlist.com/movies");
  assert.deepEqual(
    data.itemListElement.map((item) => ({
      position: item.position,
      url: item.item.url,
      name: item.item.name,
      image: item.item.image,
    })),
    [
      {
        position: 1,
        url: "https://nextwatchlist.com/movies/123",
        name: "Premalu",
        image: "https://image.tmdb.org/t/p/w500/p.jpg",
      },
      {
        position: 2,
        url: "https://nextwatchlist.com/movies/456",
        name: "Aavesham",
        image: undefined,
      },
    ]
  );
});
