"use client";

import { useActionState } from "react";
import {
  setNewPasswordAction,
  keepCurrentPasswordAction,
  type ChangePasswordState,
} from "@/lib/actions/change-password";
import PasswordInput from "@/components/PasswordInput";

const initialState: ChangePasswordState = {};
const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/15";

export default function ChangePasswordForm({ canKeepCurrent }: { canKeepCurrent: boolean }) {
  const [state, formAction, pending] = useActionState(setNewPasswordAction, initialState);

  return (
    <div>
      <form action={formAction}>
        <label className="mt-6 block">
          <span className="text-sm font-medium">Nouveau mot de passe</span>
          <PasswordInput name="newPassword" required minLength={10} className={inputClass} />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Confirmer le mot de passe</span>
          <PasswordInput name="confirmPassword" required minLength={10} className={inputClass} />
        </label>

        {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-full bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Enregistrement..." : "Changer le mot de passe"}
        </button>
      </form>

      {canKeepCurrent && (
        <form action={keepCurrentPasswordAction} className="mt-3">
          <button
            type="submit"
            className="w-full rounded-full border border-border py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            Conserver mon mot de passe actuel
          </button>
        </form>
      )}
    </div>
  );
}
