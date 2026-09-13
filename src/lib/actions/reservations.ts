"use server";

/**
 * Réservations — contrairement au reste du CRUD admin, la création est un
 * point d'entrée PUBLIC (formulaire sur la fiche d'un bien, voir
 * ReservationRequestForm) : pas de requirePermission ici. Seules la lecture
 * du compteur en attente et les actions de confirmation/refus sont réservées
 * au droit "reservations".
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, getCurrentAdmin } from "@/lib/auth";
import { buildWhatsAppReservationLink } from "@/lib/whatsapp";
import { getBaseUrl } from "@/lib/url";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/utils";
import { getSiteSettings } from "@/lib/settings";

export type ReservationFormState = { error?: string; success?: boolean; whatsappLink?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Un bien en courte durée ne peut pas avoir deux réservations confirmées sur
 * des dates qui se chevauchent. Utilisé à la fois à la soumission (public) et
 * à la confirmation (admin) — la soumission avertit tôt, la confirmation
 * reste le dernier rempart si deux demandes concurrentes arrivent entre-temps.
 */
async function hasConfirmedConflict(params: {
  propertyId: string;
  startDate: Date;
  endDate: Date;
  excludeReservationId?: string;
}) {
  const conflict = await prisma.reservation.findFirst({
    where: {
      propertyId: params.propertyId,
      status: "confirmed",
      ...(params.excludeReservationId ? { id: { not: params.excludeReservationId } } : {}),
      startDate: { lt: params.endDate },
      endDate: { gt: params.startDate },
    },
  });
  return Boolean(conflict);
}

/** Périodes déjà confirmées pour un bien en courte durée — affiché publiquement sur sa fiche. */
export async function getUnavailablePeriods(propertyId: string) {
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      status: "confirmed",
      endDate: { gte: new Date() },
    },
    select: { startDate: true, endDate: true },
    orderBy: { startDate: "asc" },
  });
  return reservations as { startDate: Date; endDate: Date }[];
}

// ── Création (public, non authentifié) ──────────────────────────────────────

export async function createReservationAction(
  _prevState: ReservationFormState,
  formData: FormData
): Promise<ReservationFormState> {
  const propertyId = String(formData.get("propertyId") || "");
  const guestName = String(formData.get("guestName") || "").trim();
  const guestPhone = String(formData.get("guestPhone") || "").trim();
  const guestEmail = String(formData.get("guestEmail") || "").trim();
  const message = String(formData.get("message") || "").trim();

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return { error: "Ce bien n'est plus disponible." };

  if (!guestName) return { error: "Le nom est requis." };
  if (!guestPhone) return { error: "Le téléphone est requis." };
  if (guestEmail && !EMAIL_RE.test(guestEmail)) return { error: "L'email n'est pas valide." };

  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let moveInDate: Date | null = null;

  if (property.rentalType === "SHORT") {
    const startRaw = String(formData.get("startDate") || "");
    const endRaw = String(formData.get("endDate") || "");
    startDate = startRaw ? new Date(startRaw) : null;
    endDate = endRaw ? new Date(endRaw) : null;
    if (!startDate || Number.isNaN(startDate.getTime()) || !endDate || Number.isNaN(endDate.getTime())) {
      return { error: "Merci de choisir une date d'arrivée et de départ." };
    }
    if (startDate >= endDate) {
      return { error: "La date de départ doit être après la date d'arrivée." };
    }
    if (await hasConfirmedConflict({ propertyId, startDate, endDate })) {
      return { error: "Ces dates ne sont plus disponibles pour ce bien. Merci d'en choisir d'autres." };
    }
  } else {
    const moveInRaw = String(formData.get("moveInDate") || "");
    moveInDate = moveInRaw ? new Date(moveInRaw) : null;
    if (!moveInDate || Number.isNaN(moveInDate.getTime())) {
      return { error: "Merci de choisir une date d'emménagement souhaitée." };
    }
  }

  await prisma.reservation.create({
    data: {
      propertyId,
      guestName,
      guestPhone,
      guestEmail: guestEmail || null,
      message: message || null,
      startDate,
      endDate,
      moveInDate,
      status: "pending",
    },
  });

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");

  const baseUrl = await getBaseUrl();
  const dates =
    property.rentalType === "SHORT"
      ? `du ${startDate!.toLocaleDateString("fr-FR")} au ${endDate!.toLocaleDateString("fr-FR")}`
      : `emménagement souhaité le ${moveInDate!.toLocaleDateString("fr-FR")}`;
  const whatsappLink = buildWhatsAppReservationLink({
    propertyTitle: property.title,
    city: property.city,
    rentalType: property.rentalType,
    price: (property.rentalType === "SHORT" ? property.pricePerNight : property.pricePerMonth) || 0,
    dates,
    propertyUrl: baseUrl ? `${baseUrl}/propriete/${property.id}` : undefined,
  });

  return { success: true, whatsappLink };
}

