export function slugify(name: string) {
  const withoutDiacritics = name
    .normalize("NFD")
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code < 0x0300 || code > 0x036f;
    })
    .join("");

  return withoutDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatPrice(price: number, unit?: "night" | "month") {
  const amount = `${new Intl.NumberFormat("fr-FR").format(price)} FCFA`;
  if (unit === "night") return `${amount}/nuit`;
  if (unit === "month") return `${amount}/mois`;
  return amount;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Échappe le texte avant de l'insérer dans un template HTML brut (ex: email). */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}
