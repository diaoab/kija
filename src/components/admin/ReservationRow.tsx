"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  confirmReservationAction,
  rejectReservationAction,
  type ReservationActionState,
} from "@/lib/actions/reservations";

type ReservationData = {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  startDate: Date | null;
  endDate: Date | null;
  moveInDate: Date | null;
  message: string | null;
  status: string;
  createdAt: Date;
  property: { id: string; title: string; city: string; rentalType: string };
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  rejected: "Refusée",
};

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-green-50 text-green-800 border-green-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
};

function formatDate(date: Date | null) {
  return date ? new Date(date).toLocaleDateString("fr-FR") : null;
}

const initialActionState: ReservationActionState = {};

export default function ReservationRow({ reservation }: { reservation: ReservationData }) {
  const [confirmState, confirmFormAction, confirmPending] = useActionState(
    confirmReservationAction,
    initialActionState
  );
  const [rejectState, rejectFormAction, rejectPending] = useActionState(
    rejectReservationAction,
    initialActionState
  );

  const dates =
    reservation.property.rentalType === "SHORT"
      ? [formatDate(reservation.startDate), formatDate(reservation.endDate)]
          .filter(Boolean)
          .join(" → ")
      : reservation.moveInDate
        ? `Emménagement souhaité : ${formatDate(reservation.moveInDate)}`
        : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/propriete/${reservation.property.id}`} className="text-sm font-medium hover:underline">
            {reservation.property.title}
          </Link>
          <p className="text-xs text-muted">{reservation.property.city}</p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${STATUS_CLASSES[reservation.status]}`}
        >
          {STATUS_LABELS[reservation.status] ?? reservation.status}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-sm text-foreground/80">
        <p>
          <span className="font-medium">{reservation.guestName}</span> — {reservation.guestPhone}
          {reservation.guestEmail ? ` — ${reservation.guestEmail}` : ""}
        </p>
        {dates && <p className="text-xs text-muted">{dates}</p>}
        {reservation.message && <p className="text-xs italic text-muted">« {reservation.message} »</p>}
      </div>

      {reservation.status === "pending" && (
        <div className="mt-3 flex items-center gap-2">
          <form action={confirmFormAction}>
            <input type="hidden" name="id" value={reservation.id} />
            <button
              type="submit"
              disabled={confirmPending}
              className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {confirmPending ? "..." : "Confirmer"}
            </button>
          </form>
          <form action={rejectFormAction}>
            <input type="hidden" name="id" value={reservation.id} />
            <button
              type="submit"
              disabled={rejectPending}
              className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-foreground/5 disabled:opacity-50"
            >
              {rejectPending ? "..." : "Refuser"}
            </button>
          </form>
        </div>
      )}
      {confirmState.error && <p className="mt-2 text-xs text-red-600">{confirmState.error}</p>}
      {rejectState.error && <p className="mt-2 text-xs text-red-600">{rejectState.error}</p>}
    </div>
  );
}
