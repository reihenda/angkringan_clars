"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const fail = (error: string) => ({ ok: false as const, error });
const refresh = () => revalidatePath("/admin", "layout");

async function owner() {
  const u = await getUser();
  return u && u.role === "OWNER" ? u : null;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(60),
  unit: z.string().trim().min(1).max(12),
  minStock: z.number().min(0),
  cost: z.number().int().min(0),
  supplierId: z.string().nullable().optional(),
  initialStock: z.number().min(0).optional(),
});

export async function saveIngredient(input: z.infer<typeof ingredientSchema>): Promise<Result> {
  const user = await owner();
  if (!user) return fail("Hanya owner yang bisa mengubah stok.");
  const p = ingredientSchema.safeParse(input);
  if (!p.success) return fail("Data bahan tidak valid.");
  const d = p.data;
  try {
    if (d.id) {
      await db.ingredient.update({
        where: { id: d.id },
        data: {
          name: d.name,
          unit: d.unit,
          minStock: d.minStock,
          cost: d.cost,
          supplierId: d.supplierId || null,
        },
      });
    } else {
      const stock = d.initialStock ?? 0;
      const ing = await db.ingredient.create({
        data: {
          name: d.name,
          unit: d.unit,
          minStock: d.minStock,
          cost: d.cost,
          stock,
          supplierId: d.supplierId || null,
        },
      });
      if (stock > 0) {
        await db.stockMovement.create({
          data: {
            ingredientId: ing.id,
            type: "IN",
            qty: stock,
            balance: stock,
            note: "Stok awal",
            userId: user.id,
          },
        });
      }
    }
    refresh();
    return { ok: true };
  } catch {
    return fail("Gagal menyimpan bahan.");
  }
}

export async function archiveIngredient(id: string): Promise<Result> {
  if (!(await owner())) return fail("Hanya owner yang bisa mengubah stok.");
  await db.ingredient.update({ where: { id }, data: { active: false } });
  refresh();
  return { ok: true };
}

const moveSchema = z.object({
  ingredientId: z.string(),
  qty: z.number().positive(),
  note: z.string().trim().max(160).optional(),
  cost: z.number().int().min(0).optional(),
});

/** Barang masuk (pembelian). */
export async function receiveStock(input: z.infer<typeof moveSchema>): Promise<Result> {
  const user = await owner();
  if (!user) return fail("Hanya owner yang bisa mengubah stok.");
  const p = moveSchema.safeParse(input);
  if (!p.success) return fail("Jumlah harus lebih dari 0.");
  const { ingredientId, qty, note, cost } = p.data;
  await db.$transaction(async (tx) => {
    const ing = await tx.ingredient.findUniqueOrThrow({ where: { id: ingredientId } });
    const balance = round3(ing.stock + qty);
    await tx.ingredient.update({
      where: { id: ingredientId },
      data: { stock: balance, ...(cost ? { cost } : {}) },
    });
    await tx.stockMovement.create({
      data: { ingredientId, type: "IN", qty, balance, note: note || "Barang masuk", userId: user.id },
    });
  });
  refresh();
  return { ok: true };
}

/** Barang rusak/terbuang. */
export async function recordWaste(input: z.infer<typeof moveSchema>): Promise<Result> {
  const user = await owner();
  if (!user) return fail("Hanya owner yang bisa mengubah stok.");
  const p = moveSchema.safeParse(input);
  if (!p.success) return fail("Jumlah harus lebih dari 0.");
  const { ingredientId, qty, note } = p.data;
  await db.$transaction(async (tx) => {
    const ing = await tx.ingredient.findUniqueOrThrow({ where: { id: ingredientId } });
    const balance = round3(Math.max(0, ing.stock - qty));
    await tx.ingredient.update({ where: { id: ingredientId }, data: { stock: balance } });
    await tx.stockMovement.create({
      data: {
        ingredientId,
        type: "WASTE",
        qty: -qty,
        balance,
        note: note || "Rusak / terbuang",
        userId: user.id,
      },
    });
  });
  refresh();
  return { ok: true };
}

/** Stok opname: samakan stok sistem dengan hasil hitung fisik. */
export async function adjustStock(input: {
  ingredientId: string;
  actual: number;
  note?: string;
}): Promise<Result> {
  const user = await owner();
  if (!user) return fail("Hanya owner yang bisa mengubah stok.");
  if (!(input.actual >= 0)) return fail("Stok fisik tidak valid.");
  await db.$transaction(async (tx) => {
    const ing = await tx.ingredient.findUniqueOrThrow({ where: { id: input.ingredientId } });
    const diff = round3(input.actual - ing.stock);
    if (diff === 0) return;
    await tx.ingredient.update({
      where: { id: ing.id },
      data: { stock: round3(input.actual) },
    });
    await tx.stockMovement.create({
      data: {
        ingredientId: ing.id,
        type: "ADJUST",
        qty: diff,
        balance: round3(input.actual),
        note: input.note || "Stok opname",
        userId: user.id,
      },
    });
  });
  refresh();
  return { ok: true };
}

export async function saveRecipe(
  menuItemId: string,
  parts: { ingredientId: string; qty: number }[],
): Promise<Result> {
  if (!(await owner())) return fail("Hanya owner yang bisa mengubah resep.");
  const clean = parts.filter((p) => p.ingredientId && p.qty > 0);
  const unique = new Map(clean.map((p) => [p.ingredientId, p.qty]));
  await db.$transaction([
    db.recipeItem.deleteMany({ where: { menuItemId } }),
    ...[...unique].map(([ingredientId, qty]) =>
      db.recipeItem.create({ data: { menuItemId, ingredientId, qty } }),
    ),
  ]);
  refresh();
  return { ok: true };
}

export async function saveSupplier(input: {
  id?: string;
  name: string;
  phone?: string;
}): Promise<Result> {
  if (!(await owner())) return fail("Hanya owner yang bisa mengubah supplier.");
  const name = input.name.trim();
  if (!name) return fail("Nama supplier wajib diisi.");
  if (input.id) {
    await db.supplier.update({ where: { id: input.id }, data: { name, phone: input.phone || null } });
  } else {
    await db.supplier.create({ data: { name, phone: input.phone || null } });
  }
  refresh();
  return { ok: true };
}
