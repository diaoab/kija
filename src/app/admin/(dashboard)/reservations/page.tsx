import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { getReservations } from "@/lib/actions/reservations";
import ReservationRow from "@/components/admin/ReservationRow";
import ManualReservationForm from "@/components/admin/ManualReservationForm";

const TABS: { value: string; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmées" },
  { value: "rejected", label: "Refusées" },
  { value: "all", label: "Toutes" },
];

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("reservations");

  const { status } = await searchParams;
  const activeStatus = status && TABS.some((tab) => tab.value === status) ? status : "pending";
  const [reservations, properties] = await Promise.all([
    getReservations(activeStatus),
    prisma.property.findMany({
      select: { id: true, title: true, city: true, rentalType: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">Réservations</p>
      <h1 className="mt-2 font-serif text-3xl italic">Réservations</h1>

      <ManualReservationForm properties={properties} />

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/reservations?status=${tab.value}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              activeStatus === tab.value
                ? "border-foreground bg-foreground text-background"
                : "border-border text-foreground/70 hover:bg-foreground/5"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {reservations.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
            Aucune réservation dans cette catégorie.
          </p>
        )}
        {reservations.map((reservation) => (
          <ReservationRow key={reservation.id} reservation={reservation} />
        ))}
      </div>
    </div>
  );
}
