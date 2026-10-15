"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { deductStock, nextOrderNumber, recalcOrder } from "@/lib/order";
import { billiardCharge } from "@/lib/billing";
import { loadBillingConfig } from "@/lib/order";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const fail = (error: string) => ({ ok: false as const, error });
const refresh = () => revalidatePath("/admin", "layout");

const saveSchema = z.object({
  orderId: z.string().optional(),
  type: z.enum(["DINE_IN", "TAKEAWAY"]),
  customerName: z.string().trim().max(60).optional(),
  note: z.string().trim().max(200).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        qty: z.number().int().min(1).max(99),
        note: z.string().trim().max(120).optional(),
      }),
    )
    .max(80),
});

export async function saveOrder(
  input: z.infer<typeof saveSchema>,
): Promise<Result<{ orderId: string; number: number }>> {
  const user = await getUser();
  if (!user) return fail("Sesi habis, silakan login lagi.");
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return fail("Data pesanan tidak valid.");
  const data = parsed.data;

  try {
    const result = await db.$transaction(async (tx) => {
      const ids = [...new Set(data.items.map((i) => i.menuItemId))];
      const menu = await tx.menuItem.findMany({ where: { id: { in: ids } } });
      const byId = new Map(menu.map((m) => [m.id, m]));
      for (const it of data.items) {
        const m = byId.get(it.menuItemId);
        if (!m) throw new Error("Ada menu yang sudah tidak tersedia.");
        if (!m.isAvailable) throw new Error(`${m.name} sedang habis.`);
      }

      let orderId = data.orderId;
      let number: number;
      if (orderId) {
        const existing = await tx.order.findUnique({ where: { id: orderId } });
        if (!existing || existing.status !== "OPEN") throw new Error("Pesanan sudah ditutup.");
        number = existing.number;
        await tx.orderItem.deleteMany({ where: { orderId } });
        await tx.order.update({
          where: { id: orderId },
          data: {
            customerName: data.customerName || null,
            note: data.note || null,
            ...(existing.type !== "BILLIARD" ? { type: data.type } : {}),
          },
        });
      } else {
        if (data.items.length === 0) throw new Error("Keranjang masih kosong.");
        number = await nextOrderNumber(tx);
        const created = await tx.order.create({
          data: {
            number,
            type: data.type,
            customerName: data.customerName || null,
            note: data.note || null,
            cashierId: user.id,
          },
        });
        orderId = created.id;
      }

      if (data.items.length > 0) {
        await tx.orderItem.createMany({
          data: data.items.map((it) => {
            const m = byId.get(it.menuItemId)!;
            return {
              orderId: orderId!,
              menuItemId: m.id,
              name: m.name,
              price: m.price,
              qty: it.qty,
              note: it.note || null,
            };
          }),
        });
      }
      await recalcOrder(tx, orderId);
      return { orderId, number };
    });
    refresh();
    return { ok: true, ...result };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menyimpan pesanan.");
  }
}

const paySchema = z.object({
  orderId: z.string(),
  discount: z.number().int().min(0).max(10_000_000).default(0),
  payments: z
    .array(
      z.object({
        method: z.enum(["CASH", "QRIS", "TRANSFER"]),
        amount: z.number().int().min(1),
      }),
    )
    .min(1),
});

