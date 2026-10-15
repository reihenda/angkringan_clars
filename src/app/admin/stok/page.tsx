import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { StockClient } from "./StockClient";

export const metadata = { title: "Stok Barang" };
export const dynamic = "force-dynamic";

export default async function StokPage() {
  const user = await requireUser();
  const [ingredients, suppliers, movements, menu] = await Promise.all([
    db.ingredient.findMany({ where: { active: true }, orderBy: { name: "asc" }, include: { supplier: true } }),
    db.supplier.findMany({ orderBy: { name: "asc" } }),
    db.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 150,
      include: { ingredient: true, user: { select: { name: true } } },
    }),
    db.menuItem.findMany({
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: { recipe: true, category: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <PageHeader
        title="Stok barang"
        subtitle={user.role === "OWNER" ? "Kelola bahan, barang masuk, opname, dan resep." : "Lihat stok bahan. Perubahan stok hanya bisa dilakukan owner."}
      />
      <StockClient
        isOwner={user.role === "OWNER"}
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          unit: i.unit,
          stock: i.stock,
          minStock: i.minStock,
          cost: i.cost,
          supplierId: i.supplierId,
          supplier: i.supplier?.name ?? "",
        }))}
        suppliers={suppliers.map((s) => ({ id: s.id, name: s.name, phone: s.phone ?? "" }))}
        movements={movements.map((m) => ({
          id: m.id,
          at: m.createdAt.toISOString(),
          name: m.ingredient.name,
          unit: m.ingredient.unit,
          type: m.type,
          qty: m.qty,
          balance: m.balance,
          note: m.note ?? "",
          by: m.user?.name ?? "",
        }))}
        menu={menu.map((m) => ({
          id: m.id,
          name: m.name,
          category: m.category.name,
          recipe: m.recipe.map((r) => ({ ingredientId: r.ingredientId, qty: r.qty })),
        }))}
      />
    </div>
  );
}
