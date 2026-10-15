import type { Metadata, Viewport } from "next";
import { Kaushan_Script, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const script = Kaushan_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Clars Angkringan & Billiard — Nongkrong Nyaman, Pulang Segan",
    template: "%s | Clars Angkringan & Billiard",
  },
  description:
    "Angkringan dan billiard dengan menu lengkap: minuman, makanan, sate-satean. Billiard mulai Rp25.000 per jam. Kumpul, makan, main, happy!",
};

export const viewport: Viewport = {
  themeColor: "#d81b6b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${script.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
