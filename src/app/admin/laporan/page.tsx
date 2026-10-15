import Link from "next/link";
import { Download } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { buildReport } from "@/lib/report";
import { addDays, PAYMENT_LABEL, price, rupiah, todayJakarta } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { btnPrimary, card } from "@/components/ui";

export const metadata = { title: "Laporan Penjualan" };
export const dynamic = "force-dynamic";

const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireOwner();
  const sp = await searchParams;
  const today = todayJakarta();
  let from = isDate(sp.from) ? sp.from! : today;
  let to = isDate(sp.to) ? sp.to! : from;
  if (from > to) [from, to] = [to, from];
  if (new Date(to).getTime() - new Date(from).getTime() > 366 * 86400000) from = addDays(to, -365);

  const r = await buildReport(from, to);
  const presets = [
    { l: "Hari ini", f: today, t: today },
    { l: "Kemarin", f: addDays(today, -1), t: addDays(today, -1) },
    { l: "7 hari", f: addDays(today, -6), t: today },
    { l: "30 hari", f: addDays(today, -29), t: today },
    { l: "Bulan ini", f: today.slice(0, 8) + "01", t: today },
  ];
  const max = Math.max(1, ...r.days.map((d) => d.total));
  const manyDays = r.days.length > 14;
  const methodTotal = r.methods.reduce((s, m) => s + m.amount, 0) || 1;
  const isActive = (f: string, t: string) => f === from && t === to;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <PageHeader
        title="Laporan penjualan"
        subtitle={from === to ? from : `${from} s/d ${to}`}
        actions={
          <a href={`/admin/laporan/export?from=${from}&to=${to}`} className={btnPrimary}>
            <Download size={18} /> Export CSV (Excel)
          </a>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <Link
            key={p.l}
            href={`/admin/laporan?from=${p.f}&to=${p.t}`}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${isActive(p.f, p.t) ? "bg-pink text-white" : "bg-white hover:bg-petal"}`}
          >
            {p.l}
          </Link>
        ))}
        <form className="ml-auto flex flex-wrap items-center gap-2">
          <input type="date" name="from" defaultValue={from} className="rounded-xl border border-rose/70 bg-white px-3 py-2 text-sm font-semibold" aria-label="Dari tanggal" />
          <span className="text-muted">–</span>
          <input type="date" name="to" defaultValue={to} className="rounded-xl border border-rose/70 bg-white px-3 py-2 text-sm font-semibold" aria-label="Sampai tanggal" />
          <button className="rounded-xl bg-plum px-4 py-2 text-sm font-bold text-white">Terapkan</button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Omzet", rupiah(r.total)],
          ["Transaksi", String(r.count)],
          ["Rata-rata / transaksi", rupiah(r.avg)],
          ["Pendapatan billiard", rupiah(r.billiard - r.promo)],
        ].map(([l, v]) => (
          <div key={l} className={card}>
            <p className="tnum text-xl font-extrabold tracking-tight sm:text-2xl">{v}</p>
            <p className="text-sm font-medium text-muted">{l}</p>
          </div>
        ))}
      </div>

      <section className={`${card} mt-5`}>
        <h2 className="text-lg font-bold">Omzet per hari</h2>
        {r.count === 0 ? (
          <p className="mt-4 rounded-xl bg-blush p-8 text-center text-muted">Belum ada transaksi di periode ini.</p>
        ) : (
          <div className="mt-4 flex h-52 items-end justify-center gap-1.5" role="img" aria-label="Grafik omzet per hari">
            {r.days.map((d) => (
              <div key={d.date} className="group relative flex h-full min-w-0 max-w-20 flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-md bg-pink transition group-hover:bg-pink-deep"
                  style={{ height: `${Math.max(d.total ? 3 : 0, (d.total / max) * 100)}%` }}
                />
                <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-plum px-2.5 py-1 text-xs font-semibold text-white group-hover:block">
                  {d.date.slice(5)} · {rupiah(d.total)}
                </span>
                {!manyDays ? <span className="mt-1.5 text-center text-[10px] font-semibold text-muted">{d.date.slice(8)}</span> : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className={card}>
          <h2 className="text-lg font-bold">Menu terlaris</h2>
          {r.items.length === 0 ? (
            <p className="mt-3 text-muted">Belum ada data.</p>
          ) : (
            <ol className="mt-3 space-y-2.5">
              {r.items.slice(0, 10).map((it, i) => (
                <li key={it.name} className="flex items-center justify-between gap-3 text-[15px]">
                  <span className="min-w-0 truncate font-medium">{i + 1}. {it.name}</span>
                  <span className="tnum shrink-0 text-right">
                    <b>{it.qty}×</b> <span className="text-muted">{price(it.revenue)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="space-y-5">
          <section className={card}>
            <h2 className="text-lg font-bold">Metode pembayaran</h2>
            {r.methods.length === 0 ? (
              <p className="mt-3 text-muted">Belum ada data.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {r.methods.map((m) => (
                  <li key={m.method}>
                    <div className="flex justify-between text-[15px] font-semibold">
                      <span>{PAYMENT_LABEL[m.method]}</span>
                      <span className="tnum">{rupiah(m.amount)}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-petal" aria-hidden>
                      <div className="h-full rounded-full bg-pink" style={{ width: `${(m.amount / methodTotal) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className={card}>
            <h2 className="text-lg font-bold">Per kasir</h2>
            {r.cashiers.length === 0 ? (
              <p className="mt-3 text-muted">Belum ada data.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {r.cashiers.map((c) => (
                  <li key={c.name} className="flex justify-between text-[15px]">
                    <span className="font-medium">{c.name} <span className="text-muted">({c.count} transaksi)</span></span>
                    <span className="tnum font-bold">{rupiah(c.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className={card}>
            <h2 className="text-lg font-bold">Rincian</h2>
            <dl className="mt-3 space-y-1.5 text-[15px]">
              {[
                ["Makanan & minuman", r.fb],
                ["Billiard (sebelum gratis)", r.billiard],
                ["Gratis jam billiard", -r.promo],
                ["Diskon manual", -r.discount],
              ].map(([l, v]) => (
                <div key={String(l)} className="flex justify-between">
                  <dt className="text-muted">{l}</dt>
                  <dd className="tnum font-semibold">{Number(v) < 0 ? "-" : ""}{rupiah(Math.abs(Number(v)))}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-petal pt-2 text-base font-extrabold">
                <dt>Total</dt>
                <dd className="tnum">{rupiah(r.total)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
