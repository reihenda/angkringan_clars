import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { billingFromSettings, getSettings } from "@/lib/settings";
import { PosClient, type OrderDTO } from "./PosClient";

export const metadata = { title: "Kasir" };
export const dynamic = "force-dynamic";

export default async function KasirPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  await requireUser();
  const { order: orderId } = await searchParams;

  const [categories, menu, settings, openOrders, order] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.menuItem.findMany({ orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }] }),
    getSettings(),
    db.order.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: { items: true, session: { include: { table: true } } },
    }),
    orderId
      ? db.order.findUnique({
          where: { id: orderId },
          include: { items: true, session: { include: { table: true } } },
        })
      : null,
  ]);

  const toDTO = (o: NonNullable<typeof order>): OrderDTO => ({
    id: o.id,
    number: o.number,
    type: o.type as OrderDTO["type"],
    customerName: o.customerName ?? "",
    note: o.note ?? "",
    items: o.items
      .filter((i) => i.menuItemId)
      .map((i) => ({ menuItemId: i.menuItemId!, name: i.name, price: i.price, qty: i.qty, note: i.note ?? "" })),
    billiard: o.session
      ? {
          sessionId: o.session.id,
          table: o.session.table.name,
          startedAt: o.session.startedAt.toISOString(),
          endedAt: o.session.endedAt?.toISOString() ?? null,
          rate: o.session.rate,
        }
      : null,
  });

  return (
    <PosClient
      key={orderId ?? "new"}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      menu={menu.map((m) => ({
        id: m.id,
        name: m.name,
        price: m.price,
        categoryId: m.categoryId,
        isAvailable: m.isAvailable,
        isFavorite: m.isFavorite,
      }))}
      cfg={billingFromSettings(settings)}
      payNotes={{ qris: settings.qrisNote, bank: settings.bankNote }}
      order={order && order.status === "OPEN" ? toDTO(order) : null}
      openOrders={openOrders.map((o) => ({
        id: o.id,
        number: o.number,
        label: o.customerName || o.session?.table.name || "Tanpa nama",
        type: o.type,
        total: o.total,
        itemCount: o.items.reduce((s, i) => s + i.qty, 0),
        createdAt: o.createdAt.toISOString(),
      }))}
    />
  );
}
