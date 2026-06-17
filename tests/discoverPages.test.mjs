import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateDiscoverPageWindow,
  mergeDiscoverLanguageSlices,
  normalizeDiscoverMovie,
  normalizeDiscoverTvShow,
} from "../lib/tmdb/discoverPages.ts";

test("calculateDiscoverPageWindow maps display pages to TMDB page windows", () => {
  assert.deepEqual(calculateDiscoverPageWindow(1, 2), {
    offset: 0,
    tmdbPageStart: 1,
    tmdbPagesNeeded: 1,
    skip: 0,
    perLanguageNeeded: 15,
  });

  assert.deepEqual(calculateDiscoverPageWindow(2, 3), {
    offset: 30,
    tmdbPageStart: 2,
    tmdbPagesNeeded: 1,
    skip: 10,
    perLanguageNeeded: 10,
  });
});

test("mergeDiscoverLanguageSlices interleaves languages and deduplicates ids", () => {
  const merged = mergeDiscoverLanguageSlices(
    [
      [
        { id: 1, title: "Malayalam One" },
        { id: 2, title: "Duplicate" },
      ],
      [
        { id: 3, title: "Hindi One" },
        { id: 2, title: "Duplicate Again" },
        { id: 4, title: "Hindi Two" },
      ],
    ],
    (item) => item.id,
    4
  );

  assert.deepEqual(
    merged.map((item) => item.title),
    ["Malayalam One", "Hindi One", "Duplicate", "Hindi Two"]
  );
});

test("normalizers map TMDB movie and TV rows to public response shape", () => {
  assert.deepEqual(
    normalizeDiscoverMovie({
      id: 10,
      title: "Movie",
      overview: "Overview",
      release_date: "2026-01-02",
      poster_path: "/poster.jpg",
    }),
    {
      id: 10,
      title: "Movie",
      overview: "Overview",
      releaseDate: "2026-01-02",
      posterUrl: "https://image.tmdb.org/t/p/w500/poster.jpg",
    }
  );

  assert.deepEqual(
    normalizeDiscoverTvShow({
      id: 20,
      name: "Series",
      overview: "Overview",
      first_air_date: "2026-03-04",
      poster_path: null,
    }),
    {
      id: 20,
      title: "Series",
      overview: "Overview",
      firstAirDate: "2026-03-04",
      posterUrl: null,
    }
  );
});
