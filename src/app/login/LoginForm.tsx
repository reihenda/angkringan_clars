"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login, type LoginState } from "./actions";
import { btnPrimary, input, label } from "@/components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label htmlFor="username" className={label}>
          Username
        </label>
        <input id="username" name="username" autoComplete="username" autoFocus required className={input} />
      </div>
      <div>
        <label htmlFor="password" className={label}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={input}
        />
      </div>
      {state.error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={`${btnPrimary} w-full py-3`}>
        {pending ? <Loader2 className="animate-spin" size={18} /> : null}
        Masuk
      </button>
    </form>
  );
}
