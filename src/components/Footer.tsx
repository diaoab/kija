import Image from "next/image";
import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";

export default async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="mt-24 border-t border-ink-border bg-ink">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              {settings.logoUrl ? (
                <span className="relative h-7 w-7 overflow-hidden rounded-full border border-brand/40">
                  <Image
                    src={settings.logoUrl}
                    alt={settings.siteName}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand/40 text-xs font-serif italic text-gold">
                  {settings.siteName.charAt(0) || "B"}
                </span>
              )}
              <span className="text-gold font-serif text-lg">{settings.siteName}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-brand/70">{settings.description}</p>
          </div>

          <div className="flex gap-3 text-sm">
            <Link href="/a-propos" className="text-brand/80 transition-colors hover:text-brand-light">
              À propos
            </Link>
            <Link
              href="/admin/login"
              className="text-brand/80 transition-colors hover:text-brand-light"
            >
              Espace administrateur
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-ink-border pt-6 text-xs text-brand/60">
          © {new Date().getFullYear()} {settings.siteName}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
