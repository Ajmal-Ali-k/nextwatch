"use client"

import Image, { type StaticImageData } from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  animate,
  motion,
  type MotionValue,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
} from "motion/react"

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
  title: string
  date: string
  image: string | StaticImageData
}

export default function LatestTrailersRow({
  title = "Latest Trailers",
  trailers,
  filters = ["Theatre", "OTT Series", "OTT Movies"],
}: {
  title?: string
  trailers: Trailer[]
  filters?: string[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollXProgress } = useScroll({ container: scrollRef })
  const maskImage = useScrollOverflowMask(scrollXProgress)
  const [activeFilter, setActiveFilter] = useState(filters[0] ?? "")
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
  }, [updateScrollButtons])

  useMotionValueEvent(scrollXProgress, "change", () => {
    updateScrollButtons()
  })

  return (
    <section className="relative w-full overflow-hidden rounded-2xl">
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
            {filters.map((filter) => (
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
            {trailers.map((trailer, index) => (
              <article
                key={`${trailer.title}-${index}`}
                className="group flex shrink-0 flex-col landscape-card"
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
                </div>
                <h3 className="font-(family-name:--font-anton) text-base sm:text-lg leading-snug text-white line-clamp-2">
                  {trailer.title}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-white/60">
                  {trailer.date}
                </p>
              </article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

