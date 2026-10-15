"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Heart, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { btnDanger, btnPrimary, card, input, label } from "@/components/ui";
import { rupiah } from "@/lib/format";
import { deleteMenuItem, saveMenuItem, toggleAvailable } from "@/lib/actions/admin";

type Item = {
  id?: string;
  categoryId: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
  isFavorite: boolean;
};

export function MenuAdmin({ categories, items }: { categories: { id: string; name: string }[]; items: (Item & { id: string })[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Item | null>(null);

  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase())),
    [items, q],
  );

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast("ok", msg);
        after?.();
        router.refresh();
      } else toast("err", r.error ?? "Gagal.");
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <label className="relative min-w-48 flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari menu…" className={`${input} pl-10`} aria-label="Cari menu" />
        </label>
        <button
          onClick={() =>
            setEdit({ categoryId: categories[0]?.id ?? "", name: "", price: 0, description: "", imageUrl: "", isAvailable: true, isFavorite: false })
          }
          className={btnPrimary}
        >
          <Plus size={18} /> Menu baru
        </button>
      </div>

      {categories.map((c) => {
        const list = filtered.filter((i) => i.categoryId === c.id);
        if (list.length === 0) return null;
        return (
          <section key={c.id} className={card}>
            <h2 className="mb-2 text-lg font-extrabold">
              {c.name} <span className="text-sm font-semibold text-muted">({list.length})</span>
            </h2>
            <ul className="divide-y divide-petal">
              {list.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className={`flex items-center gap-1.5 truncate font-semibold ${i.isAvailable ? "" : "text-muted line-through"}`}>
                      {i.name}
                      {i.isFavorite ? <Heart size={14} className="shrink-0 fill-pink text-pink" aria-label="Favorit" /> : null}
                    </p>
                    <p className="tnum text-sm font-bold text-pink-deep">{rupiah(i.price)}</p>
                  </div>
                  <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-semibold text-muted">
                    <span className="hidden sm:inline">{i.isAvailable ? "Tersedia" : "Habis"}</span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={i.isAvailable}
                      disabled={pending}
                      onChange={(e) => run(() => toggleAvailable(i.id, e.target.checked), e.target.checked ? "Menu tersedia." : "Menu ditandai habis.")}
                      className="h-6 w-11 cursor-pointer appearance-none rounded-full bg-rose/70 transition checked:bg-ok relative before:absolute before:left-0.5 before:top-0.5 before:size-5 before:rounded-full before:bg-white before:transition checked:before:translate-x-5"
                    />
                  </label>
                  <button onClick={() => setEdit(i)} className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-petal" aria-label={`Ubah ${i.name}`}>
                    <Pencil size={17} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Ubah menu" : "Menu baru"}>
        {edit ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => saveMenuItem({ ...edit, price: Math.round(Number(edit.price)) }), "Menu disimpan.", () => setEdit(null));
            }}
          >
            <div>
              <label className={label} htmlFor="m-name">Nama menu</label>
              <input id="m-name" required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={input} maxLength={60} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="m-price">Harga (Rp)</label>
                <input id="m-price" required inputMode="numeric" value={edit.price} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value.replace(/\D/g, "")) })} className={input} />
              </div>
              <div>
                <label className={label} htmlFor="m-cat">Kategori</label>
                <select id="m-cat" value={edit.categoryId} onChange={(e) => setEdit({ ...edit, categoryId: e.target.value })} className={input}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={label} htmlFor="m-desc">Deskripsi singkat (tampil di website)</label>
              <input id="m-desc" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className={input} maxLength={200} />
            </div>
            <div>
              <label className={label} htmlFor="m-img">Alamat foto (opsional)</label>
              <input id="m-img" value={edit.imageUrl} onChange={(e) => setEdit({ ...edit, imageUrl: e.target.value })} className={input} placeholder="/img/nama-foto.png" />
            </div>
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" checked={edit.isAvailable} onChange={(e) => setEdit({ ...edit, isAvailable: e.target.checked })} className="size-5 accent-pink" /> Tersedia
              </label>
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" checked={edit.isFavorite} onChange={(e) => setEdit({ ...edit, isFavorite: e.target.checked })} className="size-5 accent-pink" /> Menu favorit
              </label>
            </div>
            <div className="flex gap-2">
              {edit.id ? (
                <button
                  type="button"
                  disabled={pending}
                  className={btnDanger}
                  onClick={() => {
                    if (!confirm(`Hapus ${edit.name}?`)) return;
                    start(async () => {
                      const r = await deleteMenuItem(edit.id!);
                      if (!r.ok) return toast("err", r.error);
                      toast("ok", r.archived ? "Menu sudah pernah terjual, jadi ditandai habis (riwayat tetap aman)." : "Menu dihapus.");
                      setEdit(null);
                      router.refresh();
                    });
                  }}
                >
                  <Trash2 size={16} /> Hapus
                </button>
              ) : null}
              <button type="submit" disabled={pending} className={`${btnPrimary} flex-1`}>Simpan</button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
