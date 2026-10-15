// Dipanggil saat build di Vercel: isi data awal hanya jika database masih kosong,
// supaya menu/akun yang sudah diubah owner tidak dikembalikan lagi.
import { PrismaClient } from "@prisma/client";
import { db as seedDb, seed } from "./seed";

const db = new PrismaClient();

async function run() {
  const users = await db.user.count();
  if (users > 0) {
    console.log("Database sudah berisi data, seed dilewati.");
    return;
  }
  await seed();
}

run().finally(async () => {
  await db.$disconnect();
  await seedDb.$disconnect();
});
