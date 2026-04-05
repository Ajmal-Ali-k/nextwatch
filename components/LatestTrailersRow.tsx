"use client"

import Image, { type StaticImageData } from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Play, X } from "lucide-react"
import {
  animate,
  motion,
  type MotionValue,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
} from "motion/react"

import type { HomeLatestTrailersByCategory } from "@/lib/tmdb/latestTrailersTypes"

const left = "0%"
const right = "100%"
const leftInset = "20%"
const rightInset = "80%"
const transparent = "#0000"
const opaque = "#000"

function useScrollOverflowMask(scrollXProgress: MotionValue<number>) {
  const maskImage = useMotionValue(
    `linear-gradient(90deg, ${opaque}, ${opaque} ${left}, ${opaque} ${rightInset}, ${transparent})`
  )

  useMotionValueEvent(scrollXProgress, "change", (value) => {
    if (value === 0) {
      animate(
        maskImage,
        `linear-gradient(90deg, ${opaque}, ${opaque} ${left}, ${opaque} ${rightInset}, ${transparent})`
      )
    } else if (value === 1) {
      animate(
        maskImage,
        `linear-gradient(90deg, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${right}, ${opaque})`
      )
    } else if (
      scrollXProgress.getPrevious() === 0 ||
      scrollXProgress.getPrevious() === 1
    ) {
      animate(
        maskImage,
        `linear-gradient(90deg, ${transparent}, ${opaque} ${leftInset}, ${opaque} ${rightInset}, ${transparent})`
      )
    }
  })

  return maskImage
}

export type Trailer = {
  id?: string
  title: string
  date: string
  image: string | StaticImageData
  youtubeKey?: string
  detailHref?: string
}