// ── Lecture (réservée aux admins avec le droit "reservations") ─────────────

/** Compteur pour le badge de notification du menu admin ; 0 si pas le droit. */
export async function getPendingReservationCount() {
  const admin = await getCurrentAdmin();
  if (!admin || (!admin.isOwner && !admin.permissions.includes("reservations"))) return 0;
  return prisma.reservation.count({ where: { status: "pending" } });
}

export async function getReservations(status?: string) {
  await requirePermission("reservations");
  return prisma.reservation.findMany({
    where: status && status !== "all" ? { status } : {},
    include: { property: { select: { id: true, title: true, city: true, rentalType: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// ── Confirmation / refus ─────────────────────────────────────────────────────

export type ReservationActionState = { error?: string };

function formatReservationDates(reservation: {
  rentalType: string;
  startDate: Date | null;
  endDate: Date | null;
  moveInDate: Date | null;
}) {
  return reservation.rentalType === "SHORT"
    ? `du ${reservation.startDate!.toLocaleDateString("fr-FR")} au ${reservation.endDate!.toLocaleDateString("fr-FR")}`
    : `emménagement souhaité le ${reservation.moveInDate!.toLocaleDateString("fr-FR")}`;
}

/** Best-effort : prévient le client par email si un email a été renseigné. */
async function notifyGuest(params: {
  guestEmail: string | null;
  guestName: string;
  propertyTitle: string;
  dates: string;
  status: "confirmed" | "rejected";
}) {
  if (!params.guestEmail) return;

  const settings = await getSiteSettings();
  const safeName = escapeHtml(params.guestName);
  const safeProperty = escapeHtml(params.propertyTitle);
  const safeSiteName = escapeHtml(settings.siteName);

  if (params.status === "confirmed") {
    await sendEmail({
      to: params.guestEmail,
      subject: `Réservation confirmée - ${params.propertyTitle}`,
      text: [
        `Bonjour ${params.guestName},`,
        "",
        `Votre demande de réservation pour "${params.propertyTitle}" (${params.dates}) a été confirmée par ${settings.siteName}.`,
        "",
        "Vous serez contacté(e) prochainement pour organiser les détails.",
      ].join("\n"),
      html: `
        <p>Bonjour ${safeName},</p>
        <p>Votre demande de réservation pour <strong>${safeProperty}</strong> (${escapeHtml(params.dates)}) a été <strong>confirmée</strong> par ${safeSiteName}.</p>
        <p>Vous serez contacté(e) prochainement pour organiser les détails.</p>
      `,
    });
  } else {
    await sendEmail({
      to: params.guestEmail,
      subject: `Réservation refusée - ${params.propertyTitle}`,
      text: [
        `Bonjour ${params.guestName},`,
        "",
        `Votre demande de réservation pour "${params.propertyTitle}" (${params.dates}) n'a malheureusement pas pu être acceptée.`,
        "",
        "N'hésitez pas à consulter nos autres biens disponibles.",
      ].join("\n"),
      html: `
        <p>Bonjour ${safeName},</p>
        <p>Votre demande de réservation pour <strong>${safeProperty}</strong> (${escapeHtml(params.dates)}) n'a malheureusement pas pu être acceptée.</p>
        <p>N'hésitez pas à consulter nos autres biens disponibles.</p>
      `,
    });
  }
}

export async function confirmReservationAction(
  _prevState: ReservationActionState,
  formData: FormData
): Promise<ReservationActionState> {
  const current = await requirePermission("reservations");

  const id = String(formData.get("id") || "");
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { property: { select: { title: true, rentalType: true } } },
  });
  if (!reservation || reservation.status !== "pending") return {};

  if (
    reservation.startDate &&
    reservation.endDate &&
    (await hasConfirmedConflict({
      propertyId: reservation.propertyId,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      excludeReservationId: reservation.id,
    }))
  ) {
    return {
      error: "Impossible de confirmer : ces dates chevauchent une réservation déjà confirmée pour ce bien.",
    };
  }

  await prisma.reservation.update({
    where: { id },
    data: { status: "confirmed", resolvedAt: new Date(), resolvedById: current.id },
  });

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");

  await notifyGuest({
    guestEmail: reservation.guestEmail,
    guestName: reservation.guestName,
    propertyTitle: reservation.property.title,
    dates: formatReservationDates({ ...reservation, rentalType: reservation.property.rentalType }),
    status: "confirmed",
  });

  return {};
}

export async function rejectReservationAction(
  _prevState: ReservationActionState,
  formData: FormData
): Promise<ReservationActionState> {
  const current = await requirePermission("reservations");

  const id = String(formData.get("id") || "");
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { property: { select: { title: true, rentalType: true } } },
  });
  if (!reservation || reservation.status !== "pending") return {};

  await prisma.reservation.update({
    where: { id },
    data: { status: "rejected", resolvedAt: new Date(), resolvedById: current.id },
  });

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");

  await notifyGuest({
    guestEmail: reservation.guestEmail,
    guestName: reservation.guestName,
    propertyTitle: reservation.property.title,
    dates: formatReservationDates({ ...reservation, rentalType: reservation.property.rentalType }),
    status: "rejected",
  });

  return {};
}

// ── Saisie manuelle (réservée aux admins, ex: réservation prise par téléphone) ─

export type ManualReservationState = { error?: string; success?: boolean };

/**
 * Enregistre directement une réservation déjà actée par un autre canal
 * (téléphone, WhatsApp, en personne...), avec le statut "confirmed" d'emblée
 * — sans ça, ces réservations resteraient invisibles du système et
 * `getUnavailablePeriods` continuerait de proposer ces dates comme libres.
 */
export async function createManualReservationAction(
  _prevState: ManualReservationState,
  formData: FormData
): Promise<ManualReservationState> {
  const current = await requirePermission("reservations");

  const propertyId = String(formData.get("propertyId") || "");
  const guestName = String(formData.get("guestName") || "").trim();
  const guestPhone = String(formData.get("guestPhone") || "").trim();
  const guestEmail = String(formData.get("guestEmail") || "").trim();
  const message = String(formData.get("message") || "").trim();

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return { error: "Bien introuvable." };
  if (!guestName) return { error: "Le nom est requis." };
  if (!guestPhone) return { error: "Le téléphone est requis." };
  if (guestEmail && !EMAIL_RE.test(guestEmail)) return { error: "L'email n'est pas valide." };

  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let moveInDate: Date | null = null;

  if (property.rentalType === "SHORT") {
    const startRaw = String(formData.get("startDate") || "");
    const endRaw = String(formData.get("endDate") || "");
    startDate = startRaw ? new Date(startRaw) : null;
    endDate = endRaw ? new Date(endRaw) : null;
    if (!startDate || Number.isNaN(startDate.getTime()) || !endDate || Number.isNaN(endDate.getTime())) {
      return { error: "Merci de choisir une date d'arrivée et de départ." };
    }
    if (startDate >= endDate) {
      return { error: "La date de départ doit être après la date d'arrivée." };
    }
    if (await hasConfirmedConflict({ propertyId, startDate, endDate })) {
      return { error: "Ces dates chevauchent une réservation déjà confirmée pour ce bien." };
    }
  } else {
    const moveInRaw = String(formData.get("moveInDate") || "");
    moveInDate = moveInRaw ? new Date(moveInRaw) : null;
    if (!moveInDate || Number.isNaN(moveInDate.getTime())) {
      return { error: "Merci de choisir une date d'emménagement souhaitée." };
    }
  }

  await prisma.reservation.create({
    data: {
      propertyId,
      guestName,
      guestPhone,
      guestEmail: guestEmail || null,
      message: message || null,
      startDate,
      endDate,
      moveInDate,
      status: "confirmed",
      resolvedAt: new Date(),
      resolvedById: current.id,
    },
  });

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  revalidatePath(`/propriete/${propertyId}`);

  return { success: true };
}
