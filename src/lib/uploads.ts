import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";

/**
 * Stockage des photos (biens, logo) sur Cloudflare R2 — nécessaire pour un
 * déploiement Vercel : le système de fichiers y est éphémère, un fichier
 * écrit sur disque ne survit pas au-delà de la requête qui l'a créé.
 *
 * Variables d'environnement requises :
 *   R2_ACCOUNT_ID        — id du compte Cloudflare
 *   R2_ACCESS_KEY_ID     — clé d'accès R2 (créée dans le dashboard R2)
 *   R2_SECRET_ACCESS_KEY — clé secrète associée
 *   R2_BUCKET_NAME       — nom du bucket
 *   R2_PUBLIC_URL        — domaine public du bucket (ex: https://pub-xxx.r2.dev)
 *
 * Toutes les photos sont publiques (biens, logo) : pas besoin d'URL
 * signée, on stocke directement `${R2_PUBLIC_URL}/<clé>` en base.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function getPublicUrl() {
  return (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
}

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
}

function assertValidImage(file: File) {
  if (!(file.type in ALLOWED_TYPES)) {
    throw new Error("Seules les images (jpg, png, webp, gif) sont acceptées.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Chaque image doit faire moins de 5 Mo.");
  }
}

/** Upload un fichier vers R2 sous `images/<folder>/` et renvoie son URL publique. */
async function uploadImage(file: File, folder: "properties" | "logo"): Promise<string> {
  const ext = ALLOWED_TYPES[file.type] || path.extname(file.name) || ".jpg";
  const key = `images/${folder}/${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return `${getPublicUrl()}/${key}`;
}

export async function saveImages(files: File[]): Promise<string[]> {
  const validFiles = files.filter((file) => file && file.size > 0);
  if (validFiles.length === 0) return [];

  validFiles.forEach(assertValidImage);

  const urls: string[] = [];
  for (const file of validFiles) {
    urls.push(await uploadImage(file, "properties"));
  }
  return urls;
}

export async function saveImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  assertValidImage(file);
  return uploadImage(file, "logo");
}

export async function deleteImageFile(url: string) {
  const publicUrl = getPublicUrl();
  if (!publicUrl || !url.startsWith(publicUrl)) return;

  const key = url.slice(publicUrl.length + 1); // retire "<publicUrl>/"
  try {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
    );
  } catch {
    // le fichier n'existe peut-être déjà plus, on ignore
  }
}
