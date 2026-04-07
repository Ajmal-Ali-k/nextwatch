"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const easeCinematic = [0.22, 1, 0.36, 1] as const;

type HomePageRevealProps = {
  hero: ReactNode;
  trailers: ReactNode;
  rows: ReactNode;
};

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.06,
    },
  },
};

const block = {
  hidden: {
    opacity: 0,
    y: 28,
    filter: "blur(10px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.58,
      ease: easeCinematic,
    },
  },
};

/**
 * First-paint cinema-style reveal: brand line sweep, subtle vignette, staggered blur-up sections.
 */
export function HomePageReveal({ hero, trailers, rows }: HomePageRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <>
        {hero}
        <div className="mx-auto flex container flex-col gap-16 pt-12">
          {trailers}
          {rows}
        </div>
      </>
    );
  }

  return (
    <div className="relative">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[120px] bg-linear-to-b from-black/50 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[8%] right-[8%] top-0 z-40 h-px origin-center bg-linear-to-r from-transparent via-[#E50914] to-transparent shadow-[0_0_24px_rgba(229,9,20,0.55)]"
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{
          scaleX: { duration: 0.72, ease: [0.65, 0, 0.35, 1] },
          opacity: { delay: 0.5, duration: 0.35, ease: "easeOut" },
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative"
      >
        <motion.div variants={block} className="relative">
          {hero}
        </motion.div>

        <motion.div variants={block} className="mx-auto w-full container pt-12">
          {trailers}
        </motion.div>

        <motion.div
          variants={block}
          className="mx-auto flex w-full container flex-col gap-16 pt-16"
        >
          {rows}
        </motion.div>
      </motion.div>
    </div>
  );
}
