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
    <footer className="w-full border-t border-[#D6212A]/50 bg-[#D6212A] mt-8 sm:mt-12">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-3 px-3 py-5 sm:flex-row sm:gap-6 sm:px-4 sm:py-4 md:px-6">
        <Link
          href="/"
          className="shrink-0 font-bold tracking-tight text-white text-base font-heading antialiased sm:text-xl"
        >
          NextWatchList
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 md:flex-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-xs font-medium text-white/90 transition-colors hover:text-white font-sans sm:text-sm"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 text-white/90 sm:gap-4">
          <button
            type="button"
            className="transition-colors hover:text-white font-sans"
            aria-label="X (Twitter)"
          >
            <Twitter className="size-3.5 sm:size-4" />
          </button>
          <button
            type="button"
            className="transition-colors hover:text-white font-sans"
            aria-label="Facebook"
          >
            <Facebook className="size-3.5 sm:size-4" />
          </button>
          <Link
            href="https://www.instagram.com/next.watch.list?igsh=aTJqZm5iZTV6MHJj"
            className="transition-colors hover:text-white font-sans"
            aria-label="Instagram"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Instagram className="size-3.5 sm:size-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}

