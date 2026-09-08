"use server";

/**
 * Gestion de l'équipe d'administrateurs — réservé au droit "admins".
 * Le propriétaire (isOwner) est intouchable ici : pas de suppression, pas de
 * modification de ses droits ; c'est le seul compte garanti à toujours
 * pouvoir se reconnecter et gérer les autres.
 */

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import {
  ALL_PERMISSIONS,
  serializePermissions,
  type Permission,
} from "@/lib/permissions";

export type AdminFormState = { error?: string };

/** Ne garde que les valeurs cochées qui correspondent à une permission connue. */
function readPermissions(formData: FormData): Permission[] {
  return formData
    .getAll("permissions")
    .map((value) => String(value))
    .filter((value): value is Permission =>
      (ALL_PERMISSIONS as string[]).includes(value)
    );
}

/**
 * Crée un compte avec un mot de passe temporaire choisi par l'admin qui
 * l'ajoute (à communiquer en privé à la personne concernée). Le nouveau
 * compte est marqué mustChangePassword: true — il verra l'écran "Bienvenue"
 * à sa première connexion, voir change-password.ts.
 */
export async function createAdminAction(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requirePermission("admins");

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const permissions = readPermissions(formData);

  if (!name) return { error: "Le nom est requis." };
  if (name.length > 100) return { error: "Le nom est trop long (100 caractères max)." };
  if (!email || !email.includes("@")) return { error: "Email invalide." };
  if (password.length < 10) {
    return { error: "Le mot de passe doit contenir au moins 10 caractères." };
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) return { error: "Un administrateur utilise déjà cet email." };

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.create({
    data: {
      name,
      email,
      passwordHash,
      permissions: serializePermissions(permissions),
      mustChangePassword: true,
    },
  });

  revalidatePath("/admin/administrateurs");
  return {};
}

export async function updateAdminPermissionsAction(formData: FormData) {
  await requirePermission("admins");

  const id = String(formData.get("id") || "");
  if (!id) return;

  // Le propriétaire a tous les droits en permanence : on ignore silencieusement
  // toute tentative de modifier ses cases à cocher plutôt que de renvoyer une erreur.
  const target = await prisma.admin.findUnique({ where: { id } });
  if (!target || target.isOwner) return;

  const permissions = readPermissions(formData);

  await prisma.admin.update({
    where: { id },
    data: { permissions: serializePermissions(permissions) },
  });

  revalidatePath("/admin/administrateurs");
}

export async function deleteAdminAction(formData: FormData) {
  const current = await requirePermission("admins");

  const id = String(formData.get("id") || "");
  if (!id) return;

  // Ces deux garde-fous sont volontairement des erreurs bloquantes (et non
  // un simple "return" silencieux) : ce sont des tentatives anormales — soit
  // un bug côté UI, soit quelqu'un qui pousse une requête à la main.
  if (id === current.id) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
  }

  const target = await prisma.admin.findUnique({ where: { id } });
  if (!target) return;
  if (target.isOwner) {
    throw new Error("Le propriétaire de l'agence ne peut pas être supprimé.");
  }

  await prisma.admin.delete({ where: { id } });
  revalidatePath("/admin/administrateurs");
}

export async function getAdmins() {
  await requirePermission("admins");
  return prisma.admin.findMany({ orderBy: { createdAt: "asc" } });
}
