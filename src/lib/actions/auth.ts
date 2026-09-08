"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, MAX_AGE_SECONDS, createSessionToken } from "@/lib/session";

export type LoginState = { error?: string };

// Anti brute-force : au-delà de ce nombre d'échecs consécutifs, le compte
// est verrouillé temporairement plutôt que de laisser un script retenter
// indéfiniment.
const MAX_FAILED_ATTEMPTS = 6;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Connexion admin (email + mot de passe).
 *
 * Message d'erreur volontairement identique pour "email introuvable" et
 * "mot de passe incorrect" — ne pas révéler laquelle des deux informations
 * est en cause évite à un attaquant de vérifier l'existence d'un compte.
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = formData.get("password");

  if (!email || typeof password !== "string" || password.length === 0) {
    return { error: "Merci de renseigner votre email et votre mot de passe." };
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return { error: "Identifiants incorrects." };
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return {
      error: "Trop de tentatives échouées. Réessayez dans quelques minutes.",
    };
  }

  const validPassword = await bcrypt.compare(password, admin.passwordHash);
  if (!validPassword) {
    const attempts = admin.failedLoginAttempts + 1;
    const lockedOut = attempts >= MAX_FAILED_ATTEMPTS;
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: lockedOut ? 0 : attempts,
        lockedUntil: lockedOut ? new Date(Date.now() + LOCK_DURATION_MS) : null,
      },
    });
    return lockedOut
      ? { error: "Trop de tentatives échouées. Réessayez dans quelques minutes." }
      : { error: "Identifiants incorrects." };
  }

  if (admin.failedLoginAttempts > 0 || admin.lockedUntil) {
    await prisma.admin.update({
      where: { id: admin.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  const token = await createSessionToken(admin.id, admin.passwordVersion);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });

  // Compte tout juste créé ou réinitialisé : on force le passage par l'écran
  // de bienvenue avant d'accéder au tableau de bord (voir changer-mot-de-passe).
  redirect(admin.mustChangePassword ? "/admin/changer-mot-de-passe" : "/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}
