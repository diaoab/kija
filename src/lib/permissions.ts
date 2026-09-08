/**
 * Droits attribuables à un administrateur. Stockés en base sous forme de
 * chaîne "properties,categories" (voir Admin.permissions) plutôt qu'une table
 * de jointure — largement suffisant pour une poignée de droits fixes, et
 * plus simple à lire/éditer à la main si besoin. Le propriétaire (isOwner)
 * n'a pas besoin d'être listé ici : il passe toujours (voir requirePermission).
 */
export const PERMISSIONS = {
  properties: "properties",
  categories: "categories",
  reservations: "reservations",
  content: "content",
  admins: "admins",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const PERMISSION_LABELS: Record<Permission, string> = {
  properties: "Gérer les biens",
  categories: "Gérer les catégories",
  reservations: "Gérer les réservations",
  content: "Gérer le logo et le contenu du site",
  admins: "Gérer les administrateurs",
};

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export function parsePermissions(raw: string): Permission[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is Permission => ALL_PERMISSIONS.includes(value as Permission));
}

export function serializePermissions(permissions: Permission[]): string {
  return Array.from(new Set(permissions)).join(",");
}

export function hasPermission(permissions: Permission[], permission: Permission) {
  return permissions.includes(permission);
}
