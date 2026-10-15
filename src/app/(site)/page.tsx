import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Crown, Instagram } from "@/components/Logo";
import { Calculator } from "@/components/site/Calculator";
import { OpenBadge, TableBoard } from "@/components/site/LiveBoard";
import { price, rupiah } from "@/lib/format";
import { getFavorites, getMenuBoard, getSiteContext, waLink } from "@/lib/public-data";

export const revalidate = 60;

export default async function HomePage() {
  const [{ settings: s, cfg }, board, favorites] = await Promise.all([
    getSiteContext(),
    getMenuBoard(),
    getFavorites(),
  ]);
  const rate = Number(s.billiardRate) || 25000;
  const wa = waLink(s.whatsapp);
  const cheapest = Math.min(...board.flatMap((c) => c.items.map((i) => i.price)));
  const itemCount = board.reduce((n, c) => n + c.items.length, 0);
  const strip = favorites.length ? favorites : board.flatMap((c) => c.items.slice(0, 2));

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden bg-blush">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-6 sm:px-8 lg:min-h-[calc(100dvh-72px)] lg:grid-cols-[1.15fr_1fr] lg:pb-20">
          <div className="relative z-10">
            <div className="rise flex items-end gap-2 pb-5 text-pink-bright" style={{ "--d": 0 } as React.CSSProperties}>
              <Crown className="mb-[5.2rem] h-10 w-auto sm:mb-28 sm:h-14" />
              <span className="script neon -ml-1 text-[7.5rem]/[0.8] sm:text-[11rem]/[0.8] lg:text-[13rem]/[0.8]">Clars</span>
            </div>
            <p
              className="rise mt-3 inline-block rounded-full bg-pink px-5 py-2 text-sm font-extrabold tracking-wide text-white sm:text-base"
              style={{ "--d": 1 } as React.CSSProperties}
            >
              ANGKRINGAN &amp; BILLIARD
            </p>
            <h1
              className="rise mt-6 text-[clamp(1.95rem,8.2vw,3.6rem)]/[1.06] font-extrabold tracking-[-0.03em] text-ink"
              style={{ "--d": 2 } as React.CSSProperties}
            >
              Nongkrong nyaman,<br />pulang segan.
            </h1>
            <p
              className="rise mt-5 max-w-lg text-lg/8 text-ink"
              style={{ "--d": 3 } as React.CSSProperties}
            >
              Makan, minum, dan main billiard sampai lupa waktu. Menu mulai {rupiah(cheapest)}, billiard {rupiah(rate)} per jam.
            </p>
            <div className="rise mt-8 flex flex-wrap items-center gap-3" style={{ "--d": 4 } as React.CSSProperties}>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 rounded-full bg-pink px-7 py-4 text-lg font-bold text-white transition hover:bg-pink-deep active:scale-95"
              >
                Lihat menu <ArrowRight size={20} />
              </Link>
              <Link
                href="/#billiard"
                className="inline-flex items-center rounded-full bg-petal px-7 py-4 text-lg font-bold text-pink-deep transition hover:bg-rose/60 active:scale-95"
              >
                Cek meja billiard
              </Link>
            </div>
            <div className="rise mt-6" style={{ "--d": 5 } as React.CSSProperties}>
              <OpenBadge />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="rise relative" style={{ "--d": 2 } as React.CSSProperties}>
              <Image
                src="/img/drinks-hero.png"
                alt="Dua gelas minuman Clars: pink milk dan kopi susu dengan es"
                width={290}
                height={280}
                priority
                sizes="(min-width:1024px) 520px, 90vw"
                className="tilt ml-auto w-[88%] rotate-2 rounded-[2.5rem] bg-petal object-cover"
              />
              <Image
                src="/img/sate.png"
                alt="Aneka sate-satean bakar"
                width={255}
                height={150}
                sizes="(min-width:1024px) 280px, 46vw"
                className="tilt absolute -bottom-8 left-0 w-[46%] -rotate-3 rounded-3xl border-[6px] border-blush object-cover"
              />
              <Image
                src="/img/nasi-bungkus.png"
                alt="Nasi bakar dalam daun pisang"
                width={250}
                height={150}
                sizes="(min-width:1024px) 240px, 38vw"
                className="tilt absolute -right-1 -top-6 w-[36%] rotate-6 rounded-3xl border-[6px] border-blush object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* STRIP FAVORIT */}
      <section className="overflow-hidden bg-pink py-4 text-white" aria-label="Menu favorit">
        <div className="marquee-track flex gap-10 whitespace-nowrap text-xl font-extrabold" aria-hidden>
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 gap-10">
              {strip.map((m) => (
                <span key={m.name + k} className="flex items-center gap-10">
                  <span>
                    {m.name} <span className="font-medium text-white/85">{price(m.price)}</span>
                  </span>
                  <Crown className="h-5 w-auto" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* FAVORIT */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="reveal script text-6xl/[1] text-pink sm:text-7xl/[1]">Menu favorit</h2>
            <p className="reveal reveal-d1 mt-5 max-w-sm text-lg/8">
              Yang paling sering dipesan teman nongkrong. Semua harga sudah termasuk porsi bikin kenyang.
            </p>
            <Link href="/menu" className="reveal reveal-d2 mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-bold text-white transition hover:bg-pink active:scale-95">
              Semua {itemCount} menu <ArrowRight size={18} />
            </Link>
          </div>
          <ul className="gap-4 sm:columns-2">
            {favorites.map((m, i) => (
              <li
                key={m.id}
                className={`reveal mb-4 break-inside-avoid overflow-hidden rounded-3xl ${i === 0 ? "bg-pink text-white [column-span:all]" : "bg-petal text-ink"}`}
              >
                {m.imageUrl ? (
                  <Image
                    src={m.imageUrl}
                    alt={m.name}
                    width={330}
                    height={250}
                    sizes="(min-width:1024px) 400px, 90vw"
                    className={`w-full object-cover ${i === 0 ? "h-60 sm:h-72" : "h-44"}`}
                  />
                ) : null}
                <div className="p-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className={`font-extrabold tracking-tight ${i === 0 ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{m.name}</h3>
                    <p className={`tnum shrink-0 text-2xl font-extrabold ${i === 0 ? "text-white" : "text-pink-deep"}`}>{price(m.price)}</p>
                  </div>
                  {m.description ? <p className={`mt-2 text-[16px]/7 ${i === 0 ? "text-white/95" : "text-ink"}`}>{m.description}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PAPAN MENU RINGKAS */}
      <section className="bg-petal py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className="reveal max-w-2xl text-4xl/[1.05] font-extrabold tracking-[-0.03em] sm:text-6xl/[1.05]">
            Dari es teh sampai nasi goreng spesial.
          </h2>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {board.map((c) => (
              <div key={c.id} className="reveal rounded-3xl bg-white p-6 sm:p-8">
                <h3 className="script text-5xl/[1] text-pink">
                  <Link href={`/menu#${c.slug}`} className="hover:underline">{c.name}</Link>
                </h3>
                <ul className="mt-6 space-y-3">
                  {c.items.slice(0, 6).map((i) => (
                    <li key={i.id} className="leader text-[17px]">
                      <span className="font-medium">{i.name}</span>
                      <span className="tnum font-extrabold text-pink-deep">{price(i.price)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 font-semibold text-muted">dan {Math.max(0, c.items.length - 6)} lainnya</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/menu" className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-lg font-bold text-white transition hover:bg-pink active:scale-95">
              Buka menu lengkap <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* BILLIARD */}
      <section id="billiard" className="scroll-mt-16 bg-plum py-20 text-white lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="reveal script neon text-7xl/[0.95] text-pink-bright sm:text-[8rem]/[0.95]">Billiard</h2>
              <p className="reveal reveal-d1 mt-8 flex flex-wrap items-baseline gap-x-3 font-extrabold tracking-tight">
                <span className="text-7xl/none sm:text-9xl/none">{price(rate)}</span>
                <span className="text-3xl text-white/85">/ jam</span>
              </p>
              <p className="reveal reveal-d2 mt-5 max-w-lg text-xl/8 text-white">
                Min charge {price(cfg.minCharge)} dapat gratis {cfg.freeHours} jam billiard. Belanja menu sambil main, bayar lebih hemat.
              </p>
            </div>
            <Image
              src="/img/billiard.png"
              alt="Meja billiard dengan bola warna-warni"
              width={270}
              height={135}
              sizes="(min-width:1024px) 480px, 90vw"
              className="reveal w-full rounded-3xl object-cover"
            />
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-2">
            <div className="reveal rounded-3xl bg-felt p-6 sm:p-8">
              <h3 className="mb-5 text-2xl font-extrabold tracking-tight text-white">Meja sekarang</h3>
              <TableBoard />
            </div>
            <div className="reveal reveal-d1">
              <Calculator rate={rate} minCharge={cfg.minCharge} freeHours={cfg.freeHours} />
            </div>
          </div>
        </div>
      </section>

      {/* TENTANG */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <Image
            src="/img/mie-goreng.png"
            alt="Mie goreng telur mata sapi di piring hitam"
            width={245}
            height={125}
            sizes="(min-width:1024px) 520px, 90vw"
            className="reveal w-full rounded-[2.5rem] object-cover"
          />
          <div>
            <h2 className="reveal script text-6xl/[1] text-pink sm:text-7xl/[1]">Tentang Clars</h2>
            <p className="reveal reveal-d1 mt-6 text-xl/9">{s.about}</p>
            <Link href="/tentang" className="reveal reveal-d2 mt-8 inline-flex items-center gap-2 rounded-full bg-pink px-6 py-3.5 font-bold text-white transition hover:bg-pink-deep active:scale-95">
              Kenali Clars <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* KONTAK */}
      <section id="kontak" className="scroll-mt-16 bg-petal py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className="reveal max-w-xl text-4xl/[1.05] font-extrabold tracking-[-0.03em] sm:text-6xl/[1.05]">
            Mampir, kami tunggu.
          </h2>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            <div className="reveal rounded-3xl bg-white p-7">
              <h3 className="text-2xl font-extrabold">Lokasi</h3>
              <p className="mt-2 text-[17px]/7">{s.address}</p>
              <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 font-bold text-pink-deep hover:underline">
                Buka di Google Maps <ArrowRight size={16} />
              </a>
            </div>
            <div className="reveal reveal-d1 rounded-3xl bg-white p-7">
              <h3 className="text-2xl font-extrabold">Jam buka</h3>
              <p className="tnum mt-2 text-3xl font-extrabold tracking-tight">
                {s.openTime.replace(":", ".")} – {s.closeTime.replace(":", ".")}
              </p>
              <p className="mt-1 text-[17px]/7">Setiap hari.</p>
            </div>
            <div className="reveal reveal-d2 rounded-3xl bg-pink p-7 text-white">
              <h3 className="text-2xl font-extrabold">Tanya atau booking meja</h3>
              <div className="mt-4 flex flex-col gap-2.5">
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-pink-deep transition active:scale-95">
                  <MessageCircle size={18} /> Chat WhatsApp
                </a>
                <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 px-6 py-3.5 font-bold transition hover:bg-white/25 active:scale-95">
                  <Instagram size={18} /> @{s.instagram}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
