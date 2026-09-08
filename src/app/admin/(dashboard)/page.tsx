import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { PERMISSION_LABELS } from "@/lib/permissions";

export default async function AdminHomePage() {
  const admin = await getCurrentAdmin();

  const [categoryCount, propertyCount, pendingReservationCount, adminCount] = await Promise.all([
    prisma.category.count(),
    prisma.property.count(),
    prisma.reservation.count({ where: { status: "pending" } }),
    prisma.admin.count(),
  ]);

  const can = (permission: string) =>
    admin?.isOwner || admin?.permissions.includes(permission as never);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
        Vue d&apos;ensemble
      </p>
      <h1 className="mt-2 font-serif text-3xl italic">
        Bonjour{admin ? `, ${admin.name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {admin?.isOwner
          ? "Propriétaire — tous les droits"
          : admin?.permissions.map((p) => PERMISSION_LABELS[p]).join(" · ") ||
            "Aucun droit attribué pour le moment"}
      </p>

      <div className="mt-8 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Catégories</p>
          <p className="mt-1 font-serif text-4xl">{categoryCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Biens</p>
          <p className="mt-1 font-serif text-4xl">{propertyCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Réservations en attente</p>
          <p className="mt-1 font-serif text-4xl">{pendingReservationCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Administrateurs</p>
          <p className="mt-1 font-serif text-4xl">{adminCount}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {can("properties") && (
          <Link
            href="/admin/proprietes/new"
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Ajouter un bien
          </Link>
        )}
        {can("categories") && (
          <Link
            href="/admin/categories"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            Gérer les catégories
          </Link>
        )}
        {can("reservations") && (
          <Link
            href="/admin/reservations"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            Gérer les réservations
          </Link>
        )}
        {can("content") && (
          <Link
            href="/admin/parametres"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            Logo et contenu du site
          </Link>
        )}
        {can("admins") && (
          <Link
            href="/admin/administrateurs"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            Gérer les administrateurs
          </Link>
        )}
      </div>
    </div>
  );
}
