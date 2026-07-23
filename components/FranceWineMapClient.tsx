"use client";

import dynamic from "next/dynamic";
import type { AppellationMarker, ForeignWine } from "@/components/FranceWineMap";

const FranceWineMap = dynamic(() => import("@/components/FranceWineMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl min-h-96 flex items-center justify-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>Chargement de la carte…</p>
    </div>
  ),
});

export default function FranceWineMapClient({ markers, foreignWines }: { markers: AppellationMarker[]; foreignWines: ForeignWine[] }) {
  return <FranceWineMap markers={markers} foreignWines={foreignWines} />;
}
