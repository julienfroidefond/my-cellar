"use client";

import { useRef, useState } from "react";
import {
  CircleCheck,
  Download,
  FileJson,
  LoaderCircle,
  RotateCcw,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import ApiTokenSection, { SettingsRow } from "./ApiTokenSection";

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

    let dbJson: Record<string, unknown>;
    try {
      dbJson = await dbRes.json();
    } catch {
      setErrorMsg("Réponse serveur invalide (erreur interne)");
      setImportState("error");
      return;
    }
    if (!dbRes.ok) {
      setErrorMsg((dbJson.error as string) ?? "Erreur serveur");
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
      ...(dbJson.imported as ImportResult),
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

  const busy = importState === "loading-db" || importState === "loading-images";

  return (
    <div>
      <PageHeader
        eyebrow="Paramètres"
        title="Données"
        lead="Sauvegardez votre cave, restaurez une sauvegarde ou ouvrez l’accès aux agents."
      />

      <div className="container-page max-w-4xl space-y-10 py-10 md:py-14">
        {/* ── Sauvegarde ───────────────────────────────────────────────── */}
        <section data-reveal aria-labelledby="export-title">
          <SettingsRow
            icon={Download}
            title="Exporter la base"
            titleId="export-title"
            description="Un fichier JSON avec vos vins, millésimes, emplacements, casiers, historique et images."
            action={
              <a href="/api/export" download className="btn btn-primary w-full sm:w-auto">
                <Download />
                Télécharger l&apos;export
              </a>
            }
          />
        </section>

        {/* ── Accès externe ────────────────────────────────────────────── */}
        <section data-reveal>
          <ApiTokenSection />
        </section>

        {/* ── Zone sensible : import ───────────────────────────────────── */}
        <section data-reveal aria-labelledby="import-title">
          <p className="eyebrow mb-3 flex items-center gap-2">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Zone sensible
          </p>
          <div className="card overflow-hidden border-[rgba(192,25,59,0.35)]">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-5 sm:p-6">
              <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--wine-tint)] text-wine-red sm:flex">
                <Upload className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="import-title" className="font-display text-lg font-semibold">
                  Importer une base
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Restaure un export JSON.{" "}
                  <strong className="font-semibold text-wine-deep">Toutes les données existantes seront remplacées.</strong>
                </p>
                <p className="mt-1 text-xs text-faint">
                  Les données puis les images sont envoyées en deux requêtes séparées.
                </p>

                <div className="mt-5">
                  {importState === "idle" && (
                    <label className="btn btn-danger w-full cursor-pointer sm:w-auto">
                      <FileJson />
                      Choisir un fichier
                      <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" onChange={handleFileChange} />
                    </label>
                  )}

                  {importState === "confirm" && (
                    <div className="space-y-3">
                      <div className="panel flex items-center gap-3 px-3.5 py-3">
                        <FileJson className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                        <span className="flex-1 truncate text-sm font-medium">{importFile?.name}</span>
                      </div>
                      <p
                        role="alert"
                        className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--wine-tint)] px-3.5 py-3 text-sm font-medium text-wine-deep"
                      >
                        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        Opération irréversible : toutes les données actuelles seront effacées.
                      </p>
                      <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <button type="button" onClick={reset} className="btn btn-secondary">
                          Annuler
                        </button>
                        <button type="button" onClick={handleImport} className="btn btn-primary">
                          Remplacer toutes les données
                        </button>
                      </div>
                    </div>
                  )}

                  {busy && (
                    <p className="flex items-center gap-2.5 text-sm text-muted" aria-live="polite">
                      <LoaderCircle className="h-4 w-4 animate-spin text-wine-red" aria-hidden="true" />
                      {loadingLabel}
                    </p>
                  )}

                  {importState === "done" && importResult && (
                    <div className="space-y-3">
                      <div className="rounded-[var(--radius-md)] bg-[rgba(38,110,64,0.09)] p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-success">
                          <CircleCheck className="h-4 w-4" aria-hidden="true" />
                          Import réussi
                        </p>
                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
                          {[
                            [importResult.wines, "vins"],
                            [importResult.vintages, "millésimes"],
                            [importResult.slots, "emplacements"],
                            [importResult.racks, "casiers"],
                            [importResult.history, "entrées d’historique"],
                            [importResult.images, "images"],
                          ].map(([value, label]) => (
                            <div key={label} className="flex items-baseline gap-1.5">
                              <dt className="sr-only">{label}</dt>
                              <dd className="font-semibold tabular">{value}</dd>
                              <span className="text-muted">{label}</span>
                            </div>
                          ))}
                        </dl>
                      </div>
                      {importResult.imageErrors.length > 0 && (
                        <div className="rounded-[var(--radius-md)] bg-[var(--wine-tint)] p-4">
                          <p className="text-sm font-semibold text-wine-deep">
                            {importResult.imageErrors.length} image(s) non importée(s)
                          </p>
                          <ul className="mt-1 space-y-0.5 text-xs text-muted">
                            {importResult.imageErrors.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        </div>
                      )}
                      <button type="button" onClick={reset} className="btn btn-secondary">
                        Importer un autre fichier
                      </button>
                    </div>
                  )}

                  {importState === "error" && (
                    <div className="space-y-3">
                      <div role="alert" className="rounded-[var(--radius-md)] bg-[var(--wine-tint)] p-4">
                        <p className="text-sm font-semibold text-wine-deep">Erreur lors de l&apos;import</p>
                        <p className="mt-1 text-sm text-muted">{errorMsg}</p>
                      </div>
                      <button type="button" onClick={reset} className="btn btn-secondary">
                        <RotateCcw />
                        Réessayer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
