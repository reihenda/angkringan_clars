"use client";

import { Printer } from "lucide-react";
import type { ReceiptData } from "@/lib/receipt";
import { fmtDateTime, ORDER_TYPE_LABEL, PAYMENT_LABEL, rupiah } from "@/lib/format";
import { btnPrimary } from "./ui";

function Row({ l, r, bold }: { l: string; r: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? "font-bold" : ""}`}>
      <span>{l}</span>
      <span className="tnum">{r}</span>
    </div>
  );
}

export function Receipt({ data }: { data: ReceiptData }) {
  const dash = <div className="my-2 border-t border-dashed border-black/50" />;
  return (
    <div>
      <div id="receipt" className="mx-auto w-full max-w-[300px] bg-white p-3 font-mono text-[12px] leading-5 text-black">
        <div className="text-center">
          <p className="text-sm font-bold">{data.store.name}</p>
          <p>{data.store.address}</p>
          {data.store.instagram ? <p>@{data.store.instagram}</p> : null}
        </div>
        {dash}
        <Row l={`No. #${data.number}`} r={ORDER_TYPE_LABEL[data.type] ?? data.type} />
        <Row l="Waktu" r={fmtDateTime(data.paidAt ?? data.createdAt)} />
        {data.customer ? <Row l="Nama" r={data.customer} /> : null}
        {data.cashier ? <Row l="Kasir" r={data.cashier} /> : null}
        {dash}
        {data.items.map((i, idx) => (
          <div key={idx} className="mb-1">
            <p>{i.name}</p>
            <Row l={`  ${i.qty} x ${rupiah(i.price)}`} r={rupiah(i.qty * i.price)} />
          </div>
        ))}
        {data.billiard ? (
          <div className="mb-1">
            <p>Billiard {data.billiard.table}</p>
            <Row l={`  ${data.billiard.minutes} menit`} r={rupiah(data.billiard.amount)} />
          </div>
        ) : null}
        {dash}
        {data.billiard ? <Row l="Subtotal F&B" r={rupiah(data.fbSubtotal)} /> : null}
        {data.promoDiscount > 0 ? <Row l="Gratis jam billiard" r={`-${rupiah(data.promoDiscount)}`} /> : null}
        {data.discount > 0 ? <Row l="Diskon" r={`-${rupiah(data.discount)}`} /> : null}
        <Row l="TOTAL" r={rupiah(data.total)} bold />
        {data.payments.map((p, idx) => (
          <Row
            key={idx}
            l={PAYMENT_LABEL[p.method] ?? p.method}
            r={rupiah(p.method === "CASH" ? (p.tendered ?? p.amount) : p.amount)}
          />
        ))}
        {data.change > 0 ? <Row l="Kembalian" r={rupiah(data.change)} /> : null}
        {data.status === "VOID" ? <p className="mt-2 text-center font-bold">** DIBATALKAN **</p> : null}
        {dash}
        <p className="text-center">{data.store.footer}</p>
      </div>
      <button onClick={() => window.print()} className={`${btnPrimary} mt-4 w-full`}>
        <Printer size={18} /> Cetak struk
      </button>
    </div>
  );
}
