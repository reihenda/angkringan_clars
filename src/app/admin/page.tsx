import Link from "next/link";
import { AlertTriangle, CircleDot, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dayEnd, dayStart, fmtTime, rupiah, todayJakarta, ORDER_TYPE_LABEL } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { card, btnPrimary } from "@/components/ui";

export const metadata = { title: "Dasbor" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const today = todayJakarta();
  const range = { gte: dayStart(today), lte: dayEnd(today) };

  const [paid, open, tables, ingredients, topItems] = await Promise.all([
    db.order.findMany({ where: { status: "PAID", paidAt: range }, select: { total: true, billiardTotal: true } }),
    db.order.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: { items: true, session: { include: { table: true } } },
    }),
    db.billiardTable.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { sessions: { where: { endedAt: null, order: { status: "OPEN" } } } },
    }),
    db.ingredient.findMany({ where: { active: true } }),
    db.orderItem.groupBy({
      by: ["name"],
      where: { order: { status: "PAID", paidAt: range } },
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 5,
    }),
  ]);

  const omzet = paid.reduce((s, o) => s + o.total, 0);
  const low = ingredients.filter((i) => i.stock <= i.minStock).sort((a, b) => a.stock / (a.minStock || 1) - b.stock / (b.minStock || 1));
  const busy = tables.filter((t) => t.sessions.length > 0).length;
  const isOwner = user.role === "OWNER";

  const stats = [
    ...(isOwner ? [{ label: "Omzet hari ini", value: rupiah(omzet), icon: TrendingUp }] : []),
    { label: "Transaksi selesai", value: String(paid.length), icon: Receipt },
    { label: "Pesanan aktif", value: String(open.length), icon: ShoppingBag },
    { label: "Meja terpakai", value: `${busy}/${tables.length}`, icon: CircleDot },
  ];

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <PageHeader
        title={`Halo, ${user.name.split(" ")[0]}!`}
        subtitle="Ringkasan hari ini."
        actions={
          <Link href="/admin/kasir" className={btnPrimary}>
            <Receipt size={18} /> Buka kasir
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={card}>
            <s.icon size={20} className="text-pink" />
            <p className="tnum mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{s.value}</p>
            <p className="text-sm font-medium text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <section className={`${card} lg:col-span-3`}>
          <h2 className="text-lg font-bold">Pesanan aktif</h2>
          {open.length === 0 ? (
            <p className="mt-4 rounded-xl bg-blush p-6 text-center text-muted">Belum ada pesanan yang berjalan.</p>
          ) : (
            <ul className="mt-3 divide-y divide-petal">
              {open.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/kasir?order=${o.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg py-3 transition hover:bg-blush"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        #{o.number} · {o.customerName || (o.session ? o.session.table.name : "Tanpa nama")}
                      </p>
                      <p className="text-sm text-muted">
                        {ORDER_TYPE_LABEL[o.type]} · {o.items.reduce((s, i) => s + i.qty, 0)} item · {fmtTime(o.createdAt)}
                      </p>
                    </div>
                    <span className="tnum shrink-0 font-bold">{rupiah(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-5 lg:col-span-2">
          <section className={card}>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              Stok menipis
              {low.length > 0 ? (
                <span className="rounded-full bg-pink px-2 py-0.5 text-xs font-bold text-white">{low.length}</span>
              ) : null}
            </h2>
            {low.length === 0 ? (
              <p className="mt-3 text-muted">Semua stok aman.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {low.slice(0, 6).map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 text-[15px]">
                    <span className="flex items-center gap-2 font-medium">
                      <AlertTriangle size={16} className={i.stock <= 0 ? "text-red-600" : "text-warn"} />
                      {i.name}
                    </span>
                    <span className="tnum font-semibold">
                      {i.stock} {i.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/stok" className="mt-4 inline-block text-sm font-semibold text-pink-deep hover:underline">
              Lihat semua stok →
            </Link>
          </section>

          <section className={card}>
            <h2 className="text-lg font-bold">Terlaris hari ini</h2>
            {topItems.length === 0 ? (
              <p className="mt-3 text-muted">Belum ada penjualan.</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {topItems.map((t, idx) => (
                  <li key={t.name} className="flex items-center justify-between gap-3 text-[15px]">
                    <span className="font-medium">
                      {idx + 1}. {t.name}
                    </span>
                    <span className="tnum font-semibold text-pink-deep">{t._sum.qty}×</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
