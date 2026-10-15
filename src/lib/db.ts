import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Neon pooler (pgbouncer) butuh parameter pgbouncer=true agar Prisma stabil di serverless.
function runtimeUrl() {
  const url = process.env.DATABASE_URL;
  if (url && url.includes("-pooler") && !url.includes("pgbouncer=")) {
    return url + (url.includes("?") ? "&" : "?") + "pgbouncer=true";
  }
  return url;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ datasources: { db: { url: runtimeUrl() } } });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
