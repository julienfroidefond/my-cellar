"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Gives every route a small entrance fade and lift.
 *
 * The wrapper is keyed by pathname so a new page remounts and replays the
 * animation. Query-only changes (filters, carousel state) keep the same
 * pathname and therefore do not restart the page entrance.
 *
 * The animation uses `animation-fill-mode: backwards`, so the transform is
 * removed once it finishes. Keeping a transform applied would turn the wrapper
 * into the containing block for fixed-position modals rendered by pages.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
