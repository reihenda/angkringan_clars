import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { SETTING_DEFAULTS } from "../src/lib/settings";

export const db = new PrismaClient();

const MENU: Record<string, { group: string; items: [string, number, boolean?][] }> = {
  Minuman: {
    group: "MINUMAN",
    items: [
      ["Aneka Pop Ice", 7000],
      ["Aneka Nutrisari", 5000],
      ["Aneka Good Day", 7000],
      ["Susu Dancow", 9000],
      ["Milo", 7000],
      ["Tea Jus", 4000],
      ["Sisri", 4000],
      ["Es Teh Manis", 5000],
      ["Es Teh Tawar", 4000],
      ["Susu Putih", 7000],
      ["Susu Chocolate", 7000],
      ["Bengbeng", 8000],
      ["Energen", 7000],
      ["Mari Oppa", 6000],
      ["Kopi Indocafe", 7000],
      ["Kopi Item", 5000],
      ["Teh Tarik", 7000],
      ["Chocolatos", 8000],
      ["Wedang Jahe", 6000],
      ["Kukubima", 7000],
      ["Kukubima Susu", 10000],
      ["Extrajoss", 7000],
      ["Extrajoss Susu", 10000],
      ["Soda Gembira", 13000],
      ["Spesial Coffee Clars", 17000, true],
    ],
  },
  Makanan: {
    group: "MAKANAN",
    items: [
      ["Mie Goreng Telur", 12000, true],
      ["Mie Goreng Tanpa Telur", 8000],
      ["Mie Kuah Telur", 12000],
      ["Mie Kuah Tanpa Telur", 8000],
      ["Mie Tektek", 15000],
      ["Nasi Goreng Spesial", 20000, true],
      ["Nasi Bakar Tongkol", 15000],
      ["Nasi Bakar Cumi", 15000],
      ["Nasi Bakar Ayam Suwir", 15000],
      ["Nasi Kucing Teri", 4000],
      ["Nasi Kucing Tempe Orek", 4000],
      ["Nasi Kucing Kentang", 4000],
      ["Pisang Bakar Susu", 8000],
      ["Pisang Bakar Tiramisu", 10000],
      ["Pisang Bakar Chocolate", 10000, true],
      ["Pisang Bakar Strawberry", 10000],
      ["Roti Bakar Chocolate", 13000],
      ["Roti Bakar Tiramisu", 13000, true],
      ["Roti Bakar Strawberry", 13000],
      ["Bakpao Coklat Isi 3", 5000],
      ["Cireng", 10000],
      ["Nugget", 10000],
      ["Roti Maryam", 10000],
      ["Mix Platter", 15000],
    ],
  },
  "Sate-Satean": {
    group: "SATE",
    items: [
      ["Bakso", 4000],
      ["Ekor Udang", 6000],
      ["Otak Otak", 3000],
      ["Sosis Kecil", 3000],
      ["Sosis Besar", 6000],
      ["Crab Stik", 5000],
      ["Fish Roll", 5000],
      ["Odeng", 4000],
      ["Chikuwa", 5000],
      ["Dumpling", 6000],
      ["Kornet", 4000],
    ],
  },
};

const DESC: Record<string, string> = {
  "Spesial Coffee Clars": "Kopi susu signature Clars, creamy dan nggak pahit.",
  "Mix Platter": "Isi nugget, kentang, dan sosis. Pas buat bareng-bareng.",
  "Nasi Goreng Spesial": "Nasi goreng komplit dengan telur dan kerupuk.",
  "Mie Goreng Telur": "Mie goreng bumbu medok plus telur mata sapi.",
  "Pisang Bakar Chocolate": "Pisang bakar dengan cokelat leleh dan keju parut.",
  "Roti Bakar Tiramisu": "Roti bakar tebal dengan saus tiramisu.",
  "Mie Tektek": "Mie kuah ala tektek, hangat dan gurih.",
};

// [nama, satuan, stok, stok minimum, harga beli]
const INGREDIENTS: [string, string, number, number, number][] = [
  ["Mie instan", "bks", 60, 20, 3000],
  ["Telur", "butir", 90, 30, 2200],
  ["Beras", "kg", 20, 8, 14000],
  ["Kopi bubuk", "gr", 1500, 500, 140],
  ["Susu kental manis", "kaleng", 18, 6, 12000],
  ["Gula pasir", "kg", 6, 2, 16000],
  ["Teh celup", "bks", 40, 15, 1200],
  ["Pisang", "pcs", 40, 15, 1500],
  ["Roti tawar", "lembar", 80, 30, 800],
  ["Selai cokelat", "gr", 1200, 400, 40],
  ["Es batu", "kg", 15, 6, 4000],
  ["Nugget", "pcs", 80, 30, 1200],
  ["Sosis", "pcs", 100, 40, 1000],
  ["Bakso", "pcs", 120, 40, 700],
  ["Cireng", "pcs", 60, 20, 1000],
  ["Susu cair", "ml", 6000, 2000, 18],
];

