import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { billingFromSettings, getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/PageHeader";
import { BilliardBoard, type TableDTO, type WaitingDTO } from "./BilliardBoard";

export const metadata = { title: "Billiard" };
export const dynamic = "force-dynamic";

export default async function BilliardPage() {
  await requireUser();
  const [tables, waiting, settings] = await Promise.all([
    db.billiardTable.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        sessions: {
          where: { endedAt: null, order: { status: "OPEN" } },
          include: { order: { include: { items: true } } },
        },
      },
    }),
    db.billiardSession.findMany({
      where: { endedAt: { not: null }, order: { status: "OPEN" } },
      include: { table: true, order: true },
      orderBy: { endedAt: "desc" },
    }),
    getSettings(),
  ]);

  const tableDTO: TableDTO[] = tables.map((t) => {
    const s = t.sessions[0];
    return {
      id: t.id,
      name: t.name,
      rate: t.hourlyRate,
      session: s
        ? {
            id: s.id,
            orderId: s.orderId,
            startedAt: s.startedAt.toISOString(),
            rate: s.rate,
            customer: s.order.customerName ?? "",
            fb: s.order.items.reduce((sum, i) => sum + i.price * i.qty, 0),
          }
        : null,
    };
  });
  const waitingDTO: WaitingDTO[] = waiting.map((w) => ({
    orderId: w.orderId,
    number: w.order.number,
    table: w.table.name,
    customer: w.order.customerName ?? "",
    minutes: w.minutes,
    total: w.order.total,
  }));

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-8">
      <PageHeader
        title="Meja billiard"
        subtitle="Mulai dan hentikan sesi, tagihan otomatis terhitung. Pesanan makanan bisa ditambah ke meja yang sedang main."
      />
      <BilliardBoard tables={tableDTO} waiting={waitingDTO} cfg={billingFromSettings(settings)} />
    </div>
  );
}
