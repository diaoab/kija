"use client";

import { useActionState, useEffect, useState } from "react";
import { createReservationAction, type ReservationFormState } from "@/lib/actions/reservations";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/15";

const initialState: ReservationFormState = {};

export default function ReservationRequestForm({
  propertyId,
  rentalType,
  unavailablePeriods = [],
}: {
  propertyId: string;
  rentalType: string;
  unavailablePeriods?: { startDate: Date; endDate: Date }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createReservationAction, initialState);
  const isShort = rentalType === "SHORT";

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background shadow-sm transition-transform hover:scale-[1.02] sm:w-auto"
      >
        Demander une réservation
      </button>
      <p className="mt-3 text-xs text-muted">
        Votre demande est transmise à l&apos;agence, qui la confirme ou la refuse.
      </p>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Demande de réservation"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-border bg-surface shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-serif text-lg italic">Demande de réservation</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {state.success ? (
                <div>
                  <p className="text-sm text-foreground/80">
                    Votre demande a bien été envoyée. L&apos;agence vous contactera rapidement pour
                    la confirmer.
                  </p>
                  {state.whatsappLink && (
                    <a
                      href={state.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.02]"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      Contacter aussi via WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-3 w-full rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <form action={formAction} className="space-y-4">
                  <input type="hidden" name="propertyId" value={propertyId} />

                  <label className="block">
                    <span className="text-sm font-medium">Nom</span>
                    <input type="text" name="guestName" required className={inputClass} />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">Téléphone</span>
                    <input type="tel" name="guestPhone" required className={inputClass} />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">Email (optionnel)</span>
                    <input type="email" name="guestEmail" className={inputClass} />
                  </label>

                  {isShort ? (
                    <div>
                      <span className="text-sm font-medium">Dates du séjour</span>
                      <div className="mt-1.5">
                        <AvailabilityCalendar
                          unavailablePeriods={unavailablePeriods}
                          startName="startDate"
                          endName="endDate"
                        />
                      </div>
                    </div>
                  ) : (
                    <label className="block">
                      <span className="text-sm font-medium">Date d&apos;emménagement souhaitée</span>
                      <input type="date" name="moveInDate" required className={inputClass} />
                    </label>
                  )}

                  <label className="block">
                    <span className="text-sm font-medium">Message (optionnel)</span>
                    <textarea name="message" rows={3} className={inputClass} />
                  </label>

                  {state.error && <p className="text-xs text-red-600">{state.error}</p>}

                  <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={pending}
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {pending ? "Envoi..." : "Envoyer la demande"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
