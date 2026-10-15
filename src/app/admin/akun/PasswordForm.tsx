"use client";

import { useState, useTransition } from "react";
import { changeOwnPassword } from "@/lib/actions/admin";
import { useToast } from "@/components/Toast";
import { btnPrimary, card, input, label } from "@/components/ui";

export function PasswordForm() {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");

  return (
    <form
      className={`${card} space-y-4`}
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await changeOwnPassword(cur, next);
          if (r.ok) {
            toast("ok", "Password berhasil diganti.");
            setCur("");
            setNext("");
          } else toast("err", r.error);
        });
      }}
    >
      <h2 className="text-lg font-bold">Ganti password</h2>
      <div>
        <label className={label} htmlFor="cur">Password lama</label>
        <input id="cur" type="password" value={cur} onChange={(e) => setCur(e.target.value)} className={input} required autoComplete="current-password" />
      </div>
      <div>
        <label className={label} htmlFor="new">Password baru (min. 6 karakter)</label>
        <input id="new" type="password" value={next} onChange={(e) => setNext(e.target.value)} className={input} required minLength={6} autoComplete="new-password" />
      </div>
      <button className={btnPrimary} disabled={pending}>Simpan password</button>
    </form>
  );
}
