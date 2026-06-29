"use client";

import { useRef, useState } from "react";

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<"idle" | "confirm" | "loading" | "done" | "error">("idle");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<Record<string, number> | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImportFile(file);
    setImportState(file ? "confirm" : "idle");
    setImportResult(null);
    setErrorMsg("");
  }

  async function handleImport() {
    if (!importFile) return;
    setImportState("loading");
    try {
      const text = await importFile.text();
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur serveur");
      setImportResult(json.imported);
      setImportState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
      setImportState("error");
    }
  }

  function reset() {
    setImportState("idle");
    setImportFile(null);
    setImportResult(null);
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Hero */}
      <div className="diagonal-stripe relative overflow-hidden" style={{ minHeight: 280, background: "var(--background)" }}>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <p className="text-xs tracking-[0.45em] uppercase mb-5 font-semibold" style={{ color: "var(--wine-red)", fontFamily: "var(--font-inter)" }}>
            Paramètres
          </p>
          <h1 className="text-6xl font-bold leading-none" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
            Export / Import
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        {/* Export */}
        <section className="rounded-2xl p-8" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.07)" }}>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
            Exporter la base
          </h2>
          <p className="text-sm mb-6" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
            Télécharge un fichier JSON contenant tous vos vins, millésimes, emplacements, casiers et historique.
          </p>
          <a
            href="/api/export"
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)", textDecoration: "none" }}
          >
            Télécharger l'export
          </a>
        </section>

        {/* Import */}
        <section className="rounded-2xl p-8" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.07)" }}>
          <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
            Importer une base
          </h2>
          <p className="text-sm mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
            Restaure un export JSON. <strong>Toutes les données existantes seront remplacées.</strong>
          </p>
          <p className="text-xs mb-6" style={{ fontFamily: "var(--font-inter)", color: "var(--text-faint)" }}>
            Seuls les fichiers générés par cet outil sont acceptés.
          </p>

          {importState === "idle" && (
            <label
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-opacity hover:opacity-80"
              style={{ border: "1.5px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--foreground)" }}
            >
              Choisir un fichier
              <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" onChange={handleFileChange} />
            </label>
          )}

          {importState === "confirm" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(192,25,59,0.06)", border: "1px solid rgba(192,25,59,0.18)" }}>
                <span className="text-sm flex-1 truncate" style={{ fontFamily: "var(--font-inter)", color: "var(--foreground)" }}>
                  {importFile?.name}
                </span>
              </div>
              <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(192,25,59,0.06)", border: "1px solid rgba(192,25,59,0.18)", fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
                Cette opération est irréversible. Toutes les données actuelles seront effacées.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}
                >
                  Confirmer l'import
                </button>
                <button
                  onClick={reset}
                  className="px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80"
                  style={{ border: "1.5px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {importState === "loading" && (
            <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              Import en cours…
            </p>
          )}

          {importState === "done" && importResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: "rgba(26,120,60,0.07)", border: "1px solid rgba(26,120,60,0.2)" }}>
                <p className="text-sm font-semibold mb-2" style={{ fontFamily: "var(--font-inter)", color: "#1a783c" }}>
                  Import réussi
                </p>
                <ul className="text-xs space-y-1" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                  <li>{importResult.wines} vins</li>
                  <li>{importResult.vintages} millésimes</li>
                  <li>{importResult.slots} emplacements</li>
                  <li>{importResult.racks} casiers</li>
                  <li>{importResult.history} entrées d'historique</li>
                  <li>{importResult.images} images</li>
                </ul>
              </div>
              <button
                onClick={reset}
                className="px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80"
                style={{ border: "1.5px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
              >
                Importer un autre fichier
              </button>
            </div>
          )}

          {importState === "error" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: "rgba(192,25,59,0.06)", border: "1px solid rgba(192,25,59,0.25)" }}>
                <p className="text-sm font-semibold mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
                  Erreur lors de l'import
                </p>
                <p className="text-xs" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                  {errorMsg}
                </p>
              </div>
              <button
                onClick={reset}
                className="px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80"
                style={{ border: "1.5px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
              >
                Réessayer
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
