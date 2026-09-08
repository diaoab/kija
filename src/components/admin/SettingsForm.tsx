"use client";

import { useState } from "react";
import Image from "next/image";
import { updateSiteSettingsAction } from "@/lib/actions/settings";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/15";

export default function SettingsForm({
  settings,
}: {
  settings: {
    siteName: string;
    description: string;
    aboutContent: string;
    logoUrl: string | null;
  };
}) {
  const [pending, setPending] = useState(false);
  const [removeLogo, setRemoveLogo] = useState(false);

  return (
    <form
      action={updateSiteSettingsAction}
      onSubmit={() => setPending(true)}
      className="max-w-xl space-y-6 rounded-2xl border border-border bg-surface p-6"
    >
      <div>
        <span className="text-sm font-medium">Logo de l&apos;agence</span>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
            {settings.logoUrl && !removeLogo ? (
              <Image
                src={settings.logoUrl}
                alt="Logo actuel"
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-serif text-lg italic text-muted">
                {settings.siteName.charAt(0) || "B"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-sm file:text-background"
            />
            {settings.logoUrl && (
              <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  name="removeLogo"
                  checked={removeLogo}
                  onChange={(event) => setRemoveLogo(event.target.checked)}
                />
                Retirer le logo actuel (afficher l&apos;initiale)
              </label>
            )}
          </div>
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Nom de l&apos;agence</span>
        <input
          type="text"
          name="siteName"
          required
          defaultValue={settings.siteName}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Description courte</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={settings.description}
          className={inputClass}
        />
        <span className="text-xs text-muted">
          Affichée sous le logo, dans le pied de page du site.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Page &laquo; À propos &raquo;</span>
        <textarea
          name="aboutContent"
          rows={8}
          defaultValue={settings.aboutContent}
          placeholder="Présentez votre agence, votre histoire, vos engagements..."
          className={inputClass}
        />
        <span className="text-xs text-muted">
          Ce texte est affiché sur la page publique /a-propos.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
