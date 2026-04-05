import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared title style for detail-page blocks (cast/crew, gallery, etc.) so size, weight, and tracking stay consistent.
 */
export function DetailSectionHeading({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <h2
      id={id}
      className={cn(
        "font-(family-name:--font-anton) text-base font-normal uppercase tracking[0.14em] text-white sm:text-lg",
        className
      )}
    >
      {children}
    </h2>
  );
}
