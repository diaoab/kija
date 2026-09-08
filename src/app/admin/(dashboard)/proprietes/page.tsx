import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { deletePropertyAction } from "@/lib/actions/properties";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

export default async function AdminPropertiesPage() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      images: { take: 1, orderBy: { createdAt: "asc" } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">Biens</p>
          <h1 className="mt-2 font-serif text-3xl italic">Propriétés</h1>
        </div>
        <Link
          href="/admin/proprietes/new"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Ajouter un bien
        </Link>
      </div>

      <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {properties.length === 0 && (
          <p className="p-5 text-sm text-muted">Aucun bien pour le moment.</p>
        )}
        {properties.map((property) => {
          const isShort = property.rentalType === "SHORT";
          const price = isShort ? property.pricePerNight : property.pricePerMonth;
          return (
            <div key={property.id} className="flex items-center gap-4 p-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-background">
                {property.images[0] ? (
                  <Image
                    src={property.images[0].url}
                    alt={property.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{property.title}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {property.category.name} · {property.city} ·{" "}
                  {price != null ? formatPrice(price, isShort ? "night" : "month") : "Prix sur demande"}
                </p>
              </div>
              <Link
                href={`/admin/proprietes/${property.id}/edit`}
                className="text-sm text-foreground/60 transition-colors hover:text-foreground"
              >
                Modifier
              </Link>
              <form action={deletePropertyAction}>
                <input type="hidden" name="id" value={property.id} />
                <ConfirmSubmitButton
                  confirmMessage={`Supprimer le bien "${property.title}" ? Cette action est irréversible.`}
                  className="text-sm text-red-600 transition-colors hover:text-red-700"
                >
                  Supprimer
                </ConfirmSubmitButton>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
