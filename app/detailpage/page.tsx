import Image, { type StaticImageData } from "next/image";
import banner from "@/assets/movies/1917_banner.png";
import poster from "@/assets/movies/1971.png";
import amazonPrime from "@/assets/movies/amazon_prime.png";
import netflix from "@/assets/movies/netflix.png";
import youtube from "@/assets/movies/youtube.png";
import gallery1 from "@/assets/movies/gallery_1.png";
import gallery2 from "@/assets/movies/gallery_2.png";
import gallery3 from "@/assets/movies/gallery_3.png";
import {
  Play,
  Bookmark,
  Heart,
} from "lucide-react";

const genres = ["English", "War", "Adventure", "Action"];

const streamingPlatforms: {
  name: string;
  label: string;
  image: StaticImageData;
}[] = [
  { name: "Amazon Prime", label: "Stream on", image: amazonPrime },
  { name: "Netflix", label: "Stream on", image: netflix },
  { name: "YouTube", label: "Buy/Rent on", image: youtube },
];

const galleryImages = [
  { src: gallery1, hasPlay: true },
  { src: gallery2, hasPlay: false },
  { src: gallery3, hasPlay: false },
];

export default function DetailPage() {
  return (
    <div className="relative min-h-screen text-white ">
      {/* Background banner */}
      <div className="absolute inset-0 h-full w-full">
        <Image
          src={banner}
          alt="1917 banner"
          fill
          className="object-cover object-center"
          priority
          placeholder="blur"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-neutral-900 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1400px] flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
        {/* Title + Release Date */}
        <div className="mb-6">
          <h1 className="font-(family-name:--font-anton) text-5xl uppercase tracking-tight sm:text-6xl lg:text-7xl">
            1917
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#F5C518]">
            Released On
          </p>
          <p className="text-lg font-bold sm:text-xl">April 20, 2026</p>
        </div>

        {/* Main info grid: poster + details */}
        <div className="flex flex-col gap-8 sm:flex-row sm:gap-10 lg:gap-14">
          {/* Poster */}
          <div className="w-[180px] shrink-0 sm:w-[200px] lg:w-[240px]">
            <div className="relative aspect-2/3 overflow-hidden rounded-md shadow-2xl">
              <Image
                src={poster}
                alt="1917 poster"
                fill
                className="object-cover"
                placeholder="blur"
              />
            </div>
          </div>

          {/* Details column */}
          <div className="flex max-w-xl flex-col gap-5">
            {/* Genre tags */}
            <div className="flex flex-wrap gap-2.5">
              {genres.map((genre, i) => (
                <span
                  key={genre}
                  className={`rounded-full border px-5 py-1.5 text-sm font-medium transition ${
                    i === 0
                      ? "border-[#D6212A] bg-[#D6212A]/20 text-white"
                      : "border-white/30 text-white/90 hover:border-white/60"
                  }`}
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Actors */}
            <p className="text-sm text-white/80">
              <span className="font-semibold text-white/90">Actors:</span>{" "}
              George MacKay, Richard Madden
            </p>

            {/* Synopsis */}
            <p className="text-sm leading-relaxed text-white/75 sm:text-base">
              After surviving Godzilla&apos;s attack on San Francisco, Caté is
              shaken yet again by a shocking secret. Amid monstrous threats, she
              embarks on a globetrotting adventure to learn the truth about her
              family—and the mysterious organization known as Monarch.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-[#D6212A] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b91c23]"
              >
                <Play className="size-4 fill-white" />
                Watch Trailer
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-[#E50914] px-6 py-2.5 text-sm font-medium text-white transition hover:border-white/60 hover:bg-white/5 "
              >
                <Bookmark className="size-4" />
                Add to Watchlist
              </button>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full border border-[#E50914] text-white transition hover:border-white/60 hover:bg-white/5"
                aria-label="Favorite"
              >
                <Heart className="size-4" />
              </button>
            </div>

            {/* Streaming platforms */}
            <div className="flex flex-wrap gap-4">
              {streamingPlatforms.map((platform) => (
                <button
                  key={platform.name}
                  type="button"
                  className="flex w-[120px] flex-col items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-4 py-5 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10"
                >
                  <Image
                    src={platform.image}
                    alt={platform.name}
                    width={48}
                    height={48}
                    className="size-10 object-contain"
                  />
                  <div className="text-center">
                    <p className="text-xs leading-tight text-white/60">
                      {platform.label}
                    </p>
                    <p className="text-sm  leading-tight">
                      {platform.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery section */}
        <div className="mt-10">
          <h2 className="font-(family-name:--font-anton) mb-4 text-2xl uppercase tracking-tight">
            Gallery
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {galleryImages.map((img, i) => (
              <div
                key={i}
                className="group relative aspect-video w-[180px] shrink-0 overflow-hidden rounded-lg sm:w-[220px]"
              >
                <Image
                  src={img.src}
                  alt={`Gallery image ${i + 1}`}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                {img.hasPlay && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <Play className="size-5 fill-white text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
