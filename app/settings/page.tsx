"use client";

import { useRef, useState } from "react";

type ImportResult = {
  wines: number;
  vintages: number;
  slots: number;
  racks: number;
  history: number;
  images: number;
  imageErrors: string[];
};

type ImportState = "idle" | "confirm" | "loading-db" | "loading-images" | "done" | "error";

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>("idle");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parsedImageCount, setParsedImageCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImportFile(file);
    setImportState(file ? "confirm" : "idle");
    setImportResult(null);
    setParsedImageCount(0);
    setErrorMsg("");
  }

  async function handleImport() {
    if (!importFile) return;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(await importFile.text());
    } catch {
      setErrorMsg("Fichier JSON invalide");
      setImportState("error");
      return;
    }

    const images = parsed.images as Record<string, string> | undefined;
    const imageCount = images ? Object.keys(images).length : 0;
    setParsedImageCount(imageCount);

    // Step 1 — import DB data (small payload, no images)
    setImportState("loading-db");
    const dbPayload: Record<string, unknown> = { ...parsed };
    delete dbPayload.images;

    let dbRes: Response;
    try {
      dbRes = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });
    } catch {
      setErrorMsg("Erreur réseau lors de l'import des données");
      setImportState("error");
      return;
    }

    const dbJson = await dbRes.json();
    if (!dbRes.ok) {
      setErrorMsg(dbJson.error ?? "Erreur serveur");
      setImportState("error");
      return;
    }

    // Step 2 — import images separately (may be large)
    let imagesImported = 0;
    let imageErrors: string[] = [];

    if (images && imageCount > 0) {
      setImportState("loading-images");
      try {
        const imgRes = await fetch("/api/import/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images }),
        });
        const imgJson = await imgRes.json();
        if (imgRes.ok) {
          imagesImported = imgJson.images ?? 0;
          imageErrors = imgJson.errors ?? [];
        } else {
          imageErrors = [imgJson.error ?? "Erreur lors de l'import des images"];
        }
      } catch {
        imageErrors = ["Erreur réseau lors de l'import des images"];
      }
    }

    setImportResult({
      ...dbJson.imported,
      images: imagesImported,
      imageErrors,
    });
    setImportState("done");
  }

  function reset() {
    setImportState("idle");
    setImportFile(null);
    setImportResult(null);
    setParsedImageCount(0);
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const loadingLabel =
    importState === "loading-db"
      ? "Import des données…"
      : importState === "loading-images"
        ? `Import des images (${parsedImageCount})…`
        : null;

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
            Télécharge un fichier JSON contenant tous vos vins, millésimes, emplacements, casiers, historique et images.
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
            Les données et les images sont envoyées en deux requêtes séparées.
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

          {(importState === "loading-db" || importState === "loading-images") && (
            <p className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
              {loadingLabel}
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
              {importResult.imageErrors.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(192,25,59,0.06)", border: "1px solid rgba(192,25,59,0.2)" }}>
                  <p className="text-xs font-semibold mb-1" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
                    {importResult.imageErrors.length} image(s) non importée(s)
                  </p>
                  <ul className="text-xs space-y-0.5" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
                    {importResult.imageErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
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
