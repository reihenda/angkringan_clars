import { getUser } from "@/lib/auth";
import { buildReport } from "@/lib/report";
import { fmtDateTime, ORDER_TYPE_LABEL, PAYMENT_LABEL, todayJakarta } from "@/lib/format";

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  const user = await getUser();
  if (!user || user.role !== "OWNER") return new Response("Forbidden", { status: 403 });
  const { searchParams } = new URL(req.url);
  const ok = (s: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
  const from = ok(searchParams.get("from")) ?? todayJakarta();
  const to = ok(searchParams.get("to")) ?? from;
  const r = await buildReport(from, to);

  const rows = [
    ["No", "Waktu bayar", "Tipe", "Pelanggan", "Kasir", "F&B", "Billiard", "Gratis billiard", "Diskon", "Total", "Pembayaran"].map(esc).join(","),
    ...r.orders.map((o) =>
      [
        o.number,
        fmtDateTime(o.paidAt ?? o.createdAt),
        ORDER_TYPE_LABEL[o.type] ?? o.type,
        o.customerName ?? "",
        o.cashier?.name ?? "",
        o.fbSubtotal,
        o.billiardTotal,
        o.promoDiscount,
        o.discount,
        o.total,
        o.payments.map((p) => `${PAYMENT_LABEL[p.method]} ${p.amount}`).join(" + "),
      ]
        .map(esc)
        .join(","),
    ),
  ];
  return new Response("﻿" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-clars-${from}_${to}.csv"`,
    },
  });
}
