import { prisma } from "@/lib/prisma";
import { createPropertyAction } from "@/lib/actions/properties";
import PropertyForm from "@/components/admin/PropertyForm";

export default async function NewPropertyPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">Biens</p>
      <h1 className="mt-2 font-serif text-3xl italic">Ajouter un bien</h1>

      {categories.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Créez d&apos;abord une catégorie (Appartement, Villa...) avant d&apos;ajouter un bien.
        </p>
      ) : (
        <div className="mt-6">
          <PropertyForm action={createPropertyAction} categories={categories} />
        </div>
      )}
    </div>
  );
}
