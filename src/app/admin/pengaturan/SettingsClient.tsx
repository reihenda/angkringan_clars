"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { btnDanger, btnPrimary, card, input, label } from "@/components/ui";
import { rupiah } from "@/lib/format";
import type { Settings } from "@/lib/settings";
import { deleteTable, saveSettings, saveTable, saveUser } from "@/lib/actions/admin";

type Table = { id?: string; name: string; hourlyRate: number; active: boolean };
type User = { id?: string; name: string; username: string; role: "OWNER" | "CASHIER"; active: boolean; password?: string };

export function SettingsClient({
  meId,
  settings,
  tables,
  users,
}: {
  meId: string;
  settings: Settings;
  tables: (Table & { id: string })[];
  users: (User & { id: string })[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [s, setS] = useState<Settings>(settings);
  const [tEdit, setTEdit] = useState<Table | null>(null);
  const [uEdit, setUEdit] = useState<User | null>(null);

  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setS((x) => ({ ...x, [k]: e.target.value }));

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast("ok", msg);
        after?.();
        router.refresh();
      } else toast("err", r.error ?? "Gagal.");
    });

  const field = (k: keyof Settings, text: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className={label} htmlFor={`s-${k}`}>{text}</label>
      <input id={`s-${k}`} value={s[k]} onChange={set(k)} className={input} {...props} />
    </div>
  );

  return (
    <div className="space-y-6">
      <form
        className={`${card} space-y-4`}
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveSettings({ ...s }), "Pengaturan disimpan.");
        }}
      >
        <h2 className="text-lg font-extrabold">Info toko &amp; website</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("storeName", "Nama usaha")}
          {field("tagline", "Tagline")}
        </div>
        {field("address", "Alamat")}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("whatsapp", "WhatsApp (format 62812…)", { inputMode: "numeric" })}
          {field("instagram", "Instagram (tanpa @)")}
          {field("openTime", "Jam buka", { type: "time" })}
          {field("closeTime", "Jam tutup", { type: "time" })}
        </div>
        {field("mapsUrl", "Link Google Maps")}
        <div>
          <label className={label} htmlFor="s-about">Cerita singkat tentang Clars</label>
          <textarea id="s-about" value={s.about} onChange={set("about")} rows={4} className={`${input} resize-y`} />
        </div>

        <h2 className="pt-3 text-lg font-extrabold">Aturan billiard &amp; pembayaran</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("minCharge", "Min charge F&B untuk gratis main (Rp)", { inputMode: "numeric" })}
          {field("freeHours", "Gratis berapa jam", { inputMode: "numeric" })}
          {field("roundMinutes", "Pembulatan durasi (menit)", { inputMode: "numeric" })}
          {field("roundMoney", "Pembulatan nominal (Rp)", { inputMode: "numeric" })}
          {field("qrisNote", "Keterangan QRIS")}
          {field("bankNote", "Rekening transfer")}
        </div>
        {field("receiptFooter", "Teks bawah struk")}
        <button disabled={pending} className={btnPrimary}>Simpan pengaturan</button>
      </form>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">Meja billiard</h2>
          <button onClick={() => setTEdit({ name: `Meja ${tables.length + 1}`, hourlyRate: Number(s.billiardRate) || 25000, active: true })} className={`${btnPrimary} px-3 py-2 text-sm`}>
            <Plus size={16} /> Meja
          </button>
        </div>
        <ul className="divide-y divide-petal">
          {tables.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold">{t.name} {!t.active ? <span className="ml-1 rounded-full bg-blush px-2 py-0.5 text-xs font-bold text-muted">Nonaktif</span> : null}</p>
                <p className="tnum text-sm text-muted">{rupiah(t.hourlyRate)} / jam</p>
              </div>
              <button onClick={() => setTEdit(t)} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-petal" aria-label={`Ubah ${t.name}`}>
                <Pencil size={17} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">Akun</h2>
          <button onClick={() => setUEdit({ name: "", username: "", role: "CASHIER", active: true, password: "" })} className={`${btnPrimary} px-3 py-2 text-sm`}>
            <Plus size={16} /> Akun
          </button>
        </div>
        <ul className="divide-y divide-petal">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {u.name} {u.id === meId ? <span className="text-xs text-muted">(Anda)</span> : null}
                </p>
                <p className="text-sm text-muted">
                  @{u.username} · {u.role === "OWNER" ? "Owner" : "Kasir"}{!u.active ? " · Nonaktif" : ""}
                </p>
              </div>
              <button onClick={() => setUEdit({ ...u, password: "" })} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-petal" aria-label={`Ubah ${u.name}`}>
                <Pencil size={17} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Modal open={!!tEdit} onClose={() => setTEdit(null)} title={tEdit?.id ? "Ubah meja" : "Meja baru"} width="max-w-md">
        {tEdit ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => saveTable(tEdit), "Meja disimpan.", () => setTEdit(null));
            }}
          >
            <div>
              <label className={label} htmlFor="t-name">Nama meja</label>
              <input id="t-name" required value={tEdit.name} onChange={(e) => setTEdit({ ...tEdit, name: e.target.value })} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="t-rate">Tarif per jam (Rp)</label>
              <input id="t-rate" required inputMode="numeric" value={tEdit.hourlyRate} onChange={(e) => setTEdit({ ...tEdit, hourlyRate: Number(e.target.value.replace(/\D/g, "")) })} className={input} />
            </div>
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" checked={tEdit.active} onChange={(e) => setTEdit({ ...tEdit, active: e.target.checked })} className="size-5 accent-pink" /> Aktif
            </label>
            <div className="flex gap-2">
              {tEdit.id ? (
                <button
                  type="button"
                  className={btnDanger}
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Hapus ${tEdit.name}?`)) return;
                    start(async () => {
                      const r = await deleteTable(tEdit.id!);
                      if (!r.ok) return toast("err", r.error);
                      toast("ok", r.archived ? "Meja punya riwayat, jadi dinonaktifkan." : "Meja dihapus.");
                      setTEdit(null);
                      router.refresh();
                    });
                  }}
                >
                  <Trash2 size={16} /> Hapus
                </button>
              ) : null}
              <button className={`${btnPrimary} flex-1`} disabled={pending}>Simpan</button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal open={!!uEdit} onClose={() => setUEdit(null)} title={uEdit?.id ? "Ubah akun" : "Akun baru"} width="max-w-md">
        {uEdit ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => saveUser({ ...uEdit, password: uEdit.password || undefined }), "Akun disimpan.", () => setUEdit(null));
            }}
          >
            <div>
              <label className={label} htmlFor="u-name">Nama</label>
              <input id="u-name" required value={uEdit.name} onChange={(e) => setUEdit({ ...uEdit, name: e.target.value })} className={input} />
            </div>
            <div>
              <label className={label} htmlFor="u-user">Username</label>
              <input id="u-user" required value={uEdit.username} onChange={(e) => setUEdit({ ...uEdit, username: e.target.value })} className={input} autoCapitalize="none" />
            </div>
            <div>
              <label className={label} htmlFor="u-pass">{uEdit.id ? "Password baru (kosongkan jika tidak diganti)" : "Password (min. 6 karakter)"}</label>
              <input id="u-pass" type="password" value={uEdit.password ?? ""} onChange={(e) => setUEdit({ ...uEdit, password: e.target.value })} className={input} autoComplete="new-password" required={!uEdit.id} />
            </div>
            <div>
              <label className={label} htmlFor="u-role">Peran</label>
              <select id="u-role" value={uEdit.role} onChange={(e) => setUEdit({ ...uEdit, role: e.target.value as User["role"] })} className={input}>
                <option value="CASHIER">Kasir</option>
                <option value="OWNER">Owner</option>
              </select>
            </div>
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" checked={uEdit.active} onChange={(e) => setUEdit({ ...uEdit, active: e.target.checked })} className="size-5 accent-pink" /> Akun aktif
            </label>
            <button className={`${btnPrimary} w-full`} disabled={pending}>Simpan</button>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
