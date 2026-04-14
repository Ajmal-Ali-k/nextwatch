"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Tv,
  Clapperboard,
  LogOut,
  Play,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavGroup = {
  label: string;
  items: { href: string; label: string; icon: LucideIcon }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Home Sections",
    items: [
      { href: "/admin/home-sections/theatres", label: "Cinemas", icon: Clapperboard },
      { href: "/admin/home-sections/ott-movies", label: "OTT Movies", icon: Film },
      { href: "/admin/home-sections/ott-series", label: "OTT Series", icon: Tv },
    ],
  },
  {
    label: "Trailers",
    items: [
      { href: "/admin/trailers", label: "Trailers", icon: Play },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-white">
      <div className="px-4 py-5">
        <Link href="/admin" className="text-lg font-bold text-gray-900">
          NextWatch
        </Link>
        <p className="text-xs text-gray-500">Admin Panel</p>
      </div>

      <nav className="flex-1 space-y-4 px-2 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label || "top"}>
            {group.label && (
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-gray-600"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
