import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";
import { createNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = createNoIndexMetadata({
  title: "Admin",
  description: "Private NextWatchList admin area.",
  path: "/admin",
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {children}
      <Toaster />
    </div>
  );
}
