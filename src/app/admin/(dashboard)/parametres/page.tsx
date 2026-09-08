import { requirePermission } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  await requirePermission("content");
  const { updated } = await searchParams;
  const settings = await getSiteSettings();

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">Agence</p>
      <h1 className="mt-2 font-serif text-3xl italic">Logo et contenu du site</h1>
      <p className="mt-2 text-sm text-muted">
        Personnalisez le logo, le nom de l&apos;agence et la page &laquo; À propos &raquo;.
      </p>

      {updated && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          Modifications enregistrées.
        </p>
      )}

      <div className="mt-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
