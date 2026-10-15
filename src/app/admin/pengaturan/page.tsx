import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/PageHeader";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "Pengaturan" };
export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const me = await requireOwner();
  const [settings, tables, users] = await Promise.all([
    getSettings(),
    db.billiardTable.findMany({ orderBy: { sortOrder: "asc" } }),
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <PageHeader title="Pengaturan" subtitle="Info toko, aturan billiard, meja, dan akun kasir." />
      <SettingsClient
        meId={me.id}
        settings={settings}
        tables={tables.map((t) => ({ id: t.id, name: t.name, hourlyRate: t.hourlyRate, active: t.active }))}
        users={users.map((u) => ({ id: u.id, name: u.name, username: u.username, role: u.role as "OWNER" | "CASHIER", active: u.active }))}
      />
    </div>
  );
}
