import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { price } from "@/lib/format";
import { getMenuBoard, getSiteContext, waLink } from "@/lib/public-data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Menu",
  description: "Daftar menu lengkap Clars: minuman, makanan, dan sate-satean dengan harga terjangkau.",
};

const PHOTOS: Record<string, { src: string; alt: string; w: number; h: number }[]> = {
  minuman: [
    { src: "/img/drinks-trio.png", alt: "Tiga gelas minuman dingin Clars", w: 330, h: 250 },
    { src: "/img/kopi-es.jpg", alt: "Segelas es kopi susu", w: 900, h: 900 },
  ],
  makanan: [
    { src: "/img/mie-goreng-telur.jpg", alt: "Mie goreng dengan telur mata sapi", w: 690, h: 900 },
    { src: "/img/nasi-goreng.jpg", alt: "Nasi goreng dengan kerupuk dan telur", w: 1100, h: 825 },
  ],
  "sate-satean": [{ src: "/img/sate.jpg", alt: "Sate bakar di atas daun pisang", w: 1100, h: 733 }],
};

export default async function MenuPage() {
  const [board, { settings: s }] = await Promise.all([getMenuBoard(), getSiteContext()]);

  return (
    <main className="bg-blush">
      <header className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-10 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:pt-16">
        <div>
          <h1 className="script neon text-7xl/[1] text-pink-bright sm:text-[9rem]/[0.95]">Menu</h1>
          <p className="mt-4 max-w-xl text-xl/8">
            Harga dalam rupiah. Mau pesan atau tanya stok? Langsung chat kami.
          </p>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Kategori menu">
            {board.map((c) => (
              <a key={c.id} href={`#${c.slug}`} className="rounded-full bg-pink px-5 py-3 font-bold text-white transition hover:bg-pink-deep active:scale-95">
                {c.name}
              </a>
            ))}
          </nav>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <Image src="/img/drinks-hero.png" alt="Pink milk dan kopi susu Clars" width={290} height={280} priority sizes="(min-width:1024px) 440px, 80vw" className="ml-auto w-[80%] rotate-2 rounded-[2.5rem] bg-petal object-cover" />
          <Image src="/img/sate.jpg" alt="Sate bakar di atas daun pisang" width={1100} height={733} sizes="(min-width:1024px) 240px, 40vw" className="absolute -bottom-6 left-0 w-[42%] -rotate-3 rounded-3xl border-[6px] border-blush object-cover" />
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-16 px-5 pb-24 sm:px-8 lg:space-y-24">
        {board.map((c) => (
          <section key={c.id} id={c.slug} className="scroll-mt-24">
            <h2 className="reveal brush script text-5xl/[1.15] sm:text-6xl/[1.15]">
              <span>{c.name}</span>
            </h2>
            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
              <ul className="grid content-start gap-x-14 gap-y-3.5 md:grid-cols-2">
                {c.items.map((i) => (
                  <li key={i.id} className="reveal">
                    <div className={`leader text-[18px] ${i.isAvailable ? "" : "opacity-50"}`}>
                      <span className={`font-semibold ${i.isAvailable ? "" : "line-through"}`}>
                        {i.name}
                        {i.isFavorite ? <span className="ml-2 rounded-full bg-pink px-2 py-0.5 align-middle text-xs font-bold text-white">Favorit</span> : null}
                      </span>
                      <span className="tnum rounded-lg bg-petal px-2.5 py-0.5 font-extrabold text-pink-deep">{price(i.price)}</span>
                    </div>
                    {i.description ? <p className="mt-0.5 text-[15px] text-muted">{i.description}</p> : null}
                    {!i.isAvailable ? <p className="mt-0.5 text-sm font-bold text-red-700">Sedang habis</p> : null}
                  </li>
                ))}
              </ul>
              <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {(PHOTOS[c.slug] ?? []).map((p) => (
                  <Image key={p.src} src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="(min-width:1024px) 300px, 45vw" className="reveal aspect-[4/3] w-full rounded-3xl object-cover" />
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="reveal flex flex-wrap items-center justify-between gap-6 rounded-[2rem] bg-pink p-8 text-white sm:p-12">
          <div>
            <p className="script text-4xl/[1.1] sm:text-6xl/[1.05]">Kumpul, makan, main, happy!</p>
            <p className="mt-3 text-lg">Setelan enak buat temen nongkrong.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={waLink(s.whatsapp, "Halo Clars, saya mau pesan.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-lg font-bold text-pink-deep transition active:scale-95">
              <MessageCircle size={20} /> Pesan via WhatsApp
            </a>
            <Link href="/#billiard" className="inline-flex items-center rounded-full bg-white/15 px-7 py-4 text-lg font-bold transition hover:bg-white/25 active:scale-95">
              Info billiard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
