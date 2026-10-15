"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  CircleDot,
  LayoutDashboard,
  Receipt,
  ScrollText,
  Settings,
  UtensilsCrossed,
} from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Dasbor", icon: LayoutDashboard, owner: false, exact: true },
  { href: "/admin/kasir", label: "Kasir", icon: Receipt, owner: false },
  { href: "/admin/billiard", label: "Billiard", icon: CircleDot, owner: false },
  { href: "/admin/pesanan", label: "Pesanan", icon: ScrollText, owner: false },
  { href: "/admin/stok", label: "Stok", icon: Boxes, owner: false },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed, owner: true },
  { href: "/admin/laporan", label: "Laporan", icon: BarChart3, owner: true },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings, owner: true },
];

export function AdminNav({ role, variant }: { role: string; variant: "side" | "bottom" }) {
  const path = usePathname();
  const items = ITEMS.filter((i) => !i.owner || role === "OWNER");
  const active = (i: (typeof ITEMS)[number]) =>
    i.exact ? path === i.href : path === i.href || path.startsWith(i.href + "/");

  if (variant === "bottom") {
    return (
      <nav
        aria-label="Navigasi utama"
        className="flex gap-1 overflow-x-auto px-2 py-1.5 [scrollbar-width:none]"
      >
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active(i) ? "page" : undefined}
            className={`flex min-w-[4.5rem] shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition ${
              active(i) ? "bg-pink text-white" : "text-muted"
            }`}
          >
            <i.icon size={20} />
            {i.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={active(i) ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold transition ${
            active(i) ? "bg-pink text-white" : "text-ink/80 hover:bg-petal"
          }`}
        >
          <i.icon size={19} />
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
