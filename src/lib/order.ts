import "server-only";
import type { Prisma } from "@prisma/client";
import { billiardCharge, computeTotals } from "./billing";
import { billingFromSettings, getSettings } from "./settings";
import { db } from "./db";

export type Tx = Prisma.TransactionClient;

export async function loadBillingConfig() {
  return billingFromSettings(await getSettings());
}

export async function nextOrderNumber(tx: Tx) {
  const last = await tx.order.aggregate({ _max: { number: true } });
  return (last._max.number ?? 0) + 1;
}

/** Hitung ulang subtotal, billiard, promo, dan total sebuah order lalu simpan. */
export async function recalcOrder(
  tx: Tx,
  orderId: string,
  opts: { discount?: number } = {},
) {
  const cfg = await loadBillingConfig();
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, session: true },
  });
  const fbSubtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);

  let billiardTotal = 0;
  let rate = 0;
  if (order.session) {
    rate = order.session.rate;
    const charge = billiardCharge(
      order.session.startedAt,
      order.session.endedAt,
      rate,
      cfg,
    );
    billiardTotal = charge.amount;
    if (order.session.endedAt) {
      await tx.billiardSession.update({
        where: { id: order.session.id },
        data: { minutes: charge.minutes, amount: charge.amount },
      });
    }
  }

  const discount = opts.discount ?? order.discount;
  const { promoDiscount, total } = computeTotals({
    fbSubtotal,
    billiardTotal,
    billiardRate: rate,
    discount,
    cfg,
  });

  return tx.order.update({
    where: { id: orderId },
    data: { fbSubtotal, billiardTotal, promoDiscount, discount, total },
  });
}

/** Kurangi stok bahan sesuai resep untuk semua item pada order. */
export async function deductStock(
  tx: Tx,
  orderId: string,
  userId: string | null,
  direction: 1 | -1 = 1,
) {
  const items = await tx.orderItem.findMany({
    where: { orderId, menuItemId: { not: null } },
    include: { menuItem: { include: { recipe: true } } },
  });
  const usage = new Map<string, number>();
  for (const it of items) {
    for (const r of it.menuItem?.recipe ?? []) {
      usage.set(r.ingredientId, (usage.get(r.ingredientId) ?? 0) + r.qty * it.qty);
    }
  }
  for (const [ingredientId, qty] of usage) {
    const ing = await tx.ingredient.findUnique({ where: { id: ingredientId } });
    if (!ing) continue;
    const delta = -qty * direction;
    const balance = Math.round((ing.stock + delta) * 1000) / 1000;
    await tx.ingredient.update({ where: { id: ingredientId }, data: { stock: balance } });
    await tx.stockMovement.create({
      data: {
        ingredientId,
        type: direction === 1 ? "SALE" : "VOID",
        qty: delta,
        balance,
        refOrderId: orderId,
        userId,
        note: direction === 1 ? "Penjualan" : "Pesanan dibatalkan",
      },
    });
  }
}

export const orderInclude = {
  items: true,
  payments: true,
  session: { include: { table: true } },
  cashier: { select: { name: true } },
} satisfies Prisma.OrderInclude;

export async function getOrder(id: string) {
  return db.order.findUnique({ where: { id }, include: orderInclude });
}
