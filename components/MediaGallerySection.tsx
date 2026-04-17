"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";

import { DetailSectionHeading } from "@/components/DetailSectionHeading";
import { MediaLightboxModal } from "@/components/MediaLightboxModal";
import { cn } from "@/lib/utils";
import type { MediaDetailGalleryImage, MediaDetailVideo } from "@/lib/tmdb/mediaDetailPresentation";

type TabKey = "videos" | "backdrops" | "posters";

type Tab = { key: TabKey; label: string; count: number };

type LightboxState =
  | { open: false }
  | { open: true; mode: "image"; tab: "backdrops" | "posters"; index: number }
  | { open: true; mode: "video"; youtubeKey: string; title: string };

type MediaGallerySectionProps = {
  videos: MediaDetailVideo[];
  backdrops: MediaDetailGalleryImage[];
  posters: MediaDetailGalleryImage[];
  mediaTitle: string;
};

function youtubeThumb(key: string): string {
  return `https://img.youtube.com/vi/${key}/mqdefault.jpg`;
}

export function MediaGallerySection({
  videos,
  backdrops,
  posters,
  mediaTitle,
}: MediaGallerySectionProps) {
  const allTabs: Tab[] = [
    { key: "videos" as const, label: "Videos", count: videos.length },
    { key: "backdrops" as const, label: "Backdrops", count: backdrops.length },
    { key: "posters" as const, label: "Posters", count: posters.length },
  ];
  const tabs = allTabs.filter((t) => t.count > 0);

  const [activeTab, setActiveTab] = useState<TabKey>(tabs[0]?.key ?? "backdrops");
  const [lightbox, setLightbox] = useState<LightboxState>({ open: false });

  if (tabs.length === 0) return null;

  const closeLightbox = () => setLightbox({ open: false });

  return (
    <div className="mt-12 border-t border-white/10 pt-10" id="media">
      <DetailSectionHeading className="mb-6">Media</DetailSectionHeading>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-white/15">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={cn(
              "relative pb-3 text-sm font-semibold transition",
              activeTab === t.key
                ? "text-white"
                : "text-white/50 hover:text-white/75"
            )}
          >
            {t.label}{" "}
            <span className="text-white/40">{t.count}</span>
            {activeTab === t.key ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#E50914]" />
            ) : null}
          </button>
        ))}
      </div>

      {/* Videos grid */}
      {activeTab === "videos" ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {videos.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() =>
                setLightbox({
                  open: true,
                  mode: "video",
                  youtubeKey: v.key,
                  title: `${mediaTitle} — ${v.type}`,
                })
              }
              className="group relative aspect-video overflow-hidden rounded-lg bg-white/5"
            >
              <Image
                src={youtubeThumb(v.key)}
                alt={v.type}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/40">
                <div className="flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Play className="size-5 fill-white text-white" />
                </div>
              </div>
              <span className="absolute bottom-1.5 left-2 text-[11px] font-medium text-white/80 drop-shadow">
                {v.type}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Backdrops grid */}
      {activeTab === "backdrops" ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {backdrops.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() =>
                setLightbox({ open: true, mode: "image", tab: "backdrops", index: i })
              }
              className="group relative aspect-video overflow-hidden rounded-lg bg-white/5"
            >
              <Image
                src={img.src}
                alt=""
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* Posters grid */}
      {activeTab === "posters" ? (
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {posters.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() =>
                setLightbox({ open: true, mode: "image", tab: "posters", index: i })
              }
              className="group relative aspect-2/3 overflow-hidden rounded-lg bg-white/5"
            >
              <Image
                src={img.src}
                alt=""
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* Lightbox */}
      {lightbox.open && lightbox.mode === "video" ? (
        <MediaLightboxModal
          mode="video"
          youtubeKey={lightbox.youtubeKey}
          title={lightbox.title}
          onClose={closeLightbox}
        />
      ) : null}
      {lightbox.open && lightbox.mode === "image" ? (
        <MediaLightboxModal
          mode="image"
          images={lightbox.tab === "backdrops" ? backdrops : posters}
          index={lightbox.index}
          onIndexChange={(idx) =>
            setLightbox({ ...lightbox, index: idx })
          }
          onClose={closeLightbox}
        />
      ) : null}
    </div>
  );
}