function YoutubeTrailerLightbox({
  open,
  onClose,
  youtubeKey,
  title,
}: {
  open: boolean
  onClose: () => void
  youtubeKey: string
  title: string
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Trailer: ${title}`}
        className="relative w-full max-w-5xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute -right-1 -top-2 z-10 flex size-8 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white transition hover:bg-white/15 sm:right-0 sm:top-0 sm:-translate-y-12"
          aria-label="Close trailer"
        >
          <X className="size-4" />
        </button>
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/10">
          <iframe
            title={`${title} trailer`}
            src={`https://www.youtube.com/embed/${encodeURIComponent(youtubeKey)}?autoplay=1&rel=0`}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}

export default function LatestTrailersRow({
  title = "Latest Trailers",
  trailers,
  trailersByCategory,
  initialFilter,
  filters = ["Theatre", "OTT Series", "OTT Movies"],
}: {
  title?: string
  /** Flat list (legacy). Ignored when `trailersByCategory` is set. */
  trailers?: Trailer[]
  trailersByCategory?: HomeLatestTrailersByCategory
  /** When using categories, preferred first tab (e.g. first non-empty). */
  initialFilter?: string
  filters?: string[]
}) {
  const filterTabs = filters.length ? filters : ["Theatre", "OTT Series", "OTT Movies"]
  const [activeFilter, setActiveFilter] = useState(
    () => initialFilter ?? filterTabs[0] ?? ""
  )
  const [playing, setPlaying] = useState<{ youtubeKey: string; title: string } | null>(
    null
  )

  const visibleTrailers: Trailer[] = useMemo(() => {
    if (trailersByCategory) {
      return trailersByCategory[activeFilter as keyof HomeLatestTrailersByCategory] ?? []
    }
    return trailers ?? []
  }, [trailersByCategory, activeFilter, trailers])

  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollXProgress } = useScroll({ container: scrollRef })
  const maskImage = useScrollOverflowMask(scrollXProgress)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollButtons = useCallback(() => {
    const node = scrollRef.current

    if (!node) return

    const maxScrollLeft = node.scrollWidth - node.clientWidth
    const hasOverflow = maxScrollLeft > 0

    if (!hasOverflow) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    setCanScrollLeft(node.scrollLeft > 8)
    setCanScrollRight(node.scrollLeft < maxScrollLeft - 8)
  }, [])

  const scrollByCards = useCallback((direction: "left" | "right") => {
    const node = scrollRef.current

    if (!node) return

    const amount = Math.max(node.clientWidth * 0.82, 280)

    node.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }, [])

  useEffect(() => {
    const frameId = window.requestAnimationFrame(updateScrollButtons)

    window.addEventListener("resize", updateScrollButtons)
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener("resize", updateScrollButtons)
    }
  }, [updateScrollButtons, visibleTrailers])

  useMotionValueEvent(scrollXProgress, "change", () => {
    updateScrollButtons()
  })

  return (
    <section className="relative w-full overflow-hidden rounded-2xl">
      <YoutubeTrailerLightbox
        open={playing != null}
        onClose={() => setPlaying(null)}
        youtubeKey={playing?.youtubeKey ?? ""}
        title={playing?.title ?? ""}
      />

      {/* background panel + red glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[#0a0a0a]/70" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.6)_35%,rgba(10,10,10,0.25)_62%,rgba(10,10,10,0.9)_100%)]" />
      </div>

      <div className="relative z-10 px-4 py-7 sm:px-6">
        {/* header */}
        <div className="mb-5 flex flex-wrap items-center gap-10">
          <h2 className="font-(family-name:--font-anton) text-2xl sm:text-3xl lg:text-4xl xl:text-5xl uppercase leading-tight tracking-tight text-white">
            {title}
          </h2>

          <div className="inline-flex items-center overflow-hidden rounded-full border border-[#E50914]/60 bg-black/20 p-1">
            {filterTabs.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`min-w-[110px] rounded-full px-6 py-2 text-sm font-medium transition ${
                  activeFilter === filter
                    ? "bg-[#E50914] text-white"
                    : "text-white/75 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* cards */}
        <div className="relative">
          <motion.button
            type="button"
            aria-label="Scroll trailers left"
            onClick={() => scrollByCards("left")}
            disabled={!canScrollLeft}
            className="pointer-events-auto absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/55 p-2.5 text-white shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur-md transition-colors disabled:pointer-events-none disabled:border-white/10 disabled:bg-black/30 disabled:text-white/40"
            animate={{
              opacity: canScrollLeft ? 1 : 0,
              x: canScrollLeft ? 0 : -14,
              scale: canScrollLeft ? 1 : 0.9,
            }}
            whileHover={canScrollLeft ? { scale: 1.08, x: -2 } : {}}
            whileTap={canScrollLeft ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            <span className="block text-lg leading-none">‹</span>
          </motion.button>

          <motion.button
            type="button"
            aria-label="Scroll trailers right"
            onClick={() => scrollByCards("right")}
            disabled={!canScrollRight}
            className="pointer-events-auto absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/55 p-2.5 text-white shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur-md transition-colors disabled:pointer-events-none disabled:border-white/10 disabled:bg-black/30 disabled:text-white/40"
            animate={{
              opacity: canScrollRight ? 1 : 0,
              x: canScrollRight ? 0 : 14,
              scale: canScrollRight ? 1 : 0.9,
            }}
            whileHover={canScrollRight ? { scale: 1.08, x: 2 } : {}}
            whileTap={canScrollRight ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            <span className="block text-lg leading-none">›</span>
          </motion.button>

          <motion.div
            ref={scrollRef}
            onScroll={updateScrollButtons}
            className="scroll-linked-list flex min-w-0 gap-5 overflow-x-scroll pb-4"
            style={{ maskImage }}
          >
            {visibleTrailers.length === 0 ? (
              <p className="py-8 text-sm text-white/55">
                No trailers in this category right now.
              </p>
            ) : (
              visibleTrailers.map((trailer, index) => {
                const rowKey = trailer.id ?? `${trailer.title}-${index}`
                const playable = Boolean(trailer.youtubeKey)

                return (
                  <article
                    key={rowKey}
                    className="group flex w-[min(100vw-3rem,320px)] shrink-0 flex-col landscape-card sm:w-[280px]"
                  >
                    {playable ? (
                      <button
                        type="button"
                        onClick={() =>
                          trailer.youtubeKey &&
                          setPlaying({ youtubeKey: trailer.youtubeKey, title: trailer.title })
                        }
                        className="text-left outline-offset-4 focus-visible:ring-2 focus-visible:ring-white/50"
                      >
                        <div className="relative mb-3 aspect-video overflow-hidden rounded-xl border border-white/10 transition group-hover:shadow-[0_0_30px_rgba(214,33,42,0.6)]">
                          <Image
                            src={trailer.image}
                            alt={trailer.title}
                            width={520}
                            height={292}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/10" />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-90 transition group-hover:bg-black/45">
                            <span className="flex size-14 items-center justify-center rounded-full bg-[#E50914] text-white shadow-lg ring-2 ring-white/30">
                              <Play className="size-7 fill-white" aria-hidden />
                            </span>
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="relative mb-3 aspect-video overflow-hidden rounded-xl border border-white/10">
                        <Image
                          src={trailer.image}
                          alt={trailer.title}
                          width={520}
                          height={292}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                      </div>
                    )}

                    <h3 className="font-(family-name:--font-anton) text-base sm:text-lg leading-snug text-white line-clamp-2">
                      {trailer.title}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-white/60">{trailer.date}</p>
                    {trailer.detailHref ? (
                      <Link
                        href={trailer.detailHref}
                        className="mt-2 inline-block text-xs font-medium text-[#E50914] underline-offset-2 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View details
                      </Link>
                    ) : null}
                  </article>
                )
              })
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
