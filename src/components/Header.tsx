import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import MobileNavToggle from "@/components/MobileNavToggle";

const linkClass =
  "shrink-0 rounded-full px-3 py-1.5 text-brand/80 transition-colors hover:bg-brand/10 hover:text-brand-light";
const mobileLinkClass =
  "rounded-lg px-3 py-2.5 text-brand/80 transition-colors hover:bg-brand/10 hover:text-brand-light";

export default async function Header() {
  const [categories, settings] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getSiteSettings(),
  ]);

  return (
    <header className="sticky top-0 z-20 border-b border-ink-border bg-ink">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {settings.logoUrl ? (
            <span className="relative h-8 w-8 overflow-hidden rounded-full border border-brand/40">
              <Image src={settings.logoUrl} alt={settings.siteName} fill sizes="32px" className="object-cover" />
            </span>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand/40 text-sm font-serif italic text-gold">
              {settings.siteName.charAt(0) || "B"}
            </span>
          )}
          <span className="text-gold font-serif text-xl tracking-tight">
            {settings.siteName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 overflow-x-auto text-sm sm:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link href="/" className={linkClass}>
            Accueil
          </Link>
          {categories.map((category) => (
            <Link key={category.id} href={`/categorie/${category.slug}`} className={linkClass}>
              {category.name}
            </Link>
          ))}
          <Link href="/a-propos" className={linkClass}>
            À propos
          </Link>
        </nav>

        <MobileNavToggle>
          <Link href="/" className={mobileLinkClass}>
            Accueil
          </Link>
          {categories.map((category) => (
            <Link key={category.id} href={`/categorie/${category.slug}`} className={mobileLinkClass}>
              {category.name}
            </Link>
          ))}
          <Link href="/a-propos" className={mobileLinkClass}>
            À propos
          </Link>
        </MobileNavToggle>
      </div>
    </header>
  );
}
