"use client";

import { useState } from "react";
import { rupiah } from "@/lib/format";

/** Hitung biaya main billiard dan lihat kapan min charge membuat 1 jam gratis. */
export function Calculator({ rate, minCharge, freeHours }: { rate: number; minCharge: number; freeHours: number }) {
  const [hours, setHours] = useState(2);
  const [spend, setSpend] = useState(100000);

  const gross = hours * rate;
  const qualifies = spend >= minCharge;
  const free = qualifies ? Math.min(freeHours, hours) * rate : 0;
  const total = gross - free;
  const missing = Math.max(0, minCharge - spend);

  return (
    <div className="rounded-3xl bg-white p-6 text-ink sm:p-8">
      <h3 className="text-2xl font-extrabold tracking-tight">Hitung main kamu</h3>

      <div className="mt-6 space-y-6">
        <div>
          <label htmlFor="calc-hours" className="flex items-baseline justify-between font-semibold">
            <span>Lama main</span>
            <span className="tnum text-2xl font-extrabold text-pink-deep">{hours} jam</span>
          </label>
          <input
            id="calc-hours"
            type="range"
            min={1}
            max={6}
            step={1}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="mt-3 h-8 w-full cursor-pointer accent-pink"
          />
        </div>
        <div>
          <label htmlFor="calc-spend" className="flex items-baseline justify-between font-semibold">
            <span>Belanja makanan &amp; minuman</span>
            <span className="tnum text-2xl font-extrabold text-pink-deep">{rupiah(spend)}</span>
          </label>
          <input
            id="calc-spend"
            type="range"
            min={0}
            max={300000}
            step={10000}
            value={spend}
            onChange={(e) => setSpend(Number(e.target.value))}
            className="mt-3 h-8 w-full cursor-pointer accent-pink"
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-blush p-5">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold text-muted">Biaya billiard</span>
          <span className="tnum text-3xl font-extrabold tracking-tight">{rupiah(total)}</span>
        </div>
        <p className="mt-2 text-[15px] font-medium text-ink">
          {qualifies
            ? `Min charge ${rupiah(minCharge)} tercapai: gratis ${freeHours} jam, kamu hemat ${rupiah(free)}.`
            : `Tambah belanja ${rupiah(missing)} lagi dan dapat gratis ${freeHours} jam main.`}
        </p>
      </div>
    </div>
  );
}
