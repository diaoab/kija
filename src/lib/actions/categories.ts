"use server";

/** CRUD des catégories de biens (Appartement, Villa, ...) — réservé au droit "categories". */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { requirePermission } from "@/lib/auth";

export type CategoryFormState = { error?: string };

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requirePermission("categories");

  const name = String(formData.get("name") || "").trim();

  if (!name) {
    return { error: "Le nom de la catégorie est requis." };
  }
  if (name.length > 60) {
    return { error: "Le nom de la catégorie est trop long (60 caractères max)." };
  }

  const slug = slugify(name);
  if (!slug) {
    return { error: "Ce nom de catégorie n'est pas valide." };
  }

  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  if (existing) {
    return { error: "Cette catégorie existe déjà." };
  }

  await prisma.category.create({ data: { name, slug } });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return {};
}

export async function deleteCategoryAction(formData: FormData) {
  await requirePermission("categories");

  const id = String(formData.get("id") || "");
  if (!id) return;

  // On bloque plutôt que de supprimer en cascade : perdre silencieusement
  // tous les biens d'une catégorie par erreur serait irrattrapable.
  const propertyCount = await prisma.property.count({ where: { categoryId: id } });
  if (propertyCount > 0) {
    throw new Error(
      "Impossible de supprimer cette catégorie : elle contient encore des biens."
    );
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
