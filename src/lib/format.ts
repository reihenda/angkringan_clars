export const rupiah = (n: number) =>
  "Rp" + Math.round(n).toLocaleString("id-ID");

/** 7000 -> "7.000" (gaya daftar menu) */
export const price = (n: number) => Math.round(n).toLocaleString("id-ID");

const TZ = "Asia/Jakarta";

export const fmtDateTime = (d: Date | string) =>
  new Date(d).toLocaleString("id-ID", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString("id-ID", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** "YYYY-MM-DD" untuk hari ini di Jakarta */
export const todayJakarta = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: TZ });

/** Awal hari (00:00 WIB) untuk tanggal "YYYY-MM-DD" */
export const dayStart = (date: string) => new Date(`${date}T00:00:00+07:00`);
export const dayEnd = (date: string) => new Date(`${date}T23:59:59.999+07:00`);

export const addDays = (date: string, n: number) => {
  const d = dayStart(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
};

export const durationLabel = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
};

export const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Tunai",
  QRIS: "QRIS",
  TRANSFER: "Transfer",
};

export const ORDER_TYPE_LABEL: Record<string, string> = {
  DINE_IN: "Dine-in",
  TAKEAWAY: "Bungkus",
  BILLIARD: "Billiard",
};
