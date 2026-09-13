"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createManualReservationAction,
  type ManualReservationState,
} from "@/lib/actions/reservations";

type PropertyOption = { id: string; title: string; city: string; rentalType: string };

const initialState: ManualReservationState = {};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/15";

export default function ManualReservationForm({ properties }: { properties: PropertyOption[] }) {
  const [state, formAction, pending] = useActionState(createManualReservationAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  if (properties.length === 0) return null;

  const selected = properties.find((property) => property.id === propertyId);
  const isShort = (selected?.rentalType ?? properties[0].rentalType) === "SHORT";

  return (
    <details className="mt-6 rounded-2xl border border-border bg-surface p-5">
      <summary className="cursor-pointer text-sm font-medium">
        Ajouter une réservation prise par un autre canal (téléphone, WhatsApp, en personne...)
      </summary>
      <p className="mt-2 text-xs text-muted">
        Enregistrée directement comme confirmée, pour que ces dates apparaissent aussi comme
        indisponibles sur la fiche publique du bien.
      </p>

      <form ref={formRef} action={formAction} className="mt-4 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Bien</span>
          <select
            name="propertyId"
            required
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            className={`${inputClass} bg-background`}
          >
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title} — {property.city}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Nom du client</span>
            <input type="text" name="guestName" required className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Téléphone</span>
            <input type="tel" name="guestPhone" required className={inputClass} />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Email (optionnel)</span>
          <input type="email" name="guestEmail" className={inputClass} />
        </label>

        {isShort ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">Arrivée</span>
              <input type="date" name="startDate" required className={inputClass} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Départ</span>
              <input type="date" name="endDate" required className={inputClass} />
            </label>
          </div>
        ) : (
          <label className="block">
            <span className="text-sm font-medium">Date d&apos;emménagement</span>
            <input type="date" name="moveInDate" required className={inputClass} />
          </label>
        )}

        <label className="block">
          <span className="text-sm font-medium">Message (optionnel)</span>
          <textarea name="message" rows={2} className={inputClass} />
        </label>

        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
        {state.success && (
          <p className="text-xs text-green-700">Réservation ajoutée et confirmée.</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Ajout..." : "Ajouter et confirmer"}
        </button>
      </form>
    </details>
  );
}
