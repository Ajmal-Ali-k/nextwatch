import type { Metadata } from "next";

import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Admin Login",
  description: "Private NextWatchList admin sign-in page.",
  path: "/admin/login",
});

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
