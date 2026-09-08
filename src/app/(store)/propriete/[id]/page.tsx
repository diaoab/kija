import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { getBaseUrl } from "@/lib/url";
import { getSiteSettings } from "@/lib/settings";
import PropertyGallery from "@/components/PropertyGallery";
import ReservationRequestForm from "@/components/ReservationRequestForm";

type PropertyPageProps = {
  params: Promise<{ id: string }>;
};

const getProperty = cache(async (id: string) => {
  return prisma.property.findUnique({
    where: { id },
    include: { images: { orderBy: { createdAt: "asc" } }, category: true },
  });
});

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return {};

  const [baseUrl, settings] = await Promise.all([getBaseUrl(), getSiteSettings()]);
  const imageUrl = property.images[0] ? `${baseUrl}${property.images[0].url}` : undefined;
  const fullTitle = `${property.title} - ${settings.siteName}`;
  const price =
    property.rentalType === "SHORT" ? property.pricePerNight : property.pricePerMonth;
  const description = `${
    price != null ? formatPrice(price, property.rentalType === "SHORT" ? "night" : "month") : ""
  } — ${property.description}`;

  return {
    title: property.title,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url: baseUrl ? `${baseUrl}/propriete/${property.id}` : undefined,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  const isShort = property.rentalType === "SHORT";
  const price = isShort ? property.pricePerNight : property.pricePerMonth;

  return (
    <div>
      <Link
        href={`/categorie/${property.category.slug}`}
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        ← {property.category.name}
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <PropertyGallery images={property.images} propertyTitle={property.title} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="inline-block rounded-full bg-foreground/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-background">
            {isShort ? "Courte durée" : "Longue durée"}
          </span>
          <h1 className="mt-3 font-serif text-3xl italic sm:text-4xl">{property.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {property.city} — {property.address}
          </p>
          <p className="mt-3 text-2xl text-foreground/80">
            {price != null ? formatPrice(price, isShort ? "night" : "month") : "Prix sur demande"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {property.bedrooms} chambre{property.bedrooms > 1 ? "s" : ""} ·{" "}
            {property.bathrooms} salle{property.bathrooms > 1 ? "s" : ""} de bain ·{" "}
            {property.surfaceM2} m²
          </p>

          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
              Description
            </h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/80">
              {property.description}
            </p>
          </div>

          <ReservationRequestForm propertyId={property.id} rentalType={property.rentalType} />
        </div>
      </div>
    </div>
  );
}
