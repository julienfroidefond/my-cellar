"use client";

import { useRouter } from "next/navigation";

export default function DeleteWineButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Supprimer "${name}" de la cave ?`)) return;
    await fetch(`/api/wines/${id}`, { method: "DELETE" });
    router.push("/wines");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm transition-opacity opacity-60 hover:opacity-100 hover:underline"
      style={{ color: "#c0374e", fontFamily: "var(--font-inter)" }}
    >
      Supprimer ce vin
    </button>
  );
}
