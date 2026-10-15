import { db } from "./db";
import { DEFAULT_BILLING, type BillingConfig } from "./billing";

export const SETTING_DEFAULTS = {
  storeName: "Clars Angkringan & Billiard",
  tagline: "Nongkrong Nyaman, Pulang Segan",
  address: "Jl. Contoh Raya No. 12, Kota Anda",
  mapsUrl: "https://maps.google.com",
  whatsapp: "6281234567890",
  instagram: "angkringanclars.id",
  openTime: "16:00",
  closeTime: "01:00",
  about:
    "Clars lahir dari ide sederhana: tempat nongkrong yang enak buat makan, minum, dan main billiard sampai lupa waktu. Harga bersahabat, porsi bikin kenyang, dan suasananya bikin betah.",
  billiardRate: "25000",
  minCharge: String(DEFAULT_BILLING.minCharge),
  freeHours: String(DEFAULT_BILLING.freeHours),
  roundMinutes: String(DEFAULT_BILLING.roundMinutes),
  roundMoney: String(DEFAULT_BILLING.roundMoney),
  qrisNote: "Scan QRIS di meja kasir",
  bankNote: "BCA 0000000000 a.n. Clars",
  receiptFooter: "Terima kasih, sampai jumpa lagi!",
};

export type Settings = typeof SETTING_DEFAULTS;

export async function getSettings(): Promise<Settings> {
  const rows = await db.setting.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return { ...SETTING_DEFAULTS, ...map } as Settings;
}

export function billingFromSettings(s: Settings): BillingConfig {
  return {
    roundMinutes: Number(s.roundMinutes) || DEFAULT_BILLING.roundMinutes,
    roundMoney: Number(s.roundMoney) || DEFAULT_BILLING.roundMoney,
    minCharge: Number(s.minCharge) || DEFAULT_BILLING.minCharge,
    freeHours: Number(s.freeHours) || DEFAULT_BILLING.freeHours,
  };
}

/** Apakah sekarang jam buka? (WIB). Mendukung jam tutup lewat tengah malam. */
export function isOpenNow(openTime: string, closeTime: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const cur = h * 60 + m;
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  const o = oh * 60 + om;
  const c = ch * 60 + cm;
  return o <= c ? cur >= o && cur < c : cur >= o || cur < c;
}
