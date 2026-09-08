import { prisma } from "@/lib/prisma";
import { deleteCategoryAction } from "@/lib/actions/categories";
import CategoryForm from "@/components/admin/CategoryForm";
import ConfirmSubmitButton from "@/components/admin/ConfirmSubmitButton";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { properties: true } } },
  });

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">Biens</p>
      <h1 className="mt-2 font-serif text-3xl italic">Catégories</h1>
      <p className="mt-2 text-sm text-muted">
        Créez les catégories dans lesquelles vos biens seront rangés (Appartement, Villa, etc.).
      </p>

      <div className="mt-6">
        <CategoryForm />
      </div>

      <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {categories.length === 0 && (
          <p className="p-5 text-sm text-muted">Aucune catégorie pour le moment.</p>
        )}
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between p-5">
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {category._count.properties} bien(s)
              </p>
            </div>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={category.id} />
              <ConfirmSubmitButton
                confirmMessage={`Supprimer la catégorie "${category.name}" ? Cette action est irréversible.`}
                className="text-sm text-red-600 transition-colors hover:text-red-700"
              >
                Supprimer
              </ConfirmSubmitButton>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
