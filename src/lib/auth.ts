import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { parsePermissions, type Permission } from "@/lib/permissions";

/**
 * Résout l'admin courant à partir du cookie de session.
 * Mis en cache par requête (React cache()) : peut être appelé depuis
 * plusieurs pages/composants sans multiplier les allers-retours en base.
 * Retourne null si pas connecté OU si le compte a été supprimé entre-temps.
 */
export const getCurrentAdmin = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const admin = await prisma.admin.findUnique({ where: { id: session.adminId } });
  if (!admin) return null;
  // Un changement de mot de passe entre-temps invalide ce cookie, même s'il
  // n'a pas encore expiré (voir SessionPayload dans lib/session.ts).
  if (admin.passwordVersion !== session.passwordVersion) return null;

  return { ...admin, permissions: parsePermissions(admin.permissions) };
});

/** Redirige vers /admin/login si personne n'est connecté. */
export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/**
 * Modèle strict : aucun accès implicite. Le propriétaire (isOwner) a tous
 * les droits d'office ; tout autre admin doit avoir la permission demandée
 * explicitement dans sa liste, sinon il est renvoyé au tableau de bord.
 * À appeler en tout premier dans chaque page et chaque server action
 * touchant à cette ressource (la vérification ne se fait jamais côté client).
 */
export async function requirePermission(permission: Permission) {
  const admin = await requireAdmin();
  if (!admin.isOwner && !admin.permissions.includes(permission)) {
    redirect("/admin");
  }
  return admin;
}
