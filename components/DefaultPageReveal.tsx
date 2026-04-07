"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const easeOut = [0.16, 1, 0.3, 1] as const;

/**
 * Soft entrance for inner routes. Home (`/`) skips this — it uses {@link HomePageReveal} instead.
 */
export function DefaultPageReveal({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion || pathname === "/") {
    return <>{children}</>;
  }

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
