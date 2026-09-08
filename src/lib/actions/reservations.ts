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

export type ReservationFormState = { error?: string; success?: boolean; whatsappLink?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function confirmReservationAction(formData: FormData) {
  const current = await requirePermission("reservations");

  const id = String(formData.get("id") || "");
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation || reservation.status !== "pending") return;

  await prisma.reservation.update({
    where: { id },
    data: { status: "confirmed", resolvedAt: new Date(), resolvedById: current.id },
  });

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
}

export async function rejectReservationAction(formData: FormData) {
  const current = await requirePermission("reservations");

  const id = String(formData.get("id") || "");
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation || reservation.status !== "pending") return;

  await prisma.reservation.update({
    where: { id },
    data: { status: "rejected", resolvedAt: new Date(), resolvedById: current.id },
  });

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
}
