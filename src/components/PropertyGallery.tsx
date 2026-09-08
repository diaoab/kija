"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const SWIPE_THRESHOLD_PX = 40;

export default function PropertyGallery({
  images,
  propertyTitle,
}: {
  images: { id: string; url: string }[];
  propertyTitle: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const canNavigate = images.length > 1;

  const goTo = (direction: 1 | -1) => {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  };

  useEffect(() => {
    if (!canNavigate) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // Ignore les flèches quand l'utilisateur tape dans un champ (formulaire
      // de réservation plus bas sur la même page).
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowLeft") goTo(-1);
      if (event.key === "ArrowRight") goTo(1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canNavigate, images.length]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-border bg-surface text-muted">
        Pas de photo
      </div>
    );
  }

  const active = images[activeIndex];

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    goTo(deltaX < 0 ? 1 : -1);
  };

  return (
    <div>
      <div
        className="relative aspect-square touch-pan-y overflow-hidden rounded-2xl border border-border bg-surface"
        onTouchStart={canNavigate ? onTouchStart : undefined}
        onTouchEnd={canNavigate ? onTouchEnd : undefined}
      >
        <Image
          key={active.id}
          src={active.url}
          alt={propertyTitle}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
        {canNavigate && (
          <>
            <button
              type="button"
              onClick={() => goTo(-1)}
              aria-label="Photo précédente"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 text-foreground shadow-sm backdrop-blur transition-transform hover:scale-105"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => goTo(1)}
              aria-label="Photo suivante"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 text-foreground shadow-sm backdrop-blur transition-transform hover:scale-105"
            >
              →
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2.5">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Photo ${index + 1}`}
              className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                index === activeIndex
                  ? "border-foreground"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
