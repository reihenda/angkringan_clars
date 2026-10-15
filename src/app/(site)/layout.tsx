import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import { Crown, Instagram } from "@/components/Logo";
import { SiteNav } from "@/components/site/SiteNav";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/public-data";

export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const wa = waLink(s.whatsapp, "Halo Clars, saya mau tanya.");
  return (
    <>
      <SiteNav wa={wa} />
      <div className="flex-1">{children}</div>
      <footer className="overflow-hidden bg-pink text-white">
        <div className="mx-auto max-w-7xl px-5 pb-6 pt-16 sm:px-8">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <p className="script text-[28px]/tight">“{s.tagline}”</p>
              <p className="mt-4 max-w-sm text-[17px]/7 text-white/90">Kumpul, makan, main, happy!</p>
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Jelajahi</h2>
              <ul className="mt-3 space-y-2 text-[16px] font-medium">
                <li><Link className="hover:underline" href="/menu">Menu lengkap</Link></li>
                <li><Link className="hover:underline" href="/#billiard">Billiard</Link></li>
                <li><Link className="hover:underline" href="/tentang">Tentang Clars</Link></li>
                <li><Link className="hover:underline" href="/#kontak">Lokasi &amp; jam buka</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Hubungi kami</h2>
              <ul className="mt-3 space-y-2.5 text-[16px] font-medium">
                <li className="flex items-start gap-2"><MapPin size={18} className="mt-1 shrink-0" />{s.address}</li>
                <li>
                  <a className="flex items-center gap-2 hover:underline" href={wa} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                </li>
                <li>
                  <a className="flex items-center gap-2 hover:underline" href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer">
                    <Instagram size={18} /> @{s.instagram}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex select-none items-end justify-center gap-3 text-white/95" aria-hidden>
          <Crown className="mb-[4vw] h-[6vw] w-auto" />
          <span className="script neon -mb-[1.6vw] text-[26vw] leading-[0.8] sm:text-[20vw]">Clars</span>
        </div>
        <div className="bg-plum px-5 py-4 text-sm text-white/70 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} {s.storeName}</p>
            <Link href="/login" className="font-semibold text-white/80 hover:text-white">Masuk staf</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
