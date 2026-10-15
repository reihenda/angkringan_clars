"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export type LoginState = { error?: string };

// Pembatasan percobaan login sederhana (per username, di memori proses).
const attempts = new Map<string, { n: number; until: number }>();

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!username || !password) return { error: "Isi username dan password." };

  const a = attempts.get(username);
  if (a && a.until > Date.now()) return { error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." };

  const user = await db.user.findUnique({ where: { username } });
  const ok = user && user.active && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(username, { n, until: n >= 5 ? Date.now() + 5 * 60_000 : 0 });
    return { error: "Username atau password salah." };
  }
  attempts.delete(username);
  await createSession({
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role as "OWNER" | "CASHIER",
  });
  redirect(user.role === "OWNER" ? "/admin" : "/admin/kasir");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
