import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { MenuAdmin } from "./MenuAdmin";

export const metadata = { title: "Kelola Menu" };
export const dynamic = "force-dynamic";

export default async function MenuAdminPage() {
  await requireOwner();
  const [categories, items] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.menuItem.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <PageHeader title="Kelola menu" subtitle="Perubahan di sini langsung tampil di kasir dan di website pelanggan." />
      <MenuAdmin
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        items={items.map((m) => ({
          id: m.id,
          categoryId: m.categoryId,
          name: m.name,
          price: m.price,
          description: m.description ?? "",
          imageUrl: m.imageUrl ?? "",
          isAvailable: m.isAvailable,
          isFavorite: m.isFavorite,
        }))}
      />
    </div>
  );
}
