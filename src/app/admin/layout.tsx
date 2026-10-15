import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, KeyRound, LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { logout } from "../login/actions";
import { Wordmark } from "@/components/Logo";
import { ToastProvider } from "@/components/Toast";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = {
  title: { default: "Kasir", template: "%s | Kasir Clars" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <ToastProvider>
      <div className="min-h-dvh md:grid md:grid-cols-[250px_1fr]">
        <aside className="sticky top-0 hidden h-dvh flex-col justify-between border-r border-petal bg-white p-5 md:flex">
          <div className="space-y-8">
            <Link href="/admin" className="block text-pink">
              <Wordmark size="text-5xl" />
              <span className="mt-1 block text-xs font-semibold text-muted">Kasir &amp; Stok</span>
            </Link>
            <AdminNav role={user.role} variant="side" />
          </div>
          <div className="space-y-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 px-3.5 text-sm font-semibold text-muted hover:text-pink-deep"
            >
              <ExternalLink size={16} /> Lihat website
            </Link>
            <div className="rounded-2xl bg-blush p-3.5">
              <p className="truncate font-bold">{user.name}</p>
              <p className="text-xs font-semibold text-muted">{user.role === "OWNER" ? "Owner" : "Kasir"}</p>
              <div className="mt-3 flex gap-2">
                <Link
                  href="/admin/akun"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-semibold hover:bg-petal"
                >
                  <KeyRound size={14} /> Password
                </Link>
                <form action={logout} className="flex-1">
                  <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                    <LogOut size={14} /> Keluar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col pb-20 md:pb-0">
          <header className="flex items-center justify-between border-b border-petal bg-white px-4 py-3 md:hidden">
            <Link href="/admin" className="text-pink">
              <Wordmark size="text-4xl" />
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/admin/akun" aria-label="Ganti password" className="grid size-10 place-items-center rounded-full text-muted">
                <KeyRound size={18} />
              </Link>
              <form action={logout}>
                <button aria-label="Keluar" className="grid size-10 place-items-center rounded-full text-red-700">
                  <LogOut size={18} />
                </button>
              </form>
            </div>
          </header>
          <main className="min-w-0 flex-1">{children}</main>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-petal bg-white md:hidden">
          <AdminNav role={user.role} variant="bottom" />
        </div>
      </div>
    </ToastProvider>
  );
}
