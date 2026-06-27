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
      className="px-5 py-2.5 rounded-full text-sm transition-all hover:opacity-80"
      style={{
        background: "rgba(139, 26, 47, 0.15)",
        border: "1px solid rgba(139, 26, 47, 0.3)",
        color: "#c0374e",
        fontFamily: "var(--font-inter)",
      }}
    >
      Supprimer
    </button>
  );
}
