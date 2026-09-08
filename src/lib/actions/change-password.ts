"use server";

/**
 * Écran "Bienvenue" affiché quand mustChangePassword est vrai (première
 * connexion sur un compte tout juste créé, ou après une réinitialisation
 * approuvée). Deux issues possibles, l'utilisateur choisit :
 *   - garder le mot de passe temporaire tel quel (keepCurrentPasswordAction)
 *   - en choisir un nouveau (setNewPasswordAction)
 * Dans les deux cas, mustChangePassword repasse à false et l'accès au
 * tableau de bord est débloqué.
 */

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { COOKIE_NAME, MAX_AGE_SECONDS, createSessionToken } from "@/lib/session";

export type ChangePasswordState = { error?: string };

export async function keepCurrentPasswordAction() {
  const admin = await requireAdmin();
  await prisma.admin.update({
    where: { id: admin.id },
    data: { mustChangePassword: false },
  });
  redirect("/admin");
}

export async function setNewPasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const admin = await requireAdmin();

  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 10) {
    return { error: "Le mot de passe doit contenir au moins 10 caractères." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      // Invalide toute autre session ouverte avec l'ancien mot de passe.
      passwordVersion: { increment: 1 },
    },
  });

  // On réémet immédiatement un cookie à jour : sans ça, l'admin qui vient de
  // changer son propre mot de passe serait déconnecté par la vérification de
  // version au prochain chargement (voir getCurrentAdmin dans lib/auth.ts).
  const token = await createSessionToken(updated.id, updated.passwordVersion);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });

  redirect("/admin");
}
