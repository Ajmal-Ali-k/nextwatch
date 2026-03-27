"use client"

import Image, { type StaticImageData } from "next/image"
import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type HeroSlide = {
  image: string | StaticImageData
  alt: string
}

export default function HeroBannerSwiper({
  slides,
  intervalMs = 3500,
}: {
  slides: HeroSlide[]
  intervalMs?: number
}) {
  const safeSlides = useMemo(() => (slides.length ? slides : []), [slides])
  const [index, setIndex] = useState(0)
  const activeIndex = safeSlides.length ? index % safeSlides.length : 0

  useEffect(() => {
    if (safeSlides.length <= 1) return
    const t = setInterval(() => {
      setIndex((i) => i + 1)
    }, intervalMs)
    return () => clearInterval(t)
  }, [intervalMs, safeSlides.length])

  if (safeSlides.length === 0) return null

  const goPrev = () => setIndex((i) => i - 1)
  const goNext = () => setIndex((i) => i + 1)

  return (
    <section className="w-full">
      <div className="relative overflow-hidden">
        {/* Slide track */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {safeSlides.map((slide, i) => (
            <div key={i} className="relative w-full shrink-0">
              <div className="relative aspect-21/9 w-full">
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        {safeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/30 p-2 text-white/90 backdrop-blur-sm transition hover:bg-black/45 hover:text-white"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-black/30 p-2 text-white/90 backdrop-blur-sm transition hover:bg-black/45 hover:text-white"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
              {safeSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex ? "w-6 bg-[#E50914]" : "w-3 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

