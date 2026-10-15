import "server-only";
import { db } from "./db";
import { billingFromSettings, getSettings } from "./settings";

export async function getMenuBoard() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    group: c.group,
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      description: i.description,
      imageUrl: i.imageUrl,
      isAvailable: i.isAvailable,
      isFavorite: i.isFavorite,
    })),
  }));
}

export async function getFavorites() {
  return db.menuItem.findMany({
    where: { isFavorite: true, isAvailable: true },
    orderBy: { sortOrder: "asc" },
    include: { category: true },
  });
}

export async function getSiteContext() {
  const settings = await getSettings();
  const tables = await db.billiardTable.count({ where: { active: true } });
  return { settings, tables, cfg: billingFromSettings(settings) };
}

export const waLink = (number: string, text = "Halo Clars, saya mau tanya.") =>
  `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
