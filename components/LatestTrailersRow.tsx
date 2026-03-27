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
  const scrollRef = useRef(null)
  const { scrollXProgress } = useScroll({ container: scrollRef })
  const maskImage = useScrollOverflowMask(scrollXProgress)
  const [activeFilter, setActiveFilter] = useState(filters[0] ?? "")

  return (
    <section className="relative w-full overflow-hidden rounded-2xl">
      {/* background panel + red glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[#0a0a0a]/70" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.6)_35%,rgba(10,10,10,0.25)_62%,rgba(10,10,10,0.9)_100%)]" />
      </div>

      <div className="relative z-10 px-4 py-7 sm:px-6">
        {/* header */}
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <h2 className="font-(family-name:--font-anton) text-2xl sm:text-3xl lg:text-4xl uppercase leading-tight tracking-tight text-white">
            {title}
          </h2>

          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 p-1 backdrop-blur-sm">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
                  activeFilter === filter
                    ? "bg-[#E50914] text-white shadow-[0_8px_22px_rgba(229,9,20,0.35)]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* cards */}
        <motion.div
          ref={scrollRef}
          className="scroll-linked-list flex min-w-0 gap-5 overflow-x-scroll pb-4"
          style={{ maskImage }}
        >
          {trailers.map((trailer) => (
            <article
              key={trailer.title}
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
    </section>
  )
}

