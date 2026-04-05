"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

import { cn } from "@/lib/utils";

import "swiper/css";

export type GalleryImage = { src: string };

function updateEdges(s: SwiperType) {
  return { start: s.isBeginning, end: s.isEnd };
}

export function MovieGallery({ images }: { images: GalleryImage[] }) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const onSwiperInit = useCallback((s: SwiperType) => {
    setSwiper(s);
    setEdges(updateEdges(s));
  }, []);

  const onSlideChange = useCallback((s: SwiperType) => {
    setEdges(updateEdges(s));
  }, []);

  if (!images.length) return null;

  if (images.length <= 3) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {images.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            className="group relative aspect-video w-[180px] shrink-0 overflow-hidden rounded-lg sm:w-[220px]"
          >
            <Image
              src={img.src}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="220px"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => swiper?.slidePrev()}
        disabled={edges.start}
        aria-label="Previous gallery images"
        className={cn(
          "absolute left-0 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white shadow-lg backdrop-blur-sm transition",
          "hover:border-white/45 hover:bg-black/75",
          "disabled:pointer-events-none disabled:opacity-30"
        )}
      >
        <ChevronLeft className="size-6" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => swiper?.slideNext()}
        disabled={edges.end}
        aria-label="Next gallery images"
        className={cn(
          "absolute right-0 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white shadow-lg backdrop-blur-sm transition",
          "hover:border-white/45 hover:bg-black/75",
          "disabled:pointer-events-none disabled:opacity-30"
        )}
      >
        <ChevronRight className="size-6" aria-hidden />
      </button>

      <Swiper
        className="pl-0! pr-12! pb-2 max-sm:pr-10!"
        spaceBetween={16}
        slidesPerView={1}
        slidesPerGroup={1}
        watchOverflow
        breakpoints={{
          640: {
            slidesPerView: 2,
            slidesPerGroup: 2,
          },
          1024: {
            slidesPerView: 3,
            slidesPerGroup: 3,
          },
          1200: {
            slidesPerView: 4,
            slidesPerGroup: 4,
          },
        }}
        onSwiper={onSwiperInit}
        onSlideChange={onSlideChange}
        onBreakpoint={(s) => setEdges(updateEdges(s))}
        onResize={(s) => setEdges(updateEdges(s))}
      >
        {images.map((img, i) => (
          <SwiperSlide key={`${img.src}-${i}`}>
            <div className="group relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={img.src}
                alt=""
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1199px) 33vw, 25vw"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
