"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  ClipboardList,
  Minus,
  NotebookPen,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { Receipt } from "@/components/Receipt";
import { useToast } from "@/components/Toast";
import { btnGhost, btnPrimary, btnSoft, btnDanger, input, label } from "@/components/ui";
import { billiardCharge, computeTotals, type BillingConfig } from "@/lib/billing";
import { durationLabel, fmtTime, ORDER_TYPE_LABEL, price, rupiah } from "@/lib/format";
import { getReceipt, payOrder, saveOrder, voidOrder } from "@/lib/actions/pos";
import type { ReceiptData } from "@/lib/receipt";

type Menu = { id: string; name: string; price: number; categoryId: string; isAvailable: boolean; isFavorite: boolean };
type Cat = { id: string; name: string };
export type OrderDTO = {
  id: string;
  number: number;
  type: "DINE_IN" | "TAKEAWAY" | "BILLIARD";
  customerName: string;
  note: string;
  items: { menuItemId: string; name: string; price: number; qty: number; note: string }[];
  billiard: { sessionId: string; table: string; startedAt: string; endedAt: string | null; rate: number } | null;
};
type OpenOrder = { id: string; number: number; label: string; type: string; total: number; itemCount: number; createdAt: string };
type Line = { qty: number; note: string };

export function PosClient({
  categories,
  menu,
  cfg,
  payNotes,
  order,
  openOrders,
}: {
  categories: Cat[];
  menu: Menu[];
  cfg: BillingConfig;
  payNotes: { qris: string; bank: string };
  order: OrderDTO | null;
  openOrders: OpenOrder[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<Record<string, Line>>(() => {
    const c: Record<string, Line> = {};
    for (const i of order?.items ?? []) c[i.menuItemId] = { qty: i.qty, note: i.note };
    return c;
  });
  const [type, setType] = useState<"DINE_IN" | "TAKEAWAY">(order && order.type !== "BILLIARD" ? order.type : "DINE_IN");
  const [customer, setCustomer] = useState(order?.customerName ?? "");
  const [note, setNote] = useState(order?.note ?? "");
  const [drawer, setDrawer] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [wasOrder] = useState(!!order); // pesanan dibuka dari daftar/billiard (bukan keranjang baru)

  const live = !!order?.billiard && !order.billiard.endedAt;
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live]);

  const byId = useMemo(() => new Map(menu.map((m) => [m.id, m])), [menu]);
  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, l]) => ({ id, m: byId.get(id), ...l }))
        .filter((l): l is typeof l & { m: Menu } => !!l.m),
    [cart, byId],
  );
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const fb = lines.reduce((s, l) => s + l.m.price * l.qty, 0);

  const b = order?.billiard;
  const billiard = b ? billiardCharge(b.startedAt, b.endedAt, b.rate, cfg, now) : null;
  const totals = computeTotals({
    fbSubtotal: fb,
    billiardTotal: billiard?.amount ?? 0,
    billiardRate: b?.rate ?? 0,
    discount: 0,
    cfg,
  });
  const toPromo = b && !totals.qualifies ? Math.max(0, cfg.minCharge - fb) : 0;

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return menu.filter((m) => {
      if (term) return m.name.toLowerCase().includes(term);
      if (cat === "all") return true;
      if (cat === "fav") return m.isFavorite;
      return m.categoryId === cat;
    });
  }, [menu, cat, q]);

  const add = (id: string, d = 1) =>
    setCart((c) => {
      const next = { ...c };
      const qty = (next[id]?.qty ?? 0) + d;
      if (qty <= 0) delete next[id];
      else next[id] = { qty: Math.min(99, qty), note: next[id]?.note ?? "" };
      return next;
    });

  const clear = () => {
    setCart({});
    setCustomer("");
    setNote("");
    setType("DINE_IN");
    setDrawer(false);
  };

  const persist = async () => {
    const r = await saveOrder({
      orderId: order?.id,
      type,
      customerName: customer,
      note,
      items: lines.map((l) => ({ menuItemId: l.id, qty: l.qty, note: l.note })),
    });
    if (!r.ok) {
      toast("err", r.error);
      return null;
    }
    return r;
  };

  const onSave = () =>
    start(async () => {
      const r = await persist();
      if (!r) return;
      toast("ok", `Pesanan #${r.number} disimpan.`);
      if (order) router.refresh();
      else clear();
    });

  const onPay = () =>
    start(async () => {
      if (lines.length === 0 && !b) return toast("err", "Keranjang masih kosong.");
      const r = await persist();
      if (r) setPayFor(r.orderId);
    });

  const onVoid = () =>
    start(async () => {
      if (!order) return;
      if (!confirm(`Batalkan pesanan #${order.number}?`)) return;
      const r = await voidOrder(order.id);
      if (r.ok) {
        toast("ok", "Pesanan dibatalkan.");
        router.replace("/admin/kasir");
      } else toast("err", r.error);
    });

  const canPay = lines.length > 0 || !!b;

  const cartPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-petal px-4 py-3">
        <div>
          <h2 className="text-lg font-extrabold">
            {order ? `Pesanan #${order.number}` : "Pesanan baru"}
          </h2>
          {order ? <p className="text-xs font-semibold text-muted">{ORDER_TYPE_LABEL[order.type]} · sedang berjalan</p> : null}
        </div>
        <div className="flex items-center gap-1">
          {order ? (
            <button
              onClick={() => router.replace("/admin/kasir")}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-pink-deep hover:bg-petal"
            >
              + Baru
            </button>
          ) : lines.length > 0 ? (
            <button onClick={clear} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-petal" aria-label="Kosongkan">
              <Trash2 size={17} />
            </button>
          ) : null}
          <button onClick={() => setDrawer(false)} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-petal lg:hidden" aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {!b ? (
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-blush p-1">
            {(["DINE_IN", "TAKEAWAY"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                aria-pressed={type === t}
                className={`rounded-lg py-2 text-sm font-bold transition ${type === t ? "bg-white text-pink-deep shadow-sm" : "text-muted"}`}
              >
                {ORDER_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        ) : null}

        <input
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="Nama pelanggan / nomor meja"
          className={input}
          aria-label="Nama pelanggan"
          maxLength={60}
        />

        {b && billiard ? (
          <div className="rounded-2xl bg-felt p-4 text-white">
            <div className="flex items-center justify-between">
              <p className="font-bold">Billiard · {b.table}</p>
              <p className="tnum rounded-full bg-white/15 px-2.5 py-0.5 text-sm font-bold">
                {b.endedAt ? "Selesai" : durationLabel(now - new Date(b.startedAt).getTime())}
              </p>
            </div>
            <p className="mt-1 text-sm text-white/80">
              Mulai {fmtTime(b.startedAt)} · {rupiah(b.rate)}/jam · {billiard.minutes} menit tertagih
            </p>
            <p className="tnum mt-2 text-2xl font-extrabold">{rupiah(billiard.amount)}</p>
          </div>
        ) : null}

        {lines.length === 0 ? (
          <div className="rounded-2xl bg-blush px-4 py-10 text-center text-muted">
            <ShoppingBag className="mx-auto mb-2 text-rose" size={30} />
            Pilih menu di sebelah kiri.
          </div>
        ) : (
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.id} className="rounded-xl border border-petal p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold leading-snug">{l.m.name}</p>
                  <p className="tnum shrink-0 font-bold">{rupiah(l.m.price * l.qty)}</p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => add(l.id, -1)} className="grid size-9 place-items-center rounded-lg bg-petal text-pink-deep active:scale-90" aria-label={`Kurangi ${l.m.name}`}>
                      <Minus size={16} />
                    </button>
                    <span className="tnum w-9 text-center font-bold">{l.qty}</span>
                    <button onClick={() => add(l.id, 1)} className="grid size-9 place-items-center rounded-lg bg-pink text-white active:scale-90" aria-label={`Tambah ${l.m.name}`}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <label className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-blush px-2.5 text-sm">
                    <NotebookPen size={14} className="shrink-0 text-muted" />
                    <input
                      value={l.note}
                      onChange={(e) =>
                        setCart((c) => ({ ...c, [l.id]: { ...c[l.id], note: e.target.value } }))
                      }
                      placeholder="Catatan"
                      className="w-full min-w-0 bg-transparent py-2 outline-none placeholder:text-muted/60"
                      maxLength={120}
                      aria-label={`Catatan untuk ${l.m.name}`}
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}

        {b && !totals.qualifies && toPromo > 0 ? (
          <p className="flex items-start gap-2 rounded-xl bg-petal px-3 py-2.5 text-sm font-medium text-pink-deep">
            <Sparkles size={16} className="mt-0.5 shrink-0" />
            Belanja F&amp;B {rupiah(toPromo)} lagi, gratis {cfg.freeHours} jam billiard!
          </p>
        ) : null}
        {totals.promoDiscount > 0 ? (
          <p className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-semibold text-ok">
            <Check size={16} /> Min charge tercapai: gratis {cfg.freeHours} jam billiard.
          </p>
        ) : null}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Catatan pesanan (opsional)"
          rows={2}
          maxLength={200}
          className={`${input} resize-none`}
          aria-label="Catatan pesanan"
        />
      </div>

      <div className="space-y-3 border-t border-petal bg-white px-4 py-4">
        <div className="space-y-1 text-[15px]">
          {b ? (
            <>
              <div className="flex justify-between text-muted">
                <span>Makanan &amp; minuman</span>
                <span className="tnum">{rupiah(fb)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Billiard</span>
                <span className="tnum">{rupiah(billiard?.amount ?? 0)}</span>
              </div>
              {totals.promoDiscount > 0 ? (
                <div className="flex justify-between font-semibold text-ok">
                  <span>Gratis jam billiard</span>
                  <span className="tnum">-{rupiah(totals.promoDiscount)}</span>
                </div>
              ) : null}
            </>
          ) : null}
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Total</span>
            <span className="tnum text-2xl font-extrabold text-pink-deep">{rupiah(totals.total)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onSave} disabled={pending || (!canPay && !order)} className={btnSoft}>
            Simpan
          </button>
          <button onClick={onPay} disabled={pending || !canPay} className={btnPrimary}>
            Bayar
          </button>
        </div>
        {order ? (
          <button onClick={onVoid} disabled={pending} className={`${btnDanger} w-full py-2 text-sm`}>
            Batalkan pesanan
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="lg:grid lg:h-dvh lg:grid-cols-[1fr_390px]">
      <section className="flex min-w-0 flex-col p-4 sm:p-6 lg:h-dvh lg:overflow-hidden">
        <div className="mb-4 flex items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari menu…"
              className={`${input} pl-10`}
              aria-label="Cari menu"
            />
          </label>
          <button onClick={() => setListOpen(true)} className={`${btnGhost} shrink-0`}>
            <ClipboardList size={18} />
            <span className="hidden sm:inline">Pesanan aktif</span>
            {openOrders.length > 0 ? (
              <span className="grid min-w-5 place-items-center rounded-full bg-pink px-1.5 text-xs font-bold text-white">
                {openOrders.length}
              </span>
            ) : null}
          </button>
        </div>

        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {[{ id: "all", name: "Semua" }, { id: "fav", name: "Favorit" }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCat(c.id);
                setQ("");
              }}
              aria-pressed={cat === c.id && !q}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                cat === c.id && !q ? "bg-pink text-white" : "bg-white text-ink hover:bg-petal"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-28 lg:pb-4">
          {visible.length === 0 ? (
            <p className="rounded-2xl bg-white p-10 text-center text-muted">Menu tidak ditemukan.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((m) => {
                const qty = cart[m.id]?.qty ?? 0;
                return (
                  <button
                    key={m.id}
                    disabled={!m.isAvailable}
                    onClick={() => add(m.id)}
                    className={`relative flex min-h-[5.5rem] flex-col justify-between rounded-2xl p-3.5 text-left transition active:scale-[0.97] ${
                      qty > 0 ? "bg-pink text-white" : "bg-white hover:bg-petal"
                    } disabled:opacity-45`}
                  >
                    <span className="pr-6 text-[15px] font-semibold leading-snug">{m.name}</span>
                    <span className={`tnum mt-2 text-sm font-bold ${qty > 0 ? "text-white" : "text-pink-deep"}`}>
                      {m.isAvailable ? rupiah(m.price) : "Habis"}
                    </span>
                    {qty > 0 ? (
                      <span className="tnum absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full bg-white text-xs font-extrabold text-pink-deep">
                        {qty}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <aside className="hidden border-l border-petal bg-white lg:block lg:h-dvh">{cartPanel}</aside>

      {/* Mobile: bar ringkas + drawer */}
      <div className="fixed inset-x-3 bottom-[4.6rem] z-30 lg:hidden">
        <button
          onClick={() => setDrawer(true)}
          disabled={!canPay && !order}
          className="flex w-full items-center justify-between rounded-2xl bg-plum px-5 py-3.5 text-white shadow-xl disabled:opacity-60"
        >
          <span className="flex items-center gap-2 font-semibold">
            <ShoppingBag size={19} /> {itemCount} item{order ? ` · #${order.number}` : ""}
          </span>
          <span className="tnum font-extrabold">{rupiah(totals.total)}</span>
        </button>
      </div>
      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-plum/55" onClick={() => setDrawer(false)} aria-hidden />
          <div className="absolute inset-x-0 bottom-0 top-10 overflow-hidden rounded-t-3xl bg-white">{cartPanel}</div>
        </div>
      ) : null}

      <Modal open={listOpen} onClose={() => setListOpen(false)} title="Pesanan aktif">
        {openOrders.length === 0 ? (
          <p className="py-8 text-center text-muted">Tidak ada pesanan yang sedang berjalan.</p>
        ) : (
          <ul className="space-y-2">
            {openOrders.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => {
                    setListOpen(false);
                    router.replace(`/admin/kasir?order=${o.id}`);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-blush p-3.5 text-left transition hover:bg-petal"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold">
                      #{o.number} · {o.label}
                    </span>
                    <span className="text-sm text-muted">
                      {ORDER_TYPE_LABEL[o.type]} · {o.itemCount} item · {fmtTime(o.createdAt)}
                    </span>
                  </span>
                  <span className="tnum font-extrabold text-pink-deep">{rupiah(o.total)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {payFor ? (
        <PayModal
          orderId={payFor}
          fb={fb}
          billiardAmount={billiard?.amount ?? 0}
          billiardRate={b?.rate ?? 0}
          cfg={cfg}
          notes={payNotes}
          onClose={() => setPayFor(null)}
          onPaid={async (orderId) => {
            setPayFor(null);
            const data = await getReceipt(orderId);
            if (data) setReceipt(data);
            if (!wasOrder) clear();
            else if (!data) router.replace("/admin/kasir");
          }}
        />
      ) : null}

      <Modal
        open={!!receipt}
        onClose={() => {
          setReceipt(null);
          if (wasOrder) router.replace("/admin/kasir");
        }}
        title="Pembayaran berhasil"
        width="max-w-md"
      >
        {receipt ? <Receipt data={receipt} /> : null}
      </Modal>
    </div>
  );
}

type PayRow = { method: "CASH" | "QRIS" | "TRANSFER"; amount: string };

function PayModal({
  orderId,
  fb,
  billiardAmount,
  billiardRate,
  cfg,
  notes,
  onClose,
  onPaid,
}: {
  orderId: string;
  fb: number;
  billiardAmount: number;
  billiardRate: number;
  cfg: BillingConfig;
  notes: { qris: string; bank: string };
  onClose: () => void;
  onPaid: (orderId: string) => void | Promise<void>;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [discount, setDiscount] = useState("");
  const [rows, setRows] = useState<PayRow[]>([{ method: "CASH", amount: "" }]);

  const disc = Number(discount.replace(/\D/g, "")) || 0;
  const { total } = computeTotals({
    fbSubtotal: fb,
    billiardTotal: billiardAmount,
    billiardRate,
    discount: disc,
    cfg,
  });
  const num = (s: string) => Number(s.replace(/\D/g, "")) || 0;
  const paid = rows.reduce((s, r) => s + num(r.amount), 0);
  const cash = rows.filter((r) => r.method === "CASH").reduce((s, r) => s + num(r.amount), 0);
  const change = paid - total;
  const short = total - paid;
  const valid = paid >= total && change <= cash && paid > 0;

  const setRow = (i: number, patch: Partial<PayRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const fill = (i: number, amount: number) => setRow(i, { amount: String(amount) });

  const submit = () =>
    start(async () => {
      const r = await payOrder({
        orderId,
        discount: disc,
        payments: rows.filter((x) => num(x.amount) > 0).map((x) => ({ method: x.method, amount: num(x.amount) })),
      });
      if (!r.ok) return toast("err", r.error);
      toast("ok", r.change > 0 ? `Lunas. Kembalian ${rupiah(r.change)}` : "Pembayaran lunas.");
      await onPaid(r.orderId);
    });

  const cashQuick = [50000, 100000, 150000, 200000];

  return (
    <Modal open onClose={onClose} title="Pembayaran">
      <div className="space-y-5">
        <div className="rounded-2xl bg-pink p-5 text-white">
          <p className="text-sm font-semibold text-white/85">Total tagihan</p>
          <p className="tnum text-4xl font-extrabold tracking-tight">{rupiah(total)}</p>
        </div>

        <div>
          <label className={label} htmlFor="disc">Diskon (Rp)</label>
          <input
            id="disc"
            inputMode="numeric"
            value={discount ? price(disc) : ""}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="0"
            className={input}
          />
        </div>

        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="rounded-2xl border border-petal p-3.5">
              <div className="flex items-center gap-2">
                <div className="grid flex-1 grid-cols-3 gap-1 rounded-xl bg-blush p-1">
                  {(["CASH", "QRIS", "TRANSFER"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setRow(i, { method: m })}
                      aria-pressed={r.method === m}
                      className={`rounded-lg py-2 text-sm font-bold transition ${r.method === m ? "bg-white text-pink-deep shadow-sm" : "text-muted"}`}
                    >
                      {m === "CASH" ? "Tunai" : m === "QRIS" ? "QRIS" : "Transfer"}
                    </button>
                  ))}
                </div>
                {rows.length > 1 ? (
                  <button onClick={() => setRows((rs) => rs.filter((_, x) => x !== i))} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-petal" aria-label="Hapus metode">
                    <X size={18} />
                  </button>
                ) : null}
              </div>
              <input
                inputMode="numeric"
                value={r.amount ? price(num(r.amount)) : ""}
                onChange={(e) => setRow(i, { amount: e.target.value })}
                placeholder="Nominal diterima"
                className={`${input} mt-3 text-lg font-bold`}
                aria-label="Nominal diterima"
              />
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button onClick={() => fill(i, Math.max(0, short > 0 ? short + num(r.amount) : total))} className="rounded-lg bg-petal px-3 py-1.5 text-sm font-bold text-pink-deep">
                  Uang pas
                </button>
                {r.method === "CASH"
                  ? cashQuick
                      .filter((v) => v >= total / 2 || v >= 50000)
                      .map((v) => (
                        <button key={v} onClick={() => fill(i, v)} className="tnum rounded-lg bg-blush px-3 py-1.5 text-sm font-semibold">
                          {price(v)}
                        </button>
                      ))
                  : null}
              </div>
              {r.method === "QRIS" ? <p className="mt-2 text-xs text-muted">{notes.qris}</p> : null}
              {r.method === "TRANSFER" ? <p className="mt-2 text-xs text-muted">{notes.bank}</p> : null}
            </div>
          ))}
          {rows.length < 3 ? (
            <button
              onClick={() => setRows((rs) => [...rs, { method: "QRIS", amount: short > 0 ? String(short) : "" }])}
              className="text-sm font-bold text-pink-deep hover:underline"
            >
              + Bagi pembayaran (split bill)
            </button>
          ) : null}
        </div>

        <div className="rounded-xl bg-blush px-4 py-3">
          {short > 0 ? (
            <p className="flex justify-between font-semibold text-red-700">
              <span>Kurang</span>
              <span className="tnum">{rupiah(short)}</span>
            </p>
          ) : (
            <p className="flex justify-between font-bold text-ok">
              <span>Kembalian</span>
              <span className="tnum">{rupiah(Math.max(0, change))}</span>
            </p>
          )}
        </div>

        <button onClick={submit} disabled={!valid || pending} className={`${btnPrimary} w-full py-3.5 text-base`}>
          {pending ? "Memproses…" : "Selesaikan pembayaran"}
        </button>
      </div>
    </Modal>
  );
}
