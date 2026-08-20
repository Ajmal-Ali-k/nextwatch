import assert from "node:assert/strict";
import test from "node:test";

import * as heroSection from "../lib/db/heroSection.ts";

const existingItems = [
  {
    source: "tmdb",
    tmdbId: 101,
    mediaType: "movie",
    title: "Existing First",
    subtitle: "First subtitle",
    imageUrl: "https://image.tmdb.org/t/p/original/first.jpg",
    s3Key: null,
    href: "/movies/101",
    addedAt: "2026-05-01T00:00:00.000Z",
    order: 0,
  },
  {
    source: "custom",
    tmdbId: null,
    mediaType: null,
    title: "Existing Second",
    subtitle: "Second subtitle",
    imageUrl: "https://cdn.example.com/second.jpg",
    s3Key: "hero/second.jpg",
    href: "",
    addedAt: "2026-05-02T00:00:00.000Z",
    order: 1,
  },
];

const newItem = {
  source: "tmdb",
  tmdbId: 303,
  mediaType: "tv",
  title: "New Banner",
  subtitle: "New subtitle",
  imageUrl: "https://image.tmdb.org/t/p/original/new.jpg",
  s3Key: null,
  href: "/tv-shows/303",
};

test("addHeroSlideItemToTop places newly added banners before existing table rows", () => {
  assert.equal(typeof heroSection.addHeroSlideItemToTop, "function");

  const nextItems = heroSection.addHeroSlideItemToTop(
    existingItems,
    newItem,
    "2026-06-22T08:00:00.000Z"
  );

  assert.deepEqual(
    nextItems.map((item) => item.title),
    ["New Banner", "Existing First", "Existing Second"]
  );
  assert.equal(nextItems[0].addedAt, "2026-06-22T08:00:00.000Z");
  assert.equal(nextItems[0].order, 0);
});
