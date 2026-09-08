"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCategoryAction, type CategoryFormState } from "@/lib/actions/categories";

const initialState: CategoryFormState = {};

export default function CategoryForm() {
  const [state, formAction, pending] = useActionState(createCategoryAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex items-start gap-3">
      <div>
        <input
          type="text"
          name="name"
          placeholder="Nom de la catégorie (ex: Bureau)"
          required
          className="w-64 rounded-full border border-border bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/15"
        />
        {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}
