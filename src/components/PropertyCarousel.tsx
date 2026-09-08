"use client";

import { useEffect, useRef } from "react";
import PropertyCard from "@/components/PropertyCard";

type CarouselProperty = {
  id: string;
  title: string;
  city: string;
  rentalType: string;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  bedrooms: number;
  bathrooms: number;
  createdAt: Date;
  images: { url: string }[];
};

const AUTO_ADVANCE_MS = 3000;

export default function PropertyCarousel({ properties }: { properties: CarouselProperty[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canScroll = properties.length > 1;

  const scrollByOneCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    const firstCard = track.children[0] as HTMLElement | undefined;
    const secondCard = track.children[1] as HTMLElement | undefined;
    // Distance réelle entre deux cartes (largeur + espace) plutôt qu'une
    // valeur de gap codée en dur : l'espacement CSS change selon la taille
    // d'écran (gap-4 puis sm:gap-6), un pas fixe finissait par décaler le
    // défilement d'une carte à l'autre au bout de plusieurs clics.
    const cardWidth = secondCard
      ? secondCard.offsetLeft - firstCard!.offsetLeft
      : firstCard?.offsetWidth ?? track.clientWidth;

    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
    const atStart = track.scrollLeft <= 5;

    if (direction === 1 && atEnd) {
      track.scrollLeft = 0;
    } else if (direction === -1 && atStart) {
      track.scrollLeft = track.scrollWidth;
    } else {
      track.scrollLeft += direction * cardWidth;
    }
  };

  const restartAutoAdvance = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!canScroll) return;
    intervalRef.current = setInterval(() => scrollByOneCard(1), AUTO_ADVANCE_MS);
  };

  useEffect(() => {
    restartAutoAdvance();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canScroll]);

  const handleArrowClick = (direction: 1 | -1) => {
    scrollByOneCard(direction);
    restartAutoAdvance();
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {properties.map((property) => (
          <div
            key={property.id}
            className="w-[47%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]"
          >
            <PropertyCard property={property} />
          </div>
        ))}
      </div>

      {canScroll && (
        <>
          <button
            type="button"
            onClick={() => handleArrowClick(-1)}
            aria-label="Bien précédent"
            className="absolute left-0.5 top-[38%] -translate-y-1/2 sm:left-0 sm:-translate-x-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-sm transition-transform hover:scale-105"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => handleArrowClick(1)}
            aria-label="Bien suivant"
            className="absolute right-0.5 top-[38%] -translate-y-1/2 sm:right-0 sm:translate-x-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-sm transition-transform hover:scale-105"
          >
            →
          </button>
        </>
      )}
    </div>
  );
}
