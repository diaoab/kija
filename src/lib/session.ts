import { SignJWT, jwtVerify } from "jose";

/**
 * Session admin — cookie JWT signé, ne contenant que l'id du compte.
 *
 * Volontairement minimal : le rôle et les droits ne sont JAMAIS mis dans le
 * token. Ils sont relus en base à chaque page/action via getCurrentAdmin()
 * (voir lib/auth.ts), donc un retrait de droit ou une suppression de compte
 * prend effet immédiatement, sans attendre l'expiration du cookie.
 */

const COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET n'est pas défini dans les variables d'environnement");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(adminId: string, passwordVersion: number) {
  return new SignJWT({ adminId, passwordVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export type SessionPayload = { adminId: string; passwordVersion: number };

/**
 * Renvoie l'id de l'admin et la version de mot de passe embarquée dans le
 * token si sa signature est valide, sinon null (jamais d'exception vers
 * l'appelant). La version est revérifiée contre la base par getCurrentAdmin()
 * (lib/auth.ts) : un changement de mot de passe invalide immédiatement les
 * sessions émises avant, même si le cookie n'a pas expiré.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.adminId !== "string" || typeof payload.passwordVersion !== "number") {
      return null;
    }
    return { adminId: payload.adminId, passwordVersion: payload.passwordVersion };
  } catch {
    return null;
  }
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
