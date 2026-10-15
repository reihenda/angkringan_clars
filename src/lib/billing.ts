/** Perhitungan tagihan. Dipakai server (sumber kebenaran) dan client (pratinjau). */

export type BillingConfig = {
  roundMinutes: number; // pembulatan durasi billiard, mis. 15 menit
  roundMoney: number; // pembulatan nominal ke atas, mis. 500
  minCharge: number; // min charge F&B untuk dapat gratis main
  freeHours: number; // jam gratis saat min charge terpenuhi
};

export const DEFAULT_BILLING: BillingConfig = {
  roundMinutes: 15,
  roundMoney: 500,
  minCharge: 150000,
  freeHours: 1,
};

export function billiardCharge(
  startedAt: Date | string,
  endedAt: Date | string | null,
  rate: number,
  cfg: BillingConfig,
  now: number = Date.now(),
) {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : now;
  const elapsedMin = Math.max(0, (end - start) / 60000);
  const blocks = Math.max(1, Math.ceil(elapsedMin / cfg.roundMinutes));
  const minutes = blocks * cfg.roundMinutes;
  const raw = (rate * minutes) / 60;
  const amount = Math.ceil(raw / cfg.roundMoney) * cfg.roundMoney;
  return { minutes, amount };
}

export function computeTotals(input: {
  fbSubtotal: number;
  billiardTotal: number;
  billiardRate: number;
  discount: number;
  cfg: BillingConfig;
}) {
  const { fbSubtotal, billiardTotal, billiardRate, discount, cfg } = input;
  const qualifies = billiardTotal > 0 && fbSubtotal >= cfg.minCharge;
  const promoDiscount = qualifies
    ? Math.min(billiardTotal, billiardRate * cfg.freeHours)
    : 0;
  const total = Math.max(
    0,
    fbSubtotal + billiardTotal - promoDiscount - Math.max(0, discount),
  );
  return { promoDiscount, total, qualifies };
}
