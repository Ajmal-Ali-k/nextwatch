"use client"

import Image, { type StaticImageData } from "next/image"
import { useRef, useState } from "react"
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

export type Movie = {
  title: string
  date: string
  image: string | StaticImageData
}

export default function MoviesRow({
  title,
  movies,
  glow = false,
  filters,
  landscape = false,
  showViewAll = true,
}: {
  title: string
  movies: Movie[]
  glow?: boolean
  filters?: string[]
  landscape?: boolean
  showViewAll?: boolean
}) {
  const scrollRef = useRef(null)
  const { scrollXProgress } = useScroll({ container: scrollRef })
  const maskImage = useScrollOverflowMask(scrollXProgress)
  const [activeFilter, setActiveFilter] = useState(filters?.[0] ?? "")

  return (
    <section className="relative w-full">
      {glow && (
        <div className="pointer-events-none absolute inset-0 -top-32 -bottom-32 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] lg:h-[1200px] lg:w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(214,33,42,0.45)_0%,rgba(214,33,42,0.15)_40%,transparent_70%)]" />
        </div>
      )}

      <div className="relative z-10 px-4 sm:px-6">
        {/* Header: title + filters + View All */}
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <h2 className="font-(family-name:--font-anton) text-2xl sm:text-3xl lg:text-4xl uppercase leading-tight tracking-tight text-white">
            {title}
          </h2>

          {filters && filters.length > 0 && (
            <div className="flex items-center gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full border px-5 py-1.5 text-sm font-medium transition ${
                    activeFilter === filter
                      ? "border-[#E50914] bg-[#E50914] text-white"
                      : "border-white/25 text-white/70 hover:border-white/50 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}

          {showViewAll && (
            <div className="ml-auto">
              <button
                type="button"
                className="group/btn relative overflow-hidden rounded-md border border-[#E50914] bg-transparent px-10 py-2 text-sm font-medium text-white"
              >
                <span className="absolute inset-0 -translate-x-full bg-[#E50914] transition-transform duration-300 ease-out group-hover/btn:translate-x-0" />
                <span className="relative">View All</span>
              </button>
            </div>
          )}
        </div>

        {/* Cards */}
        <motion.div
          ref={scrollRef}
          className="scroll-linked-list flex min-w-0 gap-3 sm:gap-5 overflow-x-scroll pb-4"
          style={{ maskImage }}
        >
          {movies.map((movie) => (
            <article
              key={movie.title}
              className={`group flex shrink-0 flex-col ${
                landscape ? "landscape-card" : "movie-card"
              }`}
            >
              <div
                className={`relative mb-3 overflow-hidden shadow-none transition group-hover:shadow-[0_0_30px_rgba(214,33,42,0.6)] ${
                  landscape
                    ? "aspect-video rounded-lg border border-white/10"
                    : "aspect-2/3 rounded-sm"
                }`}
              >
                <Image
                  src={movie.image}
                  alt={movie.title}
                  width={landscape ? 400 : 300}
                  height={landscape ? 225 : 450}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="font-(family-name:--font-anton) text-base sm:text-lg leading-snug text-white line-clamp-2">
                {movie.title}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-white/60">
                {movie.date}
              </p>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
