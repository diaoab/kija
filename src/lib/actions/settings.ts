"use server";

/** Logo + contenu du site (nom, description, page "À propos") — droit "content". */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveImage, deleteImageFile } from "@/lib/uploads";
import { requirePermission } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export async function updateSiteSettingsAction(formData: FormData) {
  await requirePermission("content");

  const siteName = String(formData.get("siteName") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const aboutContent = String(formData.get("aboutContent") || "").trim();
  const logoFile = formData.get("logo") as File | null;
  const removeLogo = formData.get("removeLogo") === "on";

  if (!siteName) throw new Error("Le nom de l'agence est requis.");
  if (siteName.length > 100) throw new Error("Le nom de l'agence est trop long (100 caractères max).");
  if (description.length > 300) throw new Error("La description courte est trop longue (300 caractères max).");
  if (aboutContent.length > 5000) throw new Error("La page « À propos » est trop longue (5000 caractères max).");

  const current = await getSiteSettings();
  const newLogoUrl = await saveImage(logoFile);

  // Un nouveau logo remplace l'ancien fichier ; "removeLogo" ne s'applique
  // que si aucun nouveau fichier n'a été envoyé dans la même soumission.
  if (newLogoUrl && current.logoUrl) {
    await deleteImageFile(current.logoUrl);
  }
  if (removeLogo && !newLogoUrl && current.logoUrl) {
    await deleteImageFile(current.logoUrl);
  }

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {
      siteName,
      description,
      aboutContent,
      logoUrl: newLogoUrl ?? (removeLogo ? null : current.logoUrl),
    },
    create: {
      id: "singleton",
      siteName,
      description,
      aboutContent,
      logoUrl: newLogoUrl,
    },
  });

  // "layout" invalide tout le site (header/footer lisent ces réglages sur
  // chaque page), pas seulement la route "/".
  revalidatePath("/", "layout");
  revalidatePath("/admin/parametres");
  redirect("/admin/parametres?updated=1");
}
