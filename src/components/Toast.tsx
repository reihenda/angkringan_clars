"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState } from "react";

type Toast = { id: number; kind: "ok" | "err"; text: string };
const Ctx = createContext<(kind: "ok" | "err", text: string) => void>(() => {});

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const n = useRef(0);
  const push = useCallback((kind: "ok" | "err", text: string) => {
    const id = ++n.current;
    setItems((x) => [...x, { id, kind, text }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3800);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`rise pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${
              t.kind === "ok" ? "bg-plum" : "bg-red-700"
            }`}
          >
            {t.kind === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
