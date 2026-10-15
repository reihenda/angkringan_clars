"use client";

import { useEffect, useState } from "react";

type Status = {
  open: boolean;
  openTime: string;
  closeTime: string;
  tables: { id: string; name: string; busy: boolean; since: string | null }[];
};

export function useStatus(initial?: Status | null) {
  const [s, setS] = useState<Status | null>(initial ?? null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/status", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => alive && d && setS(d))
        .catch(() => {});
    load();
    const t = setInterval(load, 20000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);
  return s;
}

export function OpenBadge({ light = false }: { light?: boolean }) {
  const s = useStatus();
  if (!s) return <span className="inline-block h-8 w-44" aria-hidden />;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
        light ? "bg-white/15 text-white" : "bg-white text-ink"
      }`}
    >
      <span className={`live-dot size-2.5 rounded-full ${s.open ? "bg-ok" : "bg-red-500"}`} />
      {s.open ? `Buka sekarang · sampai ${s.closeTime.replace(":", ".")}` : `Tutup · buka ${s.openTime.replace(":", ".")}`}
    </span>
  );
}

/** Papan meja billiard: kosong / dipakai, diperbarui otomatis. */
export function TableBoard() {
  const s = useStatus();
  if (!s) {
    return <div className="h-40 animate-pulse rounded-3xl bg-white/10" aria-hidden />;
  }
  if (s.tables.length === 0) return <p className="text-white/80">Info meja belum tersedia.</p>;
  const free = s.tables.filter((t) => !t.busy).length;
  return (
    <div>
      <p className="text-lg font-bold text-white">
        {free > 0 ? `${free} dari ${s.tables.length} meja kosong sekarang` : "Semua meja sedang dipakai"}
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {s.tables.map((t) => (
          <li
            key={t.id}
            className={`rounded-2xl p-4 ${t.busy ? "bg-white/10 text-white" : "bg-white text-plum"}`}
          >
            <p className="text-lg font-extrabold">{t.name}</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold">
              <span className={`size-2.5 rounded-full ${t.busy ? "live-dot bg-pink" : "bg-ok"}`} />
              {t.busy ? "Dipakai" : "Kosong"}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-white/70">Diperbarui otomatis. Kondisi bisa berubah, hubungi kami untuk booking.</p>
    </div>
  );
}
