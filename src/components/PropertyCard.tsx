import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type PropertyCardData = {
  id: string;
  title: string;
  city: string;
  rentalType: string;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  bedrooms: number;
  bathrooms: number;
  createdAt: Date;
  images: { url: string }[];
};

const NEW_WINDOW_DAYS = 14;

export default function PropertyCard({ property }: { property: PropertyCardData }) {
  const coverImage = property.images[0]?.url;
  const isNew =
    Date.now() - new Date(property.createdAt).getTime() <
    NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const isShort = property.rentalType === "SHORT";
  const price = isShort ? property.pricePerNight : property.pricePerMonth;

  return (
    <Link href={`/propriete/${property.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={property.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Pas de photo
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-foreground/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-background">
          {isShort ? "Courte durée" : "Longue durée"}
        </span>
        {isNew && (
          <span className="absolute right-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
            Nouveau
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-snug">{property.title}</h3>
      </div>
      <p className="mt-1 text-xs text-muted">{property.city}</p>
      <p className="mt-1 text-sm text-muted">
        {price != null ? formatPrice(price, isShort ? "night" : "month") : "Prix sur demande"}
        {" · "}
        {property.bedrooms} ch. · {property.bathrooms} sdb
      </p>
    </Link>
  );
}
