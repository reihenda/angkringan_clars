import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { Wordmark } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Masuk Kasir", robots: { index: false } };

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/admin");
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-pink text-white lg:flex lg:flex-col lg:justify-between lg:p-14">
        <Wordmark size="text-8xl" className="neon" />
        <div>
          <p className="script text-5xl leading-tight">“Nongkrong Nyaman, Pulang Segan”</p>
          <p className="mt-4 max-w-sm text-lg/7 text-white/90">
            Sistem kasir dan stok Clars Angkringan &amp; Billiard.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/drinks-hero.png"
          alt=""
          className="absolute -right-10 top-24 w-80 rotate-6 rounded-[2rem] shadow-2xl"
        />
      </section>
      <section className="flex flex-col justify-center px-6 py-12 sm:px-14">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="inline-block text-pink lg:hidden">
            <Wordmark size="text-6xl" />
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight lg:mt-0">Masuk ke kasir</h1>
          <p className="mt-2 text-muted">Gunakan akun owner atau kasir yang diberikan.</p>
          <LoginForm />
          <Link href="/" className="mt-8 inline-block text-sm font-semibold text-pink-deep hover:underline">
            ← Kembali ke website
          </Link>
        </div>
      </section>
    </main>
  );
}
