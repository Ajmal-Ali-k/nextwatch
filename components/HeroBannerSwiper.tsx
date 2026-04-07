"use client"

import Image, { type StaticImageData } from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type HeroSlide = {
  image: string | StaticImageData
  alt: string
  id?: number
  href?: string
  /** Shown in the bottom gradient overlay when set; otherwise `alt` is used. */
  title?: string
  subtitle?: string
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
          {safeSlides.map((slide, i) => {
            const key = slide.id ?? i
            const label = slide.title?.trim() || slide.alt
            const subtitle = slide.subtitle?.trim() || "Stream trending picks on NextWatch."
            const inner = (
              <div className="relative aspect-21/9 w-full">
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/15" />
                <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/45 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-black/90 via-black/25 to-transparent" />
                {label && (slide.href || slide.title?.trim()) ? (
                  <div className="absolute inset-y-0 left-0 z-1 flex w-full items-center">
                    <div className="mx-auto w-full container px-4 sm:px-6">
                      <div className="max-w-[min(90vw,36rem)]">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/75 sm:text-sm">
                          Featured on NextWatch
                        </p>
                        <h2 className="text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.7)] sm:text-5xl lg:text-6xl">
                          {label}
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
                          {subtitle}
                        </p>
                        {slide.href ? (
                          <div className="mt-5 flex flex-wrap items-center gap-3">
                            <Link
                              href={slide.href}
                              className="inline-flex items-center rounded-md bg-[#E50914] px-5 py-2 text-sm  text-white transition hover:bg-[#f10d19]"
                            >
                              View details
                            </Link>
                            {/* <Link
                              href="/in-theaters"
                              className="inline-flex items-center rounded-md border border-white/30 bg-black/35 px-5 py-2 text-sm font-semibold text-white/95 transition hover:border-white/60 hover:bg-white/10"
                            >
                              Browse trailers
                            </Link> */}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )

            return (
              <div key={key} className="relative w-full shrink-0">
                {inner}
              </div>
            )
          })}
        </div>

        {/* Controls */}
        {safeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 p-2 text-white/90 backdrop-blur-sm transition hover:bg-black/60 hover:text-white sm:left-6"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 p-2 text-white/90 backdrop-blur-sm transition hover:bg-black/60 hover:text-white sm:right-6"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
              {safeSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex ? "w-7 bg-[#E50914]" : "w-3 bg-white/45 hover:bg-white/70"
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