export async function payOrder(
  input: z.infer<typeof paySchema>,
): Promise<Result<{ orderId: string; change: number }>> {
  const user = await getUser();
  if (!user) return fail("Sesi habis, silakan login lagi.");
  const parsed = paySchema.safeParse(input);
  if (!parsed.success) return fail("Data pembayaran tidak valid.");
  const { orderId, discount, payments } = parsed.data;

  try {
    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { session: true },
      });
      if (!order || order.status !== "OPEN") throw new Error("Pesanan sudah dibayar atau dibatalkan.");

      // Sesi billiard yang masih jalan dihentikan saat dibayar.
      if (order.session && !order.session.endedAt) {
        const cfg = await loadBillingConfig();
        const now = new Date();
        const c = billiardCharge(order.session.startedAt, now, order.session.rate, cfg);
        await tx.billiardSession.update({
          where: { id: order.session.id },
          data: { endedAt: now, minutes: c.minutes, amount: c.amount },
        });
      }

      const updated = await recalcOrder(tx, orderId, { discount });
      const itemCount = await tx.orderItem.count({ where: { orderId } });
      if (updated.total <= 0 && itemCount === 0 && !order.session) {
        throw new Error("Tidak ada yang dibayar.");
      }
      if (discount > updated.fbSubtotal + updated.billiardTotal - updated.promoDiscount) {
        throw new Error("Diskon melebihi total tagihan.");
      }

      const tendered = payments.reduce((s, p) => s + p.amount, 0);
      if (tendered < updated.total) throw new Error("Uang yang diterima kurang dari total.");
      const cashTendered = payments
        .filter((p) => p.method === "CASH")
        .reduce((s, p) => s + p.amount, 0);
      const change = tendered - updated.total;
      if (change > cashTendered) throw new Error("Kembalian hanya bisa dari pembayaran tunai.");

      // Alokasikan ke tagihan: non-tunai dulu, sisanya tunai.
      let remaining = updated.total;
      const ordered = [...payments].sort(
        (a, b) => Number(a.method === "CASH") - Number(b.method === "CASH"),
      );
      for (const p of ordered) {
        const allocated = Math.min(p.amount, remaining);
        remaining -= allocated;
        if (allocated <= 0 && p.method !== "CASH") continue;
        await tx.payment.create({
          data: {
            orderId,
            method: p.method,
            amount: allocated,
            tendered: p.method === "CASH" ? p.amount : null,
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID", paidAt: new Date(), cashierId: order.cashierId ?? user.id },
      });
      await deductStock(tx, orderId, user.id, 1);
      return { orderId, change };
    });
    refresh();
    return { ok: true, ...result };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memproses pembayaran.");
  }
}

export async function voidOrder(orderId: string): Promise<Result> {
  const user = await getUser();
  if (!user) return fail("Sesi habis, silakan login lagi.");
  try {
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { session: true },
      });
      if (!order) throw new Error("Pesanan tidak ditemukan.");
      if (order.status === "VOID") throw new Error("Pesanan sudah dibatalkan.");
      if (order.status === "PAID") {
        if (user.role !== "OWNER") throw new Error("Hanya owner yang bisa membatalkan pesanan yang sudah dibayar.");
        await deductStock(tx, orderId, user.id, -1);
      }
      if (order.session && !order.session.endedAt) {
        await tx.billiardSession.update({
          where: { id: order.session.id },
          data: { endedAt: new Date() },
        });
      }
      await tx.order.update({ where: { id: orderId }, data: { status: "VOID" } });
    });
    refresh();
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal membatalkan.");
  }
}

export async function startSession(
  tableId: string,
  customerName?: string,
): Promise<Result<{ orderId: string }>> {
  const user = await getUser();
  if (!user) return fail("Sesi habis, silakan login lagi.");
  try {
    const orderId = await db.$transaction(async (tx) => {
      const table = await tx.billiardTable.findUnique({ where: { id: tableId } });
      if (!table || !table.active) throw new Error("Meja tidak tersedia.");
      const running = await tx.billiardSession.findFirst({
        where: { tableId, endedAt: null, order: { status: "OPEN" } },
      });
      if (running) throw new Error(`${table.name} sedang dipakai.`);
      const number = await nextOrderNumber(tx);
      const order = await tx.order.create({
        data: {
          number,
          type: "BILLIARD",
          customerName: customerName?.trim() || table.name,
          cashierId: user.id,
          session: { create: { tableId, rate: table.hourlyRate } },
        },
      });
      await recalcOrder(tx, order.id);
      return order.id;
    });
    refresh();
    return { ok: true, orderId };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal memulai sesi.");
  }
}

export async function stopSession(sessionId: string): Promise<Result<{ orderId: string }>> {
  const user = await getUser();
  if (!user) return fail("Sesi habis, silakan login lagi.");
  try {
    const orderId = await db.$transaction(async (tx) => {
      const s = await tx.billiardSession.findUnique({ where: { id: sessionId } });
      if (!s) throw new Error("Sesi tidak ditemukan.");
      if (s.endedAt) return s.orderId;
      await tx.billiardSession.update({ where: { id: s.id }, data: { endedAt: new Date() } });
      await recalcOrder(tx, s.orderId);
      return s.orderId;
    });
    refresh();
    return { ok: true, orderId };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Gagal menghentikan sesi.");
  }
}

export async function getReceipt(orderId: string) {
  const user = await getUser();
  if (!user) return null;
  const { buildReceipt } = await import("@/lib/receipt");
  return buildReceipt(orderId);
}
