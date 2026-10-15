import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, MessageCircle } from "lucide-react";
import { price } from "@/lib/format";
import { getMenuBoard, getSiteContext, waLink } from "@/lib/public-data";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Kenali Clars Angkringan & Billiard: cerita, visi, dan apa yang kami sajikan.",
};

export default async function TentangPage() {
  const [{ settings: s, tables, cfg }, board] = await Promise.all([getSiteContext(), getMenuBoard()]);
  const itemCount = board.reduce((n, c) => n + c.items.length, 0);
  const rate = Number(s.billiardRate) || 25000;

  const facts = [
    { big: String(itemCount), small: "menu minuman, makanan, dan sate-satean" },
    { big: String(tables), small: "meja billiard siap main" },
    { big: price(rate), small: "per jam, gratis 1 jam di min charge " + price(cfg.minCharge) },
  ];
  const pillars = [
    { title: "Angkringan", text: "Nasi kucing, sate-satean, mie, dan minuman hangat-dingin dengan harga yang ramah di kantong." },
    { title: "Billiard", text: "Main santai bareng teman. Tarif jelas per jam, tanpa biaya tersembunyi." },
    { title: "Tempat betah", text: "Duduk lama, ngobrol, makan, lalu pulang dengan perasaan segan untuk beranjak." },
  ];

  return (
    <main>
      <section className="bg-blush">
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 lg:pb-28 lg:pt-16">
          <h1 className="script text-[clamp(2.6rem,7.4vw,6rem)]/[1.02] text-pink-bright">
            Tempat nongkrong<br />yang bikin betah.
          </h1>
          <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="reveal max-w-2xl text-xl/9">{s.about}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/menu" className="inline-flex items-center gap-2 rounded-full bg-pink px-7 py-4 text-lg font-bold text-white transition hover:bg-pink-deep active:scale-95">
                  Lihat menu <ArrowRight size={20} />
                </Link>
                <a href={waLink(s.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-petal px-7 py-4 text-lg font-bold text-pink-deep transition hover:bg-rose/60 active:scale-95">
                  <MessageCircle size={20} /> Chat WhatsApp
                </a>
              </div>
            </div>
            <Image
              src="/img/drinks-trio.png"
              alt="Tiga gelas minuman Clars: pink milk, cokelat, dan teh jeruk"
              width={330}
              height={250}
              sizes="(min-width:1024px) 480px, 90vw"
              className="reveal w-full rounded-[2.5rem] bg-petal object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-pink py-20 text-white lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 md:grid-cols-3">
          {facts.map((f) => (
            <div key={f.small} className="reveal">
              <p className="tnum text-6xl/none font-extrabold tracking-tight xl:text-8xl/none">{f.big}</p>
              <p className="mt-3 max-w-[18rem] text-lg/7 text-white">{f.small}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <h2 className="reveal text-4xl/[1.05] font-extrabold tracking-[-0.03em] sm:text-6xl/[1.05]">Apa yang kami sajikan.</h2>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {pillars.map((p, i) => (
            <div key={p.title} className={`reveal rounded-3xl p-8 ${i === 1 ? "bg-plum text-white" : "bg-petal"}`}>
              <h3 className="script text-5xl/[1.1]">{p.title}</h3>
              <p className="mt-4 text-lg/8">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:pb-32">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { src: "/img/nasi-bungkus.png", alt: "Nasi bakar dalam daun pisang", w: 250, h: 150 },
            { src: "/img/sate.png", alt: "Sate-satean bakar", w: 255, h: 150 },
            { src: "/img/billiard.png", alt: "Meja billiard Clars", w: 270, h: 135 },
            { src: "/img/mie-goreng.png", alt: "Mie goreng telur", w: 245, h: 125 },
          ].map((p) => (
            <Image key={p.src} src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="(min-width:1024px) 300px, 90vw" className="reveal h-56 w-full rounded-3xl object-cover" />
          ))}
        </div>
      </section>

      <section className="bg-petal py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="reveal script text-6xl/[1] text-pink">Visi</h2>
            <p className="reveal reveal-d1 mt-5 text-2xl/10 font-semibold">
              Menjadi tempat berkumpul favorit warga sekitar: murah, enak, dan nyaman untuk semua kalangan.
            </p>
          </div>
          <div>
            <h2 className="reveal script text-6xl/[1] text-pink">Misi</h2>
            <ul className="mt-5 space-y-4 text-xl/8">
              {[
                "Menyajikan makanan dan minuman dengan harga bersahabat dan rasa konsisten.",
                "Menyediakan meja billiard terawat dengan tarif yang transparan.",
                "Melayani dengan ramah supaya setiap tamu merasa seperti di rumah sendiri.",
              ].map((m) => (
                <li key={m} className="reveal flex gap-3">
                  <span className="mt-3 size-2.5 shrink-0 rounded-full bg-pink" aria-hidden />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <div className="reveal flex flex-wrap items-center justify-between gap-8 rounded-[2rem] bg-plum p-8 text-white sm:p-14">
          <div>
            <p className="script text-4xl/[1.1] text-pink-bright sm:text-7xl/[1]">Kumpul, makan, main, happy!</p>
            <p className="mt-4 flex items-start gap-2 text-lg/7 text-white">
              <MapPin size={20} className="mt-1 shrink-0" /> {s.address}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={waLink(s.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-pink px-7 py-4 text-lg font-bold transition hover:bg-pink-deep active:scale-95">
              <MessageCircle size={20} /> Chat WhatsApp
            </a>
            <Link href="/menu" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-7 py-4 text-lg font-bold transition hover:bg-white/25 active:scale-95">
              Lihat menu <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
