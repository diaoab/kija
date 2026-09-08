import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PropertyCard from "@/components/PropertyCard";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const properties = await prisma.property.findMany({
    where: { categoryId: category.id },
    orderBy: { createdAt: "desc" },
    include: { images: { take: 1, orderBy: { createdAt: "asc" } } },
  });

  return (
    <div>
      <Link href="/" className="text-sm text-muted transition-colors hover:text-foreground">
        ← Accueil
      </Link>

      <div className="mt-3 flex items-end justify-between">
        <h1 className="font-serif text-3xl italic sm:text-4xl">{category.name}</h1>
        <span className="text-sm text-muted">
          {properties.length} bien{properties.length > 1 ? "s" : ""}
        </span>
      </div>

      {properties.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border py-16 text-center text-muted">
          Aucun bien dans cette catégorie pour le moment.
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
