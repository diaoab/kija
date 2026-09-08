"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAdminAction, type AdminFormState } from "@/lib/actions/admins";
import { ALL_PERMISSIONS, PERMISSION_LABELS } from "@/lib/permissions";
import PasswordInput from "@/components/PasswordInput";

const initialState: AdminFormState = {};
const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/15";

export default function AdminCreateForm() {
  const [state, formAction, pending] = useActionState(createAdminAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="max-w-xl space-y-5 rounded-2xl border border-border bg-surface p-6"
    >
      <h2 className="font-serif text-lg italic">Ajouter un administrateur</h2>

      <label className="block">
        <span className="text-sm font-medium">Nom</span>
        <input type="text" name="name" required className={inputClass} />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input type="email" name="email" required className={inputClass} />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Mot de passe temporaire</span>
        <PasswordInput name="password" required minLength={10} className={inputClass} />
        <span className="text-xs text-muted">
          10 caractères minimum. Communiquez-le à la personne concernée.
        </span>
      </label>

      <div>
        <span className="text-sm font-medium">Droits</span>
        <div className="mt-2 space-y-2">
          {ALL_PERMISSIONS.map((permission) => (
            <label key={permission} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="permissions" value={permission} />
              {PERMISSION_LABELS[permission]}
            </label>
          ))}
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Ajout..." : "Ajouter l'administrateur"}
      </button>
    </form>
  );
}
