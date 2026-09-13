"use server";

/**
 * Réinitialisation de mot de passe administrateur — flux à approbation.
 *
 * Contrairement à un reset par lien email classique, ici la demande ne
 * débloque rien toute seule : elle doit être approuvée par un admin ayant
 * le droit "admins" (voir /admin/administrateurs). Pas d'infra d'envoi de
 * lien signé à sécuriser, mais un humain dans la boucle avant tout nouveau
 * mot de passe.
 */

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, getCurrentAdmin } from "@/lib/auth";
import { generateTempPassword } from "@/lib/passwords";
import { sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/url";
import { getSiteSettings } from "@/lib/settings";
import { escapeHtml } from "@/lib/utils";

// Message identique que le compte existe ou non — ne jamais révéler à un
// visiteur non authentifié si un email correspond à un administrateur.
const GENERIC_MESSAGE =
  "Si un compte existe avec cet email, une demande a été transmise à un administrateur pour approbation.";

export type RequestResetState = { message?: string };

// ── Demande (public, non authentifié) ──────────────────────────────────────

/**
 * Point d'entrée public de /admin/mot-de-passe-oublie.
 * Ne renvoie jamais d'erreur ni d'information distinctive : que l'email soit
 * inconnu, valide, ou qu'une demande soit déjà en attente, la réponse est
 * toujours GENERIC_MESSAGE.
 */
export async function requestPasswordResetAction(
  _prevState: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { message: GENERIC_MESSAGE };

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (admin) {
    // Une demande en attente suffit — pas la peine d'en empiler d'autres
    // si la personne clique plusieurs fois.
    const existingPending = await prisma.passwordResetRequest.findFirst({
      where: { adminId: admin.id, status: "pending" },
    });
    if (!existingPending) {
      await prisma.passwordResetRequest.create({ data: { adminId: admin.id } });
    }
  }

  return { message: GENERIC_MESSAGE };
}

// ── Lecture (réservé aux admins avec le droit "admins") ────────────────────

/** Compteur pour le badge de notification du menu admin ; 0 si pas le droit. */
export async function getPendingPasswordResetCount() {
  const admin = await getCurrentAdmin();
  if (!admin || (!admin.isOwner && !admin.permissions.includes("admins"))) return 0;
  return prisma.passwordResetRequest.count({ where: { status: "pending" } });
}

export async function getPendingPasswordResets() {
  await requirePermission("admins");
  return prisma.passwordResetRequest.findMany({
    where: { status: "pending" },
    include: { admin: true },
    orderBy: { createdAt: "asc" },
  });
}

// ── Approbation / rejet ─────────────────────────────────────────────────────

export type ApproveResetState = {
  tempPassword?: string;
  adminName?: string;
  emailSent?: boolean;
  error?: string;
};

/**
 * Approuve une demande : génère un nouveau mot de passe temporaire, le
 * hash et l'enregistre, marque le compte "doit changer son mot de passe",
 * puis tente de l'envoyer par email. Le mot de passe est aussi renvoyé à
 * l'écran de l'admin qui approuve — c'est le filet de sécurité si l'email
 * n'est pas configuré ou échoue (voir emailSent dans le retour).
 */
export async function approvePasswordResetAction(
  _prevState: ApproveResetState,
  formData: FormData
): Promise<ApproveResetState> {
  const current = await requirePermission("admins");

  const requestId = String(formData.get("requestId") || "");
  const request = await prisma.passwordResetRequest.findUnique({
    where: { id: requestId },
    include: { admin: true },
  });
  if (!request || request.status !== "pending") {
    return { error: "Cette demande n'est plus disponible." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // Les deux écritures doivent réussir ensemble : un mot de passe changé
  // sans la demande marquée "approved" la laisserait réapparaître en attente.
  await prisma.$transaction([
    prisma.admin.update({
      where: { id: request.adminId },
      data: {
        passwordHash,
        mustChangePassword: true,
        // Invalide toute session ouverte avec l'ancien mot de passe (voir
        // aussi setNewPasswordAction dans change-password.ts).
        passwordVersion: { increment: 1 },
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: { status: "approved", resolvedAt: new Date(), resolvedById: current.id },
    }),
  ]);

  revalidatePath("/admin/administrateurs");
  revalidatePath("/admin");

  const [baseUrl, settings] = await Promise.all([getBaseUrl(), getSiteSettings()]);
  const loginUrl = baseUrl ? `${baseUrl}/admin/login` : "/admin/login";
  // Échappé avant interpolation dans le HTML : ces deux valeurs viennent de
  // champs éditables en base (nom d'admin, nom de l'agence) — même si seuls
  // des admins de confiance peuvent les définir, un email HTML ne doit
  // jamais exécuter de balisage qu'il contient.
  const safeName = escapeHtml(request.admin.name);
  const safeShopName = escapeHtml(settings.siteName);
  const { sent } = await sendEmail({
    to: request.admin.email,
    subject: `Réinitialisation de votre mot de passe - ${settings.siteName}`,
    text: [
      `Bonjour ${request.admin.name},`,
      "",
      `Votre demande de réinitialisation de mot de passe sur ${settings.siteName} a été approuvée.`,
      "",
      `Nouveau mot de passe temporaire : ${tempPassword}`,
      "",
      `Connectez-vous ici : ${loginUrl}`,
      "",
      "À la connexion, vous pourrez choisir un nouveau mot de passe ou conserver celui-ci.",
      "",
      "Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement un administrateur.",
    ].join("\n"),
    html: `
      <p>Bonjour ${safeName},</p>
      <p>Votre demande de réinitialisation de mot de passe sur <strong>${safeShopName}</strong> a été approuvée.</p>
      <p>Nouveau mot de passe temporaire : <code style="font-size:16px">${escapeHtml(tempPassword)}</code></p>
      <p><a href="${loginUrl}">Se connecter</a></p>
      <p>À la connexion, vous pourrez choisir un nouveau mot de passe ou conserver celui-ci.</p>
      <p style="color:#a33">Si vous n'êtes pas à l'origine de cette demande, contactez immédiatement un administrateur.</p>
    `,
  });

  if (!sent) {
    console.warn("[password-reset] email non envoyé (SMTP absent/en échec)", {
      adminId: request.adminId,
      approvedBy: current.id,
    });
  }

  return { tempPassword, adminName: request.admin.name, emailSent: sent };
}

export type RejectResetState = { rejected?: boolean; error?: string };

export async function rejectPasswordResetAction(
  _prevState: RejectResetState,
  formData: FormData
): Promise<RejectResetState> {
  const current = await requirePermission("admins");

  const requestId = String(formData.get("requestId") || "");
  const request = await prisma.passwordResetRequest.findUnique({ where: { id: requestId } });
  if (!request || request.status !== "pending") {
    return { error: "Cette demande n'est plus disponible." };
  }

  await prisma.passwordResetRequest.update({
    where: { id: requestId },
    data: { status: "rejected", resolvedAt: new Date(), resolvedById: current.id },
  });

  revalidatePath("/admin/administrateurs");
  revalidatePath("/admin");
  return { rejected: true };
}
