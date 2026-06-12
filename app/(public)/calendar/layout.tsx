import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Release Calendar",
  description:
    "Track upcoming theater, movie, and TV streaming release dates in one regional calendar.",
  path: "/calendar",
});

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
