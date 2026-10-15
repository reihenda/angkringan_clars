"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CircleDot, Play, Receipt, Sparkles, Square, UtensilsCrossed } from "lucide-react";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { btnPrimary, btnSoft, input, label } from "@/components/ui";
import { billiardCharge, computeTotals, type BillingConfig } from "@/lib/billing";
import { durationLabel, fmtTime, rupiah } from "@/lib/format";
import { startSession, stopSession } from "@/lib/actions/pos";

export type TableDTO = {
  id: string;
  name: string;
  rate: number;
  session: { id: string; orderId: string; startedAt: string; rate: number; customer: string; fb: number } | null;
};
export type WaitingDTO = { orderId: string; number: number; table: string; customer: string; minutes: number; total: number };

export function BilliardBoard({
  tables,
  waiting,
  cfg,
}: {
  tables: TableDTO[];
  waiting: WaitingDTO[];
  cfg: BillingConfig;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const [starting, setStarting] = useState<TableDTO | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const begin = () =>
    start(async () => {
      if (!starting) return;
      const r = await startSession(starting.id, name);
      if (!r.ok) return toast("err", r.error);
      toast("ok", `${starting.name} dimulai.`);
      setStarting(null);
      setName("");
      router.refresh();
    });

  const stop = (sessionId: string, table: string) =>
    start(async () => {
      if (!confirm(`Hentikan sesi ${table}?`)) return;
      const r = await stopSession(sessionId);
      if (!r.ok) return toast("err", r.error);
      toast("ok", `${table} dihentikan. Lanjut ke pembayaran.`);
      router.push(`/admin/kasir?order=${r.orderId}`);
    });

  return (
    <div className="space-y-8">
      {tables.length === 0 ? (
        <p className="rounded-2xl bg-white p-10 text-center text-muted">
          Belum ada meja. Owner bisa menambahkan meja di Pengaturan.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((t) => {
            const s = t.session;
            if (!s) {
              return (
                <div key={t.id} className="flex flex-col justify-between rounded-3xl bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold">{t.name}</h2>
                    <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-ok">
                      <span className="size-2 rounded-full bg-ok" /> Kosong
                    </span>
                  </div>
                  <p className="mt-6 text-sm text-muted">{rupiah(t.rate)} / jam</p>
                  <button onClick={() => setStarting(t)} className={`${btnPrimary} mt-3 w-full py-3`}>
                    <Play size={18} /> Mulai main
                  </button>
                </div>
              );
            }
            const elapsed = now - new Date(s.startedAt).getTime();
            const c = billiardCharge(s.startedAt, null, s.rate, cfg, now);
            const tot = computeTotals({
              fbSubtotal: s.fb,
              billiardTotal: c.amount,
              billiardRate: s.rate,
              discount: 0,
              cfg,
            });
            return (
              <div key={t.id} className="flex flex-col rounded-3xl bg-felt p-5 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold">{t.name}</h2>
                  <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                    <span className="live-dot size-2 rounded-full bg-pink" /> Dipakai
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-white/80">
                  {s.customer || "Tanpa nama"} · mulai {fmtTime(s.startedAt)}
                </p>
                <p className="tnum mt-4 text-5xl font-extrabold tracking-tight">{durationLabel(elapsed)}</p>
                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between text-white/85">
                    <span>Billiard ({c.minutes} mnt)</span>
                    <span className="tnum font-semibold">{rupiah(c.amount)}</span>
                  </div>
                  <div className="flex justify-between text-white/85">
                    <span>Makanan &amp; minuman</span>
                    <span className="tnum font-semibold">{rupiah(s.fb)}</span>
                  </div>
                  {tot.promoDiscount > 0 ? (
                    <div className="flex justify-between font-semibold text-pink-100">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={14} /> Gratis jam billiard
                      </span>
                      <span className="tnum">-{rupiah(tot.promoDiscount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-white/25 pt-2 text-base font-extrabold">
                    <span>Total sementara</span>
                    <span className="tnum">{rupiah(tot.total)}</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/kasir?order=${s.orderId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-3 py-3 text-sm font-bold transition hover:bg-white/25"
                  >
                    <UtensilsCrossed size={16} /> Tambah menu
                  </Link>
                  <button
                    onClick={() => stop(s.id, t.name)}
                    disabled={pending}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink px-3 py-3 text-sm font-bold transition hover:bg-pink-deep active:scale-95"
                  >
                    <Square size={15} /> Stop &amp; bayar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {waiting.length > 0 ? (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Receipt size={19} className="text-pink" /> Menunggu pembayaran
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {waiting.map((w) => (
              <li key={w.orderId}>
                <Link
                  href={`/admin/kasir?order=${w.orderId}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 transition hover:bg-petal"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold">
                      #{w.number} · {w.customer || w.table}
                    </span>
                    <span className="text-sm text-muted">
                      {w.table} · {w.minutes} menit
                    </span>
                  </span>
                  <span className="tnum font-extrabold text-pink-deep">{rupiah(w.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Modal open={!!starting} onClose={() => setStarting(null)} title={starting ? `Mulai ${starting.name}` : ""} width="max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            begin();
          }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-blush p-4">
            <CircleDot className="text-felt" />
            <p className="font-semibold">
              Tarif {starting ? rupiah(starting.rate) : ""} / jam · dibulatkan per {cfg.roundMinutes} menit
            </p>
          </div>
          <div>
            <label className={label} htmlFor="who">Nama pemain (opsional)</label>
            <input id="who" value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="Contoh: Rizky" autoFocus maxLength={60} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setStarting(null)} className={btnSoft}>Batal</button>
            <button type="submit" disabled={pending} className={btnPrimary}>Mulai sekarang</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
