"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import PasswordInput from "@/components/PasswordInput";

const initialState: LoginState = {};
const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/15";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction}>
      <label className="mt-6 block">
        <span className="text-sm font-medium">Email</span>
        <input type="email" name="email" required autoFocus className={inputClass} />
      </label>

      <label className="mt-4 block">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Mot de passe</span>
          <Link
            href="/admin/mot-de-passe-oublie"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <PasswordInput name="password" required className={inputClass} />
      </label>

      {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
