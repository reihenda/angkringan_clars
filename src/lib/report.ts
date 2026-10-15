import "server-only";
import { db } from "./db";
import { addDays, dayEnd, dayStart } from "./format";

export async function buildReport(from: string, to: string) {
  const range = { gte: dayStart(from), lte: dayEnd(to) };
  const orders = await db.order.findMany({
    where: { status: "PAID", paidAt: range },
    include: {
      items: true,
      payments: true,
      cashier: { select: { name: true } },
    },
    orderBy: { paidAt: "asc" },
  });

  const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const days = new Map<string, { total: number; count: number }>();
  for (let d = from; d <= to; d = addDays(d, 1)) days.set(d, { total: 0, count: 0 });

  let total = 0;
  let billiard = 0;
  let promo = 0;
  let discount = 0;
  const methods = new Map<string, number>();
  const cashiers = new Map<string, { total: number; count: number }>();
  const items = new Map<string, { qty: number; revenue: number }>();

  for (const o of orders) {
    total += o.total;
    billiard += o.billiardTotal;
    promo += o.promoDiscount;
    discount += o.discount;
    const dk = dayKey(o.paidAt ?? o.createdAt);
    const dd = days.get(dk);
    if (dd) {
      dd.total += o.total;
      dd.count += 1;
    }
    for (const p of o.payments) methods.set(p.method, (methods.get(p.method) ?? 0) + p.amount);
    const cn = o.cashier?.name ?? "—";
    const c = cashiers.get(cn) ?? { total: 0, count: 0 };
    c.total += o.total;
    c.count += 1;
    cashiers.set(cn, c);
    for (const it of o.items) {
      const x = items.get(it.name) ?? { qty: 0, revenue: 0 };
      x.qty += it.qty;
      x.revenue += it.qty * it.price;
      items.set(it.name, x);
    }
  }

  const fb = orders.reduce((s, o) => s + o.fbSubtotal, 0);
  return {
    orders,
    count: orders.length,
    total,
    fb,
    billiard,
    promo,
    discount,
    avg: orders.length ? Math.round(total / orders.length) : 0,
    days: [...days].map(([date, v]) => ({ date, ...v })),
    methods: [...methods].map(([method, amount]) => ({ method, amount })).sort((a, b) => b.amount - a.amount),
    cashiers: [...cashiers].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total),
    items: [...items].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty),
  };
}
