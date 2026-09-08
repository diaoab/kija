"use server";

/** CRUD des biens — réservé au droit "properties". */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveImages, deleteImageFile } from "@/lib/uploads";
import { requirePermission } from "@/lib/auth";

/** Validation + extraction des champs communs à la création et à la modification. */
function parsePropertyFields(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const rentalType = String(formData.get("rentalType") || "");
  const categoryId = String(formData.get("categoryId") || "");
  const city = String(formData.get("city") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const bedrooms = Math.round(Number(formData.get("bedrooms") || 0));
  const bathrooms = Math.round(Number(formData.get("bathrooms") || 0));
  const surfaceM2 = Math.round(Number(formData.get("surfaceM2") || 0));
  const isFeatured = formData.get("isFeatured") === "on";

  if (!title) throw new Error("Le titre du bien est requis.");
  if (title.length > 150) throw new Error("Le titre du bien est trop long (150 caractères max).");
  if (!description) throw new Error("La description est requise.");
  if (description.length > 3000) {
    throw new Error("La description est trop longue (3000 caractères max).");
  }
  if (!categoryId) throw new Error("Merci de choisir une catégorie.");
  if (rentalType !== "SHORT" && rentalType !== "LONG") {
    throw new Error("Merci de choisir un type de location.");
  }
  if (!city) throw new Error("La ville est requise.");
  if (!address) throw new Error("L'adresse est requise.");
  if (!Number.isFinite(bedrooms) || bedrooms < 0) throw new Error("Le nombre de chambres est invalide.");
  if (!Number.isFinite(bathrooms) || bathrooms < 0) {
    throw new Error("Le nombre de salles de bain est invalide.");
  }
  if (!Number.isFinite(surfaceM2) || surfaceM2 < 0) throw new Error("La surface est invalide.");

  let pricePerNight: number | null = null;
  let pricePerMonth: number | null = null;
  if (rentalType === "SHORT") {
    pricePerNight = Math.round(Number(formData.get("pricePerNight")));
    if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
      throw new Error("Le prix par nuit doit être un nombre valide.");
    }
  } else {
    pricePerMonth = Math.round(Number(formData.get("pricePerMonth")));
    if (!Number.isFinite(pricePerMonth) || pricePerMonth <= 0) {
      throw new Error("Le prix par mois doit être un nombre valide.");
    }
  }

  return {
    title,
    description,
    rentalType,
    pricePerNight,
    pricePerMonth,
    categoryId,
    city,
    address,
    bedrooms,
    bathrooms,
    surfaceM2,
    isFeatured,
  };
}

export async function createPropertyAction(formData: FormData) {
  await requirePermission("properties");

  const fields = parsePropertyFields(formData);
  const files = formData.getAll("images") as File[];
  const urls = await saveImages(files);

  const property = await prisma.property.create({
    data: {
      ...fields,
      images: { create: urls.map((url) => ({ url })) },
    },
  });

  revalidatePath("/admin/proprietes");
  revalidatePath("/");
  redirect(`/admin/proprietes?created=${property.id}`);
}

export async function updatePropertyAction(formData: FormData) {
  await requirePermission("properties");

  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Bien introuvable.");

  const fields = parsePropertyFields(formData);
  const files = formData.getAll("images") as File[];
  const urls = await saveImages(files);

  await prisma.property.update({
    where: { id },
    data: {
      ...fields,
      // Les nouvelles photos s'ajoutent aux existantes ; la suppression d'une
      // photo précise passe par deletePropertyImageAction, pas par ce formulaire.
      ...(urls.length > 0
        ? { images: { create: urls.map((url) => ({ url })) } }
        : {}),
    },
  });

  revalidatePath("/admin/proprietes");
  revalidatePath(`/admin/proprietes/${id}/edit`);
  revalidatePath(`/propriete/${id}`);
  revalidatePath("/");
  redirect("/admin/proprietes");
}

export async function deletePropertyAction(formData: FormData) {
  await requirePermission("properties");

  const id = String(formData.get("id") || "");
  if (!id) return;

  const property = await prisma.property.findUnique({
    where: { id },
    include: { images: true },
  });
  if (!property) return;

  // On supprime la ligne en base d'abord, puis les fichiers sur disque :
  // si l'un des unlink échoue, le bien n'est pas laissé dans un état
  // à moitié supprimé (au pire, un fichier orphelin dans le stockage).
  await prisma.property.delete({ where: { id } });
  await Promise.all(property.images.map((img) => deleteImageFile(img.url)));

  revalidatePath("/admin/proprietes");
  revalidatePath("/");
}

export async function deletePropertyImageAction(formData: FormData) {
  await requirePermission("properties");

  const imageId = String(formData.get("imageId") || "");
  const propertyId = String(formData.get("propertyId") || "");
  if (!imageId) return;

  const image = await prisma.propertyImage.findUnique({ where: { id: imageId } });
  if (!image) return;

  await prisma.propertyImage.delete({ where: { id: imageId } });
  await deleteImageFile(image.url);

  revalidatePath(`/admin/proprietes/${propertyId}/edit`);
}
