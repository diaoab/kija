import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePropertyAction } from "@/lib/actions/properties";
import PropertyForm from "@/components/admin/PropertyForm";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [property, categories] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      include: { images: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!property) notFound();

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">Biens</p>
      <h1 className="mt-2 font-serif text-3xl italic">Modifier le bien</h1>
      <div className="mt-6">
        <PropertyForm action={updatePropertyAction} categories={categories} property={property} />
      </div>
    </div>
  );
}
