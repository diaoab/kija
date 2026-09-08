"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordResetAction,
  type RequestResetState,
} from "@/lib/actions/password-reset";

const initialState: RequestResetState = {};
const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/15";

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.message) {
    return (
      <div>
        <p className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {state.message}
        </p>
        <Link
          href="/admin/login"
          className="mt-4 inline-block text-sm text-muted transition-colors hover:text-foreground"
        >
          ← Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <label className="mt-6 block">
        <span className="text-sm font-medium">Email</span>
        <input type="email" name="email" required autoFocus className={inputClass} />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Envoi..." : "Envoyer la demande"}
      </button>

      <Link
        href="/admin/login"
        className="mt-4 block text-center text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Retour à la connexion
      </Link>
    </form>
  );
}
