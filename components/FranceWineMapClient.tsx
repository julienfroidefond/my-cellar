"use client";

import dynamic from "next/dynamic";
import type { AppellationMarker, ForeignWine } from "@/components/FranceWineMap";

const FranceWineMap = dynamic(() => import("@/components/FranceWineMap"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div className="h-96 animate-pulse rounded-[var(--radius-lg)] bg-surface-2 lg:col-span-2" />
      <div className="h-96 animate-pulse rounded-[var(--radius-lg)] bg-surface-2" />
    </div>
  ),
});

export default function FranceWineMapClient({ markers, foreignWines }: { markers: AppellationMarker[]; foreignWines: ForeignWine[] }) {
  return <FranceWineMap markers={markers} foreignWines={foreignWines} />;
}
