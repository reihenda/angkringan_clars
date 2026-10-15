"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, ArrowDownToLine, ClipboardCheck, Pencil, Plus, Search, Trash2, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { btnDanger, btnGhost, btnPrimary, btnSoft, card, input, label } from "@/components/ui";
import { fmtDateTime, rupiah } from "@/lib/format";
import {
  adjustStock,
  archiveIngredient,
  receiveStock,
  recordWaste,
  saveIngredient,
  saveRecipe,
  saveSupplier,
} from "@/lib/actions/stock";

type Ing = { id: string; name: string; unit: string; stock: number; minStock: number; cost: number; supplierId: string | null; supplier: string };
type Sup = { id: string; name: string; phone: string };
type Mov = { id: string; at: string; name: string; unit: string; type: string; qty: number; balance: number; note: string; by: string };
type MenuRow = { id: string; name: string; category: string; recipe: { ingredientId: string; qty: number }[] };

const MOVE_LABEL: Record<string, { l: string; c: string }> = {
  IN: { l: "Masuk", c: "bg-green-50 text-ok" },
  SALE: { l: "Terjual", c: "bg-petal text-pink-deep" },
  ADJUST: { l: "Opname", c: "bg-blue-50 text-blue-700" },
  WASTE: { l: "Terbuang", c: "bg-red-50 text-red-700" },
  VOID: { l: "Batal", c: "bg-amber-50 text-warn" },
};

const num = (s: string) => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n: number) => (Math.round(n * 100) / 100).toLocaleString("id-ID");

