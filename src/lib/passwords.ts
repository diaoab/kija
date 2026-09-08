import crypto from "crypto";

/**
 * Génère un mot de passe temporaire lisible (ambiguïtés visuelles I/l/1,
 * O/0 retirées de l'alphabet) — destiné à être tapé une fois par la personne
 * qui le reçoit, puis remplacé au premier login (voir mustChangePassword).
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generateTempPassword(length = 10): string {
  const bytes = crypto.randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return password;
}
