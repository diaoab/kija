import { formatPrice } from "@/lib/utils";

function getWhatsAppNumber() {
  return (process.env.WHATSAPP_NUMBER || "").replace(/\D/g, "");
}

export function buildWhatsAppContactLink() {
  const number = getWhatsAppNumber();
  const text = encodeURIComponent(
    "Bonjour, j'ai une question au sujet d'un bien de l'agence."
  );
  return `https://wa.me/${number}?text=${text}`;
}

/**
 * Lien WhatsApp secondaire proposé une fois une réservation enregistrée en
 * base (voir src/lib/actions/reservations.ts) : simple confort pour que le
 * visiteur puisse aussi prévenir directement l'agence, la source de vérité
 * de la demande reste la ligne Reservation en base.
 */
export function buildWhatsAppReservationLink(params: {
  propertyTitle: string;
  city: string;
  rentalType: string;
  price: number;
  dates?: string;
  propertyUrl?: string;
}) {
  const number = getWhatsAppNumber();

  const lines = [
    "Bonjour, je viens de faire une demande de réservation pour ce bien :",
    `- Bien : ${params.propertyTitle}`,
    `- Ville : ${params.city}`,
    `- Prix : ${formatPrice(params.price, params.rentalType === "SHORT" ? "night" : "month")}`,
  ];
  if (params.dates) {
    lines.push(`- Dates : ${params.dates}`);
  }
  if (params.propertyUrl) {
    lines.push(`- Lien : ${params.propertyUrl}`);
  }
  lines.push("", "Pouvez-vous confirmer la disponibilité ?");

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${number}?text=${text}`;
}
