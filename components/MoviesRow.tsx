"use client"

import Image, { type StaticImageData } from "next/image"
import { useRef } from "react"
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
}: {
  title: string
  movies: Movie[]
  glow?: boolean
}) {
  const scrollRef = useRef(null)
  const { scrollXProgress } = useScroll({ container: scrollRef })
  const maskImage = useScrollOverflowMask(scrollXProgress)

  return (
    <section className="relative mx-auto px-4 sm:px-6">
      {glow && (
        <div className="pointer-events-none absolute inset-0 -top-32 -bottom-32 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(214,33,42,0.45)_0%,rgba(214,33,42,0.15)_40%,transparent_70%)]" />
        </div>
      )}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          className="rounded-md border border-[#E50914] bg-transparent px-10 py-2 text-sm font-medium text-white transition hover:bg-[#E50914] hover:text-white"
        >
          View All
        </button>
      </div>

      <div className="flex items-start gap-0">
        <div className="hidden shrink-0 md:flex w-[160px] lg:w-[280px] items-center self-stretch overflow-hidden pr-4">
          <h2 className="font-(family-name:--font-anton) text-3xl lg:text-5xl uppercase leading-[1.1] tracking-tight text-white ">
            {title}
          </h2>
        </div>

        <h2 className="mb-4 block text-2xl font-black uppercase tracking-tight text-white md:hidden">
          {title}
        </h2>

        <motion.div
          ref={scrollRef}
          className="scroll-linked-list flex min-w-0 flex-1 gap-5 overflow-x-scroll pb-4"
          style={{ maskImage }}
        >
          {movies.map((movie) => (
            <article
              key={movie.title}
              className="group flex shrink-0 flex-col"
              style={{ width: "calc((100% - 4 * 1.25rem) / 4.5)" }}
            >
              <div className="relative mb-3 aspect-1.5/2 overflow-hidden rounded-sm shadow-none transition group-hover:shadow-[0_0_30px_rgba(214,33,42,0.6)]">
                <Image
                  src={movie.image}
                  alt={movie.title}
                  width={300}
                  height={450}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="font-(family-name:--font-anton) text-lg leading-snug text-white line-clamp-2">
                {movie.title}
              </h3>
              <p className="mt-1 text-sm text-white/60">{movie.date}</p>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
