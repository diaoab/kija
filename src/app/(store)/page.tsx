import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { buildWhatsAppContactLink } from "@/lib/whatsapp";
import { getSiteSettings } from "@/lib/settings";
import PropertyCarousel from "@/components/PropertyCarousel";
import WhatsAppIcon from "@/components/WhatsAppIcon";

export default async function HomePage() {
  const [categories, properties, featuredProperties, settings] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { properties: { take: 1, orderBy: { createdAt: "desc" }, include: { images: { take: 1 } } } },
    }),
    prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { images: { take: 1, orderBy: { createdAt: "asc" } } },
    }),
    prisma.property.findMany({
      where: { isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { images: { take: 1, orderBy: { createdAt: "asc" } } },
    }),
    getSiteSettings(),
  ]);

  return (
    <div className="space-y-20">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-16 text-center sm:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.brand/8%),transparent_60%)]"
        />
        <p className="relative text-xs font-medium uppercase tracking-[0.3em] text-brand">
          Location & réservation
        </p>
        <h1 className="relative mt-4 font-serif text-4xl italic tracking-tight sm:text-6xl">
          Trouvez votre prochain logement
        </h1>
        <p className="relative mx-auto mt-5 max-w-md text-balance text-foreground/60">
          {settings.description}
        </p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#nouveautes"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.03]"
          >
            Voir les biens
          </Link>
        </div>
      </section>

      {featuredProperties.length > 0 && (
        <section>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-brand">
            Sélection du moment
          </p>
          <h2 className="mt-2 font-serif text-2xl italic sm:text-3xl">À la une</h2>
          <div className="mt-8">
            <PropertyCarousel properties={featuredProperties} />
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {categories.map((category) => {
              const image = category.properties[0]?.images[0]?.url;
              return (
                <Link
                  key={category.id}
                  href={`/categorie/${category.slug}`}
                  className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl border border-border bg-foreground sm:aspect-[16/10]"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-brand/40" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="relative flex w-full items-center justify-between px-6 py-5">
                    <span className="font-serif text-2xl italic text-white sm:text-3xl">
                      {category.name}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section id="nouveautes" className="scroll-mt-24">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-brand">
              Fraîchement arrivé
            </p>
            <h2 className="mt-2 font-serif text-2xl italic sm:text-3xl">Nouveautés</h2>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center text-muted">
            Aucun bien disponible pour le moment.
          </div>
        ) : (
          <div className="mt-8">
            <PropertyCarousel properties={properties} />
          </div>
        )}
      </section>

      <section className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-surface px-6 py-12 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h2 className="font-serif text-xl italic sm:text-2xl">
            Une question sur un bien ?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Écrivez-nous directement sur WhatsApp, réponse rapide garantie.
          </p>
        </div>
        <a
          href={buildWhatsAppContactLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.03]"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Nous contacter
        </a>
      </section>
    </div>
  );
}
