import { db } from "@/lib/db";
import { getSettings, isOpenNow } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Status publik: hanya info meja kosong/dipakai dan jam buka. Tidak ada data pelanggan.
export async function GET() {
  const [tables, settings] = await Promise.all([
    db.billiardTable.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { sessions: { where: { endedAt: null, order: { status: "OPEN" } }, select: { startedAt: true } } },
    }),
    getSettings(),
  ]);
  return Response.json(
    {
      open: isOpenNow(settings.openTime, settings.closeTime),
      openTime: settings.openTime,
      closeTime: settings.closeTime,
      tables: tables.map((t) => ({
        id: t.id,
        name: t.name,
        busy: t.sessions.length > 0,
        since: t.sessions[0]?.startedAt ?? null,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
