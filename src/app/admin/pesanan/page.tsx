import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addDays, dayEnd, dayStart, fmtDateTime, ORDER_TYPE_LABEL, PAYMENT_LABEL, rupiah, todayJakarta } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { card } from "@/components/ui";
import { buildReceipt } from "@/lib/receipt";
import { OrderRow } from "./OrderRow";

export const metadata = { title: "Riwayat Pesanan" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  PAID: { label: "Lunas", cls: "bg-green-50 text-ok" },
  OPEN: { label: "Berjalan", cls: "bg-amber-50 text-warn" },
  VOID: { label: "Batal", cls: "bg-red-50 text-red-700" },
};

export default async function PesananPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : todayJakarta();
  const status = ["PAID", "OPEN", "VOID"].includes(sp.status ?? "") ? sp.status! : undefined;

  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: dayStart(date), lte: dayEnd(date) },
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { payments: true, cashier: { select: { name: true } }, session: { include: { table: true } } },
    take: 300,
  });

  const rows = await Promise.all(
    orders.map(async (o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      time: fmtDateTime(o.createdAt),
      who: o.customerName || o.session?.table.name || "—",
      type: ORDER_TYPE_LABEL[o.type] ?? o.type,
      methods: [...new Set(o.payments.map((p) => PAYMENT_LABEL[p.method]))].join(" + "),
      total: o.total,
      receipt: await buildReceipt(o.id),
    })),
  );
  const sum = orders.filter((o) => o.status === "PAID").reduce((s, o) => s + o.total, 0);
  const q = (d: string, st?: string) => `/admin/pesanan?date=${d}${st ? `&status=${st}` : ""}`;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <PageHeader title="Riwayat pesanan" subtitle="Cetak ulang struk atau batalkan pesanan." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={q(addDays(date, -1), status)} className="rounded-xl bg-white px-3.5 py-2 text-sm font-bold hover:bg-petal">←</Link>
        <form className="contents">
          <input type="date" name="date" defaultValue={date} className="rounded-xl border border-rose/70 bg-white px-3 py-2 text-sm font-semibold" aria-label="Tanggal" />
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <button className="rounded-xl bg-pink px-4 py-2 text-sm font-bold text-white">Tampilkan</button>
        </form>
        <Link href={q(addDays(date, 1), status)} className="rounded-xl bg-white px-3.5 py-2 text-sm font-bold hover:bg-petal">→</Link>
        <div className="ml-auto flex gap-1 rounded-xl bg-white p-1">
          {[["", "Semua"], ["PAID", "Lunas"], ["OPEN", "Berjalan"], ["VOID", "Batal"]].map(([v, l]) => (
            <Link key={v} href={q(date, v || undefined)} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${(status ?? "") === v ? "bg-pink text-white" : "text-muted"}`}>
              {l}
            </Link>
          ))}
        </div>
      </div>

      <div className={`${card} mb-4 flex items-center justify-between`}>
        <span className="font-semibold text-muted">{rows.length} pesanan</span>
        <span className="text-lg font-extrabold">Lunas: <span className="tnum text-pink-deep">{rupiah(sum)}</span></span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white p-12 text-center text-muted">Tidak ada pesanan pada tanggal ini.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <OrderRow key={r.id} row={r} statusInfo={STATUS[r.status]} isOwner={user.role === "OWNER"} />
          ))}
        </ul>
      )}
    </div>
  );
}
