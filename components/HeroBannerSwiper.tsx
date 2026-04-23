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
  const len = safeSlides.length
  const [index, setIndex] = useState(0)
  const [epoch, setEpoch] = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (len <= 1 || hovered) return
    const t = setInterval(() => setIndex((i) => (i + 1) % len), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs, len, epoch, hovered])

  if (len === 0) return null

  const go = (next: number) => {
    setIndex(((next % len) + len) % len)
    setEpoch((e) => e + 1)
  }

  return (
    <section
      className="w-full"
      aria-roledescription="carousel"
      aria-label="Featured content"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden sm:aspect-video md:aspect-2/1">
        {safeSlides.map((slide, i) => {
          const key = slide.id ?? i
          const label = slide.title?.trim() || slide.alt
          const subtitle =
            slide.subtitle?.trim() || "Stream trending picks on NextWatch."
          const active = i === index

          return (
            <div
              key={key}
              className={`absolute inset-0 transition-opacity duration-700 ease-out motion-reduce:transition-none ${
                active
                  ? "z-10 opacity-100"
                  : "z-0 opacity-0 pointer-events-none"
              }`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${len}`}
              aria-hidden={!active}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-black/15" />
              <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/45 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/90 via-black/25 to-transparent sm:h-36" />
              {label && (slide.href || slide.title?.trim()) ? (
                <div className="absolute inset-y-0 left-0 z-1 flex w-full items-end pb-10 sm:items-center sm:pb-0">
                  <div className="mx-auto w-full container px-4 sm:px-6 lg:px-8">
                    <div className="max-w-[min(85vw,36rem)]">
                      <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/75 sm:mb-3 sm:text-xs md:text-sm">
                        Featured on NextWatch
                      </p>
                      <h2 className="text-2xl font-bold uppercase leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.7)] sm:text-4xl md:text-5xl lg:text-6xl">
                        {label}
                      </h2>
                      <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/75 sm:mt-3 sm:text-sm md:text-base">
                        {subtitle}
                      </p>
                      {slide.href ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
                          <Link
                            href={slide.href}
                            className="inline-flex items-center rounded-md bg-[#E50914] px-3.5 py-1.5 text-xs text-white transition hover:bg-[#f10d19] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5 sm:py-2 sm:text-sm"
                          >
                            View details
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}

        {len > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/45 p-2 text-white/90 backdrop-blur-sm transition hover:bg-black/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex md:left-6"
            >
              <ChevronLeft className="size-4 sm:size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/45 p-2 text-white/90 backdrop-blur-sm transition hover:bg-black/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex md:right-6"
            >
              <ChevronRight className="size-4 sm:size-5" />
            </button>

            <div className="absolute bottom-1.5 left-1/2 z-20 flex -translate-x-1/2 items-center sm:bottom-3">
              {safeSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="group flex items-center justify-center px-0.5 py-2 sm:px-1 sm:py-1.5"
                >
                  <span
                    className={`block h-[3px] rounded-full transition-all group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-white sm:h-1.5 ${
                      i === index
                        ? "w-4 bg-[#E50914] sm:w-7"
                        : "w-1.5 bg-white/45 group-hover:bg-white/70 sm:w-3"
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
