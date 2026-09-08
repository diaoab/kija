import { headers } from "next/headers";

/**
 * URL absolue utilisée dans les liens générés (email de réinitialisation,
 * métadonnées Open Graph des biens). Priorité à NEXT_PUBLIC_SITE_URL
 * (domaine officiel, fixé une fois pour toutes) plutôt qu'à l'en-tête Host
 * de la requête, qui reste un repli pratique en local mais est fourni par
 * le visiteur et ne doit pas être une source de confiance pour construire
 * des liens envoyés par email.
 */
export async function getBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const headerList = await headers();
  const host = headerList.get("host");
  if (!host) return undefined;
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
