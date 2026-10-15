"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { SETTING_DEFAULTS } from "@/lib/settings";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const fail = (error: string) => ({ ok: false as const, error });
const refresh = () => revalidatePath("/", "layout");

async function owner() {
  const u = await getUser();
  return u && u.role === "OWNER" ? u : null;
}

// ---------- Menu ----------
const menuSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string(),
  name: z.string().trim().min(1).max(60),
  price: z.number().int().min(0).max(10_000_000),
  description: z.string().trim().max(200).optional(),
  imageUrl: z.string().trim().max(300).optional(),
  isAvailable: z.boolean(),
  isFavorite: z.boolean(),
});

export async function saveMenuItem(input: z.infer<typeof menuSchema>): Promise<Result> {
  if (!(await owner())) return fail("Hanya owner yang bisa mengubah menu.");
  const p = menuSchema.safeParse(input);
  if (!p.success) return fail("Data menu tidak valid.");
  const { id, ...d } = p.data;
  const data = { ...d, description: d.description || null, imageUrl: d.imageUrl || null };
  if (id) {
    await db.menuItem.update({ where: { id }, data });
  } else {
    const last = await db.menuItem.aggregate({
      where: { categoryId: d.categoryId },
      _max: { sortOrder: true },
    });
    await db.menuItem.create({ data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  }
  refresh();
  return { ok: true };
}

export async function toggleAvailable(id: string, isAvailable: boolean): Promise<Result> {
  const u = await getUser();
  if (!u) return fail("Sesi habis.");
  await db.menuItem.update({ where: { id }, data: { isAvailable } });
  refresh();
  return { ok: true };
}

export async function deleteMenuItem(id: string): Promise<Result<{ archived: boolean }>> {
  if (!(await owner())) return fail("Hanya owner yang bisa menghapus menu.");
  const used = await db.orderItem.count({ where: { menuItemId: id } });
  if (used > 0) {
    await db.menuItem.update({ where: { id }, data: { isAvailable: false } });
    refresh();
    return { ok: true, archived: true };
  }
  await db.menuItem.delete({ where: { id } });
  refresh();
  return { ok: true, archived: false };
}

// ---------- Pengaturan toko ----------
export async function saveSettings(values: Record<string, string>): Promise<Result> {
  if (!(await owner())) return fail("Hanya owner yang bisa mengubah pengaturan.");
  const keys = Object.keys(SETTING_DEFAULTS);
  const numeric = ["billiardRate", "minCharge", "freeHours", "roundMinutes", "roundMoney"];
  for (const k of numeric) {
    if (k in values && !(Number(values[k]) >= 0)) return fail(`Nilai ${k} tidak valid.`);
  }
  await db.$transaction(
    Object.entries(values)
      .filter(([k]) => keys.includes(k))
      .map(([key, value]) =>
        db.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } }),
      ),
  );
  refresh();
  return { ok: true };
}

// ---------- Meja billiard ----------
export async function saveTable(input: {
  id?: string;
  name: string;
  hourlyRate: number;
  active: boolean;
}): Promise<Result> {
  if (!(await owner())) return fail("Hanya owner yang bisa mengubah meja.");
  const name = input.name.trim();
  if (!name || !(input.hourlyRate >= 0)) return fail("Nama dan tarif meja wajib diisi.");
  if (input.id) {
    await db.billiardTable.update({
      where: { id: input.id },
      data: { name, hourlyRate: Math.round(input.hourlyRate), active: input.active },
    });
  } else {
    const last = await db.billiardTable.aggregate({ _max: { sortOrder: true } });
    await db.billiardTable.create({
      data: {
        name,
        hourlyRate: Math.round(input.hourlyRate),
        active: input.active,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
    });
  }
  refresh();
  return { ok: true };
}

export async function deleteTable(id: string): Promise<Result<{ archived: boolean }>> {
  if (!(await owner())) return fail("Hanya owner yang bisa menghapus meja.");
  const used = await db.billiardSession.count({ where: { tableId: id } });
  if (used > 0) {
    await db.billiardTable.update({ where: { id }, data: { active: false } });
    refresh();
    return { ok: true, archived: true };
  }
  await db.billiardTable.delete({ where: { id } });
  refresh();
  return { ok: true, archived: false };
}

// ---------- User ----------
export async function saveUser(input: {
  id?: string;
  name: string;
  username: string;
  password?: string;
  role: "OWNER" | "CASHIER";
  active: boolean;
}): Promise<Result> {
  const me = await owner();
  if (!me) return fail("Hanya owner yang bisa mengelola user.");
  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  if (!name || !/^[a-z0-9._-]{3,24}$/.test(username))
    return fail("Username 3-24 karakter (huruf kecil, angka, titik, strip).");
  if (!input.id && (!input.password || input.password.length < 6))
    return fail("Password minimal 6 karakter.");
  if (input.password && input.password.length < 6) return fail("Password minimal 6 karakter.");

  const dup = await db.user.findFirst({
    where: { username, ...(input.id ? { NOT: { id: input.id } } : {}) },
  });
  if (dup) return fail("Username sudah dipakai.");

  if (input.id) {
    const target = await db.user.findUniqueOrThrow({ where: { id: input.id } });
    const losesOwner = target.role === "OWNER" && (input.role !== "OWNER" || !input.active);
    if (losesOwner) {
      const owners = await db.user.count({ where: { role: "OWNER", active: true } });
      if (owners <= 1) return fail("Harus ada minimal satu owner aktif.");
    }
    if (target.id === me.id && !input.active) return fail("Tidak bisa menonaktifkan akun sendiri.");
    await db.user.update({
      where: { id: input.id },
      data: {
        name,
        username,
        role: input.role,
        active: input.active,
        ...(input.password ? { passwordHash: await bcrypt.hash(input.password, 10) } : {}),
      },
    });
  } else {
    await db.user.create({
      data: {
        name,
        username,
        role: input.role,
        active: input.active,
        passwordHash: await bcrypt.hash(input.password!, 10),
      },
    });
  }
  refresh();
  return { ok: true };
}

/** Ganti password akun sendiri (kasir maupun owner). */
export async function changeOwnPassword(current: string, next: string): Promise<Result> {
  const me = await getUser();
  if (!me) return fail("Sesi habis.");
  if (next.length < 6) return fail("Password baru minimal 6 karakter.");
  const u = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await bcrypt.compare(current, u.passwordHash))) return fail("Password lama salah.");
  await db.user.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: true };
}
