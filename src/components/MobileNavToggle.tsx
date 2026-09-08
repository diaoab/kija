"use client";

import { useState } from "react";

/**
 * Bouton hamburger + panneau déroulant pour la navigation mobile.
 * Les liens sont passés en `children` : affichés en ligne horizontale à
 * partir de sm, repliés derrière ce bouton en dessous de sm.
 */
export default function MobileNavToggle({
  children,
  panelClassName,
}: {
  children: React.ReactNode;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        className="flex h-9 w-9 items-center justify-center rounded-full text-brand/80 transition-colors hover:bg-brand/10 hover:text-brand-light"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className={`absolute inset-x-0 top-16 z-30 flex flex-col gap-1 border-b border-ink-border bg-ink px-4 py-3 ${panelClassName ?? ""}`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
