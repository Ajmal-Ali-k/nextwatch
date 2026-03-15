import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

const navLinks = [
  { href: "/in-theaters", label: "In Theaters" },
  { href: "/movies", label: "Movies" },
  { href: "/tv-shows", label: "TV Shows" },
  { href: "/calendar", label: "Calendar" },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#D6212A] border-t border-[#D6212A]/50 mt-12">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 font-bold tracking-tight text-white text-lg sm:text-xl"
        >
          NextWatchList
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-white/90 transition-colors hover:text-white"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 text-white/90">
          <button
            type="button"
            className="transition-colors hover:text-white"
            aria-label="X (Twitter)"
          >
            <Twitter className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="transition-colors hover:text-white"
            aria-label="Facebook"
          >
            <Facebook className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="transition-colors hover:text-white"
            aria-label="Instagram"
          >
            <Instagram className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}

