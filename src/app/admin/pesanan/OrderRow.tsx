"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { Receipt } from "@/components/Receipt";
import { useToast } from "@/components/Toast";
import { btnDanger, btnSoft } from "@/components/ui";
import { rupiah } from "@/lib/format";
import { voidOrder } from "@/lib/actions/pos";
import type { ReceiptData } from "@/lib/receipt";

export function OrderRow({
  row,
  statusInfo,
  isOwner,
}: {
  row: { id: string; number: number; status: string; time: string; who: string; type: string; methods: string; total: number; receipt: ReceiptData | null };
  statusInfo: { label: string; cls: string };
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const cancel = () =>
    start(async () => {
      if (!confirm(`Batalkan pesanan #${row.number}? Stok akan dikembalikan.`)) return;
      const r = await voidOrder(row.id);
      if (r.ok) {
        toast("ok", "Pesanan dibatalkan.");
        setOpen(false);
        router.refresh();
      } else toast("err", r.error);
    });

  return (
    <li>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-4 text-left transition hover:bg-petal"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="font-bold">#{row.number}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusInfo.cls}`}>{statusInfo.label}</span>
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted">
            {row.who} · {row.type} · {row.time}
            {row.methods ? ` · ${row.methods}` : ""}
          </span>
        </span>
        <span className="tnum shrink-0 text-lg font-extrabold">{rupiah(row.total)}</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Pesanan #${row.number}`} width="max-w-md">
        {row.receipt ? <Receipt data={row.receipt} /> : null}
        <div className="mt-3 grid gap-2">
          {row.status === "OPEN" ? (
            <Link href={`/admin/kasir?order=${row.id}`} className={`${btnSoft} w-full`}>Buka di kasir</Link>
          ) : null}
          {row.status !== "VOID" && (isOwner || row.status === "OPEN") ? (
            <button onClick={cancel} disabled={pending} className={`${btnDanger} w-full`}>Batalkan pesanan</button>
          ) : null}
        </div>
      </Modal>
    </li>
  );
}
