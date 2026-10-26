"use client";

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Fenêtre d'action de la fiche vin : feuille ancrée en bas sur mobile,
 * centrée sur grand écran. Rendue dans un portail pour échapper aux
 * transformations des conteneurs animés. Échap et clic sur le fond ferment.
 */
export function ActionSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 z-[var(--z-modal)] flex items-end justify-center sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="sheet pointer-events-auto w-full pb-[env(safe-area-inset-bottom)] text-left sm:max-w-sm"
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-5">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-xl font-semibold leading-tight">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-icon -mr-2 -mt-1 shrink-0"
              aria-label="Fermer"
            >
              <X />
            </button>
          </div>
          <div className="px-5 pb-2 pt-5">{children}</div>
          <div className="flex gap-2 px-5 pb-5 pt-3">{footer}</div>
        </div>
      </div>
    </>,
    document.body,
  );
}