// menu -> [[bahan, jumlah], ...]
const RECIPES: Record<string, [string, number][]> = {
  "Mie Goreng Telur": [["Mie instan", 1], ["Telur", 1]],
  "Mie Goreng Tanpa Telur": [["Mie instan", 1]],
  "Mie Kuah Telur": [["Mie instan", 1], ["Telur", 1]],
  "Mie Kuah Tanpa Telur": [["Mie instan", 1]],
  "Mie Tektek": [["Mie instan", 1], ["Telur", 1]],
  "Nasi Goreng Spesial": [["Beras", 0.15], ["Telur", 1]],
  "Es Teh Manis": [["Teh celup", 1], ["Gula pasir", 0.02], ["Es batu", 0.15]],
  "Es Teh Tawar": [["Teh celup", 1], ["Es batu", 0.15]],
  "Teh Tarik": [["Teh celup", 1], ["Susu kental manis", 0.1]],
  "Kopi Item": [["Kopi bubuk", 12], ["Gula pasir", 0.02]],
  "Spesial Coffee Clars": [["Kopi bubuk", 18], ["Susu cair", 120], ["Es batu", 0.15]],
  "Pisang Bakar Chocolate": [["Pisang", 2], ["Selai cokelat", 25]],
  "Roti Bakar Chocolate": [["Roti tawar", 3], ["Selai cokelat", 30]],
  "Nugget": [["Nugget", 6]],
  "Mix Platter": [["Nugget", 4], ["Sosis", 3]],
  "Cireng": [["Cireng", 8]],
  "Bakso": [["Bakso", 1]],
  "Sosis Kecil": [["Sosis", 1]],
};

const FEATURED_IMG: Record<string, string> = {
  "Spesial Coffee Clars": "/img/drinks-trio.png",
  "Mie Goreng Telur": "/img/mie-goreng-telur.jpg",
  "Nasi Goreng Spesial": "/img/nasi-goreng.jpg",
};

// Di Vercel (production) password awal diacak dan dicetak sekali di log build.
// Lokal memakai password sederhana agar mudah dicoba.
const isProd = !!process.env.VERCEL || process.env.NODE_ENV === "production";
const pw = (fallback: string) =>
  isProd ? randomBytes(9).toString("base64url") : fallback;

export async function seed() {
  // Pengaturan toko
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // Akun awal (ganti password setelah login pertama lewat Pengaturan)
  const users = [
    { name: "Owner Clars", username: "owner", password: pw("owner123"), role: "OWNER" },
    { name: "Kasir 1", username: "kasir", password: pw("kasir123"), role: "CASHIER" },
  ];
  for (const u of users) {
    if (isProd) console.log(`AKUN AWAL -> username: ${u.username} | password: ${u.password}`);
    await db.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        name: u.name,
        username: u.username,
        role: u.role,
        passwordHash: await bcrypt.hash(u.password, 10),
      },
    });
  }

  // Kategori + menu
  let catOrder = 0;
  for (const [name, def] of Object.entries(MENU)) {
    const slug = name.toLowerCase().replace(/[^a-z]+/g, "-");
    const cat = await db.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, group: def.group, sortOrder: catOrder++ },
    });
    let i = 0;
    for (const [itemName, itemPrice, fav] of def.items) {
      const exists = await db.menuItem.findFirst({ where: { name: itemName, categoryId: cat.id } });
      if (exists) continue;
      await db.menuItem.create({
        data: {
          categoryId: cat.id,
          name: itemName,
          price: itemPrice,
          isFavorite: !!fav,
          description: DESC[itemName] ?? null,
          imageUrl: FEATURED_IMG[itemName] ?? null,
          sortOrder: i++,
        },
      });
    }
  }

  // Supplier + bahan baku
  const supplier = (await db.supplier.findFirst()) ??
    (await db.supplier.create({ data: { name: "Pasar / Supplier Langganan", phone: "" } }));
  for (const [name, unit, stock, minStock, cost] of INGREDIENTS) {
    const exists = await db.ingredient.findFirst({ where: { name } });
    if (exists) continue;
    const ing = await db.ingredient.create({
      data: { name, unit, stock, minStock, cost, supplierId: supplier.id },
    });
    await db.stockMovement.create({
      data: { ingredientId: ing.id, type: "IN", qty: stock, balance: stock, note: "Stok awal" },
    });
  }

  // Resep
  for (const [menuName, parts] of Object.entries(RECIPES)) {
    const menu = await db.menuItem.findFirst({ where: { name: menuName } });
    if (!menu) continue;
    for (const [ingName, qty] of parts) {
      const ing = await db.ingredient.findFirst({ where: { name: ingName } });
      if (!ing) continue;
      await db.recipeItem.upsert({
        where: { menuItemId_ingredientId: { menuItemId: menu.id, ingredientId: ing.id } },
        update: {},
        create: { menuItemId: menu.id, ingredientId: ing.id, qty },
      });
    }
  }

  // Meja billiard
  if ((await db.billiardTable.count()) === 0) {
    for (let n = 1; n <= 3; n++) {
      await db.billiardTable.create({
        data: { name: `Meja ${n}`, hourlyRate: 25000, sortOrder: n },
      });
    }
  }

  console.log("Seed selesai.");
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seed().finally(() => db.$disconnect());
}
