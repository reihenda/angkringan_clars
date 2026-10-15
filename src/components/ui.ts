// Kelas Tailwind bersama untuk area admin supaya tampilan konsisten.
export const input =
  "w-full rounded-xl border border-rose/70 bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/60 transition focus:border-pink focus:outline-none focus:ring-4 focus:ring-pink/15 disabled:bg-blush disabled:text-muted";

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-semibold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

export const btnPrimary = `${btn} bg-pink text-white hover:bg-pink-deep`;
export const btnSoft = `${btn} bg-petal text-pink-deep hover:bg-rose/60`;
export const btnGhost = `${btn} border border-rose/80 bg-white text-ink hover:bg-blush`;
export const btnDanger = `${btn} bg-white text-red-700 border border-red-200 hover:bg-red-50`;

export const card = "rounded-2xl bg-white p-5 shadow-[0_1px_0_0_rgba(240,40,127,0.06),0_8px_24px_-16px_rgba(120,20,70,0.25)]";

export const label = "mb-1.5 block text-sm font-semibold text-ink";
