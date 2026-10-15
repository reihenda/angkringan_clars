import "server-only";
import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

const COOKIE = "clars_session";
const MAX_AGE = 60 * 60 * 12; // 12 jam (1 shift)

export type Role = "OWNER" | "CASHIER";
export type SessionUser = { id: string; name: string; username: string; role: Role };

// Kunci tanda tangan sesi. Production: pakai SESSION_SECRET; kalau belum diisi, diturunkan dari
// koneksi database (rahasia yang sudah ada), jadi tidak pernah memakai kunci bawaan yang tertulis di kode.
const secret = () => {
  const explicit = process.env.SESSION_SECRET;
  if (explicit && explicit.length >= 16 && !explicit.startsWith("ganti-dengan")) {
    return new TextEncoder().encode(explicit);
  }
  const base = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (base) {
    return new TextEncoder().encode(
      createHash("sha256").update("clars-session:" + base).digest("hex"),
    );
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET atau DATABASE_URL harus diisi.");
  }
  return new TextEncoder().encode("dev-only-secret-ganti-di-production-123456");
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Baca sesi dari cookie lalu cek ulang user di database (akun dinonaktifkan = langsung keluar). */
export async function getUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const u = await db.user.findUnique({ where: { id: String(payload.id) } });
    if (!u || !u.active) return null;
    return { id: u.id, name: u.name, username: u.username, role: u.role as Role };
  } catch {
    return null;
  }
}

export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  if (role && user.role !== role && user.role !== "OWNER") redirect("/admin");
  return user;
}

/** Khusus halaman dan aksi yang hanya boleh dibuka owner. */
export async function requireOwner(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "OWNER") redirect("/admin");
  return user;
}

export const COOKIE_NAME = COOKIE;