export function StockClient({
  isOwner,
  ingredients,
  suppliers,
  movements,
  menu,
}: {
  isOwner: boolean;
  ingredients: Ing[];
  suppliers: Sup[];
  movements: Mov[];
  menu: MenuRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<"stok" | "riwayat" | "resep" | "supplier">("stok");
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [edit, setEdit] = useState<Partial<Ing> | null>(null);
  const [initial, setInitial] = useState("");
  const [action, setAction] = useState<{ kind: "in" | "opname" | "waste"; ing: Ing } | null>(null);
  const [amount, setAmount] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [recipeFor, setRecipeFor] = useState<MenuRow | null>(null);
  const [parts, setParts] = useState<{ ingredientId: string; qty: string }[]>([]);
  const [supEdit, setSupEdit] = useState<Partial<Sup> | null>(null);
  const [rq, setRq] = useState("");

  const low = (i: Ing) => i.stock <= i.minStock;
  const list = useMemo(
    () =>
      ingredients.filter(
        (i) => (!onlyLow || low(i)) && i.name.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [ingredients, q, onlyLow],
  );
  const lowCount = ingredients.filter(low).length;
  const stockValue = ingredients.reduce((s, i) => s + i.stock * i.cost, 0);
  const byId = new Map(ingredients.map((i) => [i.id, i]));

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string, done: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast("ok", okMsg);
        done();
        router.refresh();
      } else toast("err", r.error ?? "Gagal.");
    });

  const openAction = (kind: "in" | "opname" | "waste", ing: Ing) => {
    setAction({ kind, ing });
    setAmount(kind === "opname" ? String(ing.stock) : "");
    setCost("");
    setNote("");
  };

  const tabs: [typeof tab, string][] = [
    ["stok", "Stok bahan"],
    ["riwayat", "Riwayat"],
    ["resep", "Resep menu"],
    ["supplier", "Supplier"],
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className={card}>
          <p className="tnum text-2xl font-extrabold">{ingredients.length}</p>
          <p className="text-sm font-medium text-muted">Jenis bahan</p>
        </div>
        <div className={card}>
          <p className={`tnum text-2xl font-extrabold ${lowCount ? "text-pink-deep" : ""}`}>{lowCount}</p>
          <p className="text-sm font-medium text-muted">Stok menipis / habis</p>
        </div>
        <div className={`${card} col-span-2 sm:col-span-1`}>
          <p className="tnum text-2xl font-extrabold">{isOwner ? rupiah(stockValue) : "—"}</p>
          <p className="text-sm font-medium text-muted">Nilai stok</p>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 [scrollbar-width:none]">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            aria-pressed={tab === k}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${tab === k ? "bg-pink text-white" : "text-muted hover:bg-petal"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "stok" ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-48 flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari bahan…" className={`${input} pl-10`} aria-label="Cari bahan" />
            </label>
            <button onClick={() => setOnlyLow((v) => !v)} aria-pressed={onlyLow} className={`${onlyLow ? btnPrimary : btnGhost}`}>
              <AlertTriangle size={17} /> Menipis
            </button>
            {isOwner ? (
              <button
                onClick={() => {
                  setEdit({ unit: "pcs", minStock: 0, cost: 0 });
                  setInitial("");
                }}
                className={btnPrimary}
              >
                <Plus size={18} /> Bahan baru
              </button>
            ) : null}
          </div>

          <ul className="space-y-2">
            {list.map((i) => {
              const pct = i.minStock > 0 ? Math.min(100, (i.stock / (i.minStock * 3)) * 100) : 100;
              const empty = i.stock <= 0;
              return (
                <li key={i.id} className="rounded-2xl bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-bold">
                        {i.name}
                        {empty ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">Habis</span>
                        ) : low(i) ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-warn">
                            <TriangleAlert size={12} /> Menipis
                          </span>
                        ) : null}
                      </p>
                      <p className="text-sm text-muted">
                        Min. {fmt(i.minStock)} {i.unit}
                        {i.supplier ? ` · ${i.supplier}` : ""}
                        {isOwner ? ` · beli ${rupiah(i.cost)}/${i.unit}` : ""}
                      </p>
                    </div>
                    <p className="tnum text-right text-2xl font-extrabold">
                      {fmt(i.stock)} <span className="text-base font-semibold text-muted">{i.unit}</span>
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-petal" aria-hidden>
                    <div className={`h-full rounded-full ${empty ? "bg-red-600" : low(i) ? "bg-warn" : "bg-ok"}`} style={{ width: `${Math.max(3, pct)}%` }} />
                  </div>
                  {isOwner ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => openAction("in", i)} className={`${btnSoft} px-3 py-2 text-sm`}>
                        <ArrowDownToLine size={16} /> Barang masuk
                      </button>
                      <button onClick={() => openAction("opname", i)} className={`${btnGhost} px-3 py-2 text-sm`}>
                        <ClipboardCheck size={16} /> Opname
                      </button>
                      <button onClick={() => openAction("waste", i)} className={`${btnGhost} px-3 py-2 text-sm`}>
                        Terbuang
                      </button>
                      <button onClick={() => { setEdit(i); setInitial(""); }} className={`${btnGhost} px-3 py-2 text-sm`} aria-label={`Ubah ${i.name}`}>
                        <Pencil size={16} />
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
            {list.length === 0 ? <li className="rounded-2xl bg-white p-10 text-center text-muted">Tidak ada bahan yang cocok.</li> : null}
          </ul>
        </>
      ) : null}

      {tab === "riwayat" ? (
        <ul className="space-y-2">
          {movements.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {m.name}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${MOVE_LABEL[m.type]?.c}`}>{MOVE_LABEL[m.type]?.l}</span>
                </p>
                <p className="truncate text-sm text-muted">
                  {fmtDateTime(m.at)}{m.by ? ` · ${m.by}` : ""}{m.note ? ` · ${m.note}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`tnum font-extrabold ${m.qty >= 0 ? "text-ok" : "text-red-700"}`}>
                  {m.qty >= 0 ? "+" : ""}{fmt(m.qty)} {m.unit}
                </p>
                <p className="tnum text-xs text-muted">sisa {fmt(m.balance)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "resep" ? (
        <>
          <p className="rounded-xl bg-petal px-4 py-3 text-sm font-medium text-pink-deep">
            Atur bahan yang terpakai per porsi. Saat menu terjual, stok bahan berkurang otomatis. Menu tanpa resep tidak memotong stok.
          </p>
          <label className="relative block">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={rq} onChange={(e) => setRq(e.target.value)} placeholder="Cari menu…" className={`${input} pl-10`} aria-label="Cari menu" />
          </label>
          <ul className="grid gap-2 sm:grid-cols-2">
            {menu
              .filter((m) => m.name.toLowerCase().includes(rq.trim().toLowerCase()))
              .map((m) => (
                <li key={m.id}>
                  <button
                    disabled={!isOwner}
                    onClick={() => {
                      setRecipeFor(m);
                      setParts(m.recipe.map((r) => ({ ingredientId: r.ingredientId, qty: String(r.qty) })));
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-4 text-left transition enabled:hover:bg-petal"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{m.name}</span>
                      <span className="text-sm text-muted">{m.category}</span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${m.recipe.length ? "bg-green-50 text-ok" : "bg-blush text-muted"}`}>
                      {m.recipe.length ? `${m.recipe.length} bahan` : "Belum ada"}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </>
      ) : null}

      {tab === "supplier" ? (
        <>
          {isOwner ? (
            <button onClick={() => setSupEdit({})} className={btnPrimary}>
              <Plus size={18} /> Supplier baru
            </button>
          ) : null}
          <ul className="grid gap-2 sm:grid-cols-2">
            {suppliers.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
                <div className="min-w-0">
                  <p className="truncate font-bold">{s.name}</p>
                  <p className="text-sm text-muted">{s.phone || "Belum ada kontak"}</p>
                </div>
                {isOwner ? (
                  <button onClick={() => setSupEdit(s)} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-petal" aria-label={`Ubah ${s.name}`}>
                    <Pencil size={17} />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {/* Bahan baru / ubah */}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Ubah bahan" : "Bahan baru"}>
        {edit ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () =>
                  saveIngredient({
                    id: edit.id,
                    name: edit.name ?? "",
                    unit: edit.unit ?? "pcs",
                    minStock: Number(edit.minStock ?? 0),
                    cost: Math.round(Number(edit.cost ?? 0)),
                    supplierId: edit.supplierId ?? null,
                    initialStock: edit.id ? undefined : num(initial),
                  }),
                "Bahan disimpan.",
                () => setEdit(null),
              );
            }}
          >
            <div>
              <label className={label} htmlFor="ing-name">Nama bahan</label>
              <input id="ing-name" required value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={input} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="ing-unit">Satuan</label>
                <input id="ing-unit" required value={edit.unit ?? ""} onChange={(e) => setEdit({ ...edit, unit: e.target.value })} className={input} placeholder="kg, pcs, gr…" />
              </div>
              <div>
                <label className={label} htmlFor="ing-min">Stok minimum</label>
                <input id="ing-min" inputMode="decimal" value={edit.minStock ?? 0} onChange={(e) => setEdit({ ...edit, minStock: num(e.target.value) })} className={input} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="ing-cost">Harga beli / satuan</label>
                <input id="ing-cost" inputMode="numeric" value={edit.cost ?? 0} onChange={(e) => setEdit({ ...edit, cost: num(e.target.value) })} className={input} />
              </div>
              {!edit.id ? (
                <div>
                  <label className={label} htmlFor="ing-init">Stok awal</label>
                  <input id="ing-init" inputMode="decimal" value={initial} onChange={(e) => setInitial(e.target.value)} className={input} placeholder="0" />
                </div>
              ) : null}
            </div>
            <div>
              <label className={label} htmlFor="ing-sup">Supplier</label>
              <select id="ing-sup" value={edit.supplierId ?? ""} onChange={(e) => setEdit({ ...edit, supplierId: e.target.value || null })} className={input}>
                <option value="">— Tanpa supplier —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              {edit.id ? (
                <button
                  type="button"
                  className={btnDanger}
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Arsipkan ${edit.name}? Riwayat tetap tersimpan.`))
                      run(() => archiveIngredient(edit.id!), "Bahan diarsipkan.", () => setEdit(null));
                  }}
                >
                  <Trash2 size={16} /> Arsipkan
                </button>
              ) : null}
              <button type="submit" disabled={pending} className={`${btnPrimary} flex-1`}>Simpan</button>
            </div>
          </form>
        ) : null}
      </Modal>

      {/* Masuk / opname / terbuang */}
      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action ? `${action.kind === "in" ? "Barang masuk" : action.kind === "opname" ? "Stok opname" : "Barang terbuang"} · ${action.ing.name}` : ""}
        width="max-w-md"
      >
        {action ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const v = num(amount);
              const id = action.ing.id;
              if (action.kind === "in")
                run(() => receiveStock({ ingredientId: id, qty: v, note, cost: cost ? Math.round(num(cost)) : undefined }), "Stok bertambah.", () => setAction(null));
              else if (action.kind === "waste")
                run(() => recordWaste({ ingredientId: id, qty: v, note }), "Tercatat.", () => setAction(null));
              else run(() => adjustStock({ ingredientId: id, actual: v, note }), "Stok disesuaikan.", () => setAction(null));
            }}
          >
            <p className="rounded-xl bg-blush px-4 py-3 text-sm">
              Stok sistem saat ini: <b className="tnum">{fmt(action.ing.stock)} {action.ing.unit}</b>
            </p>
            <div>
              <label className={label} htmlFor="amt">
                {action.kind === "opname" ? `Stok fisik sebenarnya (${action.ing.unit})` : `Jumlah (${action.ing.unit})`}
              </label>
              <input id="amt" required autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${input} text-lg font-bold`} />
            </div>
            {action.kind === "in" ? (
              <div>
                <label className={label} htmlFor="cst">Harga beli baru per {action.ing.unit} (opsional)</label>
                <input id="cst" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} className={input} placeholder={String(action.ing.cost)} />
              </div>
            ) : null}
            <div>
              <label className={label} htmlFor="nt">Catatan (opsional)</label>
              <input id="nt" value={note} onChange={(e) => setNote(e.target.value)} className={input} maxLength={160} />
            </div>
            <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>Simpan</button>
          </form>
        ) : null}
      </Modal>

      {/* Resep */}
      <Modal open={!!recipeFor} onClose={() => setRecipeFor(null)} title={recipeFor ? `Resep · ${recipeFor.name}` : ""}>
        {recipeFor ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Bahan yang terpakai untuk 1 porsi.</p>
            {parts.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={p.ingredientId}
                  onChange={(e) => setParts((ps) => ps.map((x, i) => (i === idx ? { ...x, ingredientId: e.target.value } : x)))}
                  className={`${input} min-w-0 flex-1`}
                  aria-label="Bahan"
                >
                  <option value="">Pilih bahan…</option>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
                <input
                  inputMode="decimal"
                  value={p.qty}
                  onChange={(e) => setParts((ps) => ps.map((x, i) => (i === idx ? { ...x, qty: e.target.value } : x)))}
                  className={`${input} w-24`}
                  aria-label="Jumlah"
                />
                <span className="w-12 text-sm text-muted">{byId.get(p.ingredientId)?.unit}</span>
                <button onClick={() => setParts((ps) => ps.filter((_, i) => i !== idx))} className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-petal" aria-label="Hapus bahan">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button onClick={() => setParts((ps) => [...ps, { ingredientId: "", qty: "1" }])} className="text-sm font-bold text-pink-deep hover:underline">
              + Tambah bahan
            </button>
            <button
              disabled={pending}
              className={`${btnPrimary} w-full`}
              onClick={() =>
                run(
                  () => saveRecipe(recipeFor.id, parts.map((p) => ({ ingredientId: p.ingredientId, qty: num(p.qty) }))),
                  "Resep disimpan.",
                  () => setRecipeFor(null),
                )
              }
            >
              Simpan resep
            </button>
          </div>
        ) : null}
      </Modal>

      {/* Supplier */}
      <Modal open={!!supEdit} onClose={() => setSupEdit(null)} title={supEdit?.id ? "Ubah supplier" : "Supplier baru"} width="max-w-md">
        {supEdit ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => saveSupplier({ id: supEdit.id, name: supEdit.name ?? "", phone: supEdit.phone }), "Supplier disimpan.", () => setSupEdit(null));
            }}
          >
            <div>
              <label className={label} htmlFor="s-name">Nama</label>
              <input id="s-name" required value={supEdit.name ?? ""} onChange={(e) => setSupEdit({ ...supEdit, name: e.target.value })} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="s-ph">No. telepon / WhatsApp</label>
              <input id="s-ph" value={supEdit.phone ?? ""} onChange={(e) => setSupEdit({ ...supEdit, phone: e.target.value })} className={input} />
            </div>
            <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>Simpan</button>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
