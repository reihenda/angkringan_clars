"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/Logo";

const LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/#billiard", label: "Billiard" },
  { href: "/tentang", label: "Tentang" },
  { href: "/#kontak", label: "Kontak" },
];

export function SiteNav({ wa }: { wa: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-blush">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
        <Link href="/" className="text-pink" aria-label="Clars, ke beranda" onClick={() => setOpen(false)}>
          <Wordmark size="text-4xl" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Utama">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-[15px] font-semibold text-ink transition hover:text-pink">
              {l.label}
            </Link>
          ))}
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-pink px-5 py-2.5 text-[15px] font-bold text-white transition hover:bg-pink-deep active:scale-95"
          >
            Chat WhatsApp
          </a>
        </nav>
        <button
          className="grid size-11 place-items-center rounded-full bg-pink text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open ? (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-[64px] z-40 flex flex-col justify-between bg-pink p-6 text-white md:hidden">
          <nav className="flex flex-col" aria-label="Menu seluler">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="script py-3 text-5xl"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white px-6 py-4 text-center text-lg font-bold text-pink-deep">
            Chat WhatsApp
          </a>
        </div>
      ) : null}
    </header>
  );
}
