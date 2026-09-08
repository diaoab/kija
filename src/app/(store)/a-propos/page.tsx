import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "À propos",
    description: settings.description,
  };
}

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
        {settings.siteName}
      </p>
      <h1 className="mt-2 font-serif text-3xl italic sm:text-4xl">À propos</h1>

      {settings.aboutContent ? (
        <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/80">
          {settings.aboutContent}
        </p>
      ) : (
        <p className="mt-6 text-muted">
          {settings.description}
        </p>
      )}
    </div>
  );
}
