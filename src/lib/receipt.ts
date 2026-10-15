import "server-only";
import { db } from "./db";
import { getSettings } from "./settings";

export type ReceiptData = {
  number: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  cashier: string | null;
  customer: string | null;
  type: string;
  items: { name: string; qty: number; price: number }[];
  billiard: { table: string; minutes: number; amount: number; startedAt: string; endedAt: string | null } | null;
  fbSubtotal: number;
  billiardTotal: number;
  promoDiscount: number;
  discount: number;
  total: number;
  payments: { method: string; amount: number; tendered: number | null }[];
  change: number;
  store: { name: string; address: string; footer: string; instagram: string };
};

export async function buildReceipt(orderId: string): Promise<ReceiptData | null> {
  const [o, s] = await Promise.all([
    db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
        cashier: { select: { name: true } },
        session: { include: { table: true } },
      },
    }),
    getSettings(),
  ]);
  if (!o) return null;
  const tendered = o.payments.reduce((sum, p) => sum + (p.tendered ?? p.amount), 0);
  return {
    number: o.number,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt?.toISOString() ?? null,
    cashier: o.cashier?.name ?? null,
    customer: o.customerName,
    type: o.type,
    items: o.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
    billiard: o.session
      ? {
          table: o.session.table.name,
          minutes: o.session.minutes,
          amount: o.billiardTotal,
          startedAt: o.session.startedAt.toISOString(),
          endedAt: o.session.endedAt?.toISOString() ?? null,
        }
      : null,
    fbSubtotal: o.fbSubtotal,
    billiardTotal: o.billiardTotal,
    promoDiscount: o.promoDiscount,
    discount: o.discount,
    total: o.total,
    payments: o.payments.map((p) => ({ method: p.method, amount: p.amount, tendered: p.tendered })),
    change: Math.max(0, tendered - o.total),
    store: { name: s.storeName, address: s.address, footer: s.receiptFooter, instagram: s.instagram },
  };
}
