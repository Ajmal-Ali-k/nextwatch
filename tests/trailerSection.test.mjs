import assert from "node:assert/strict";
import test from "node:test";

import * as trailerSection from "../lib/db/trailerSection.ts";

const items = [
  {
    tmdbId: 101,
    mediaType: "movie",
    title: "Dune: Part Two",
    youtubeKey: "abc123def45",
    thumbnailUrl: "https://img.youtube.com/vi/abc123def45/mqdefault.jpg",
    releaseDate: "2024-03-01",
    detailHref: "/movies/101",
    category: "Theatre",
    addedAt: "2026-05-01T00:00:00.000Z",
    order: 0,
  },
  {
    tmdbId: 202,
    mediaType: "tv",
    title: "Shogun",
    youtubeKey: "xyz987uvw65",
    thumbnailUrl: "https://img.youtube.com/vi/xyz987uvw65/mqdefault.jpg",
    releaseDate: "2024-02-27",
    detailHref: "/tv-shows/202",
    category: "OTT Series",
    addedAt: "2026-05-01T00:00:00.000Z",
    order: 1,
  },
  {
    tmdbId: null,
    mediaType: "movie",
    title: "Manual YouTube Trailer",
    youtubeKey: "manualkey01",
    thumbnailUrl: "https://img.youtube.com/vi/manualkey01/mqdefault.jpg",
    releaseDate: "",
    detailHref: null,
    category: "Upcoming",
    addedAt: "2026-05-01T00:00:00.000Z",
    order: 2,
  },
];

test("filterTrailerSectionItems searches listed trailer table fields case-insensitively", () => {
  assert.equal(typeof trailerSection.filterTrailerSectionItems, "function");

  assert.deepEqual(
    trailerSection.filterTrailerSectionItems(items, "dune").map((item) => item.title),
    ["Dune: Part Two"]
  );

  assert.deepEqual(
    trailerSection.filterTrailerSectionItems(items, "ott series").map((item) => item.title),
    ["Shogun"]
  );

  assert.deepEqual(
    trailerSection.filterTrailerSectionItems(items, "TV").map((item) => item.title),
    ["Shogun"]
  );

  assert.deepEqual(
    trailerSection.filterTrailerSectionItems(items, "manualkey").map((item) => item.title),
    ["Manual YouTube Trailer"]
  );
});

test("filterTrailerSectionItems returns every trailer for blank search queries", () => {
  assert.equal(typeof trailerSection.filterTrailerSectionItems, "function");

  assert.deepEqual(
    trailerSection.filterTrailerSectionItems(items, "   ").map((item) => item.title),
    ["Dune: Part Two", "Shogun", "Manual YouTube Trailer"]
  );
});
