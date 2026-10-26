"use client";

import { useState, useRef } from "react";
import { ExternalLink, Loader2, Scissors, Trash2, Upload } from "lucide-react";
import { BottleSilhouette } from "@/components/WineTile";

interface Props {
  wineId: string;
  wineName: string;
  currentImage: string | null;
  onSelect: (url: string) => void;
}

const SEARCH_LINKS = [
  { label: "Vivino", url: (q: string) => `https://www.vivino.com/search/wines?q=${encodeURIComponent(q)}` },
  { label: "Wine-Searcher", url: (q: string) => `https://www.wine-searcher.com/find/${encodeURIComponent(q)}` },
  { label: "Google Images", url: (q: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q + " bouteille vin")}` },
];

export default function ImagePicker({ wineId, wineName, currentImage, onSelect }: Props) {
  const [pasteUrl, setPasteUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage);
  const [urlError, setUrlError] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [removeBgError, setRemoveBgError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function applyUrl() {
    const url = pasteUrl.trim();
    if (!url) return;
    setUrlError(false);
    setPreview(url);
    onSelect(url);
    setPasteUrl("");
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("id", wineId);
      const res = await fetch("/api/wines/upload-image", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        setPreview(data.url + "?v=" + Date.now());
        onSelect(data.url);
      } else {
        setUploadError(data.error ?? "Échec de l'upload");
      }
    } catch {
      setUploadError("Erreur réseau lors de l'upload");
    } finally {
      setUploading(false);
    }
  }

  async function removeBackground() {
    if (!preview) return;
    setRemovingBg(true);
    try {
      const res = await fetch("/api/wines/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: wineId, imageUrl: preview }),
      });
      const data = await res.json();
      if (data.url) {
        setPreview(data.url + "?v=" + Date.now());
        onSelect(data.url);
      } else {
        setRemoveBgError(data.error ?? "Échec du détourage");
      }
    } catch {
      setRemoveBgError("Erreur réseau");
    } finally {
      setRemovingBg(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        {/* Aperçu */}
        <div className="panel flex h-44 w-24 shrink-0 items-center justify-center overflow-hidden p-2 sm:w-28">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob/URL preview, not a remote asset
            <img
              src={preview}
              alt={`Bouteille ${wineName}`}
              className="h-full w-full object-contain drop-shadow-[0_6px_10px_rgba(43,9,18,0.22)]"
              onError={() => { setPreview(null); setUrlError(true); }}
            />
          ) : (
            <BottleSilhouette className="h-24 w-auto text-surface-3" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Téléversement */}
          <button
            type="button"
            onClick={() => { setUploadError(""); fileRef.current?.click(); }}
            disabled={uploading}
            className="btn btn-secondary w-full justify-start"
          >
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            {uploading ? "Envoi en cours…" : "Importer un fichier"}
          </button>
          {uploadError && (
            <p role="alert" className="text-xs font-medium text-wine-red">{uploadError}</p>
          )}

          {!preview && (
            <p className="text-sm text-muted">
              Aucune image. Importez un fichier ou collez une URL.
            </p>
          )}

          {preview && (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={removeBackground}
                disabled={removingBg}
                className="btn btn-ghost -ml-2 px-2.5"
              >
                {removingBg ? <Loader2 className="animate-spin" /> : <Scissors />}
                {removingBg ? "Détourage en cours…" : "Détourer"}
              </button>
              <button
                type="button"
                onClick={() => { setPreview(null); onSelect(""); }}
                className="btn btn-ghost px-2.5 text-wine-deep"
              >
                <Trash2 />
                Retirer
              </button>
              {removeBgError && (
                <p role="alert" className="w-full text-xs font-medium text-wine-red">{removeBgError}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
      {/* URL collée */}
      <div className="flex gap-2">
        <input
          value={pasteUrl}
          onChange={(e) => { setPasteUrl(e.target.value); setUrlError(false); }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyUrl())}
          placeholder="Coller une URL d’image…"
          aria-label="URL de l’image"
          aria-invalid={urlError || undefined}
          inputMode="url"
          className={`input h-10 min-w-0 flex-1 text-sm ${urlError ? "border-wine-red" : ""}`}
        />
        <button
          type="button"
          onClick={applyUrl}
          disabled={!pasteUrl.trim()}
          className="btn btn-soft shrink-0"
        >
          Utiliser
        </button>
      </div>
      {urlError && (
        <p role="alert" className="text-xs font-medium text-wine-red">
          URL invalide ou image inaccessible.
        </p>
      )}
      </div>

      {/* Liens de recherche */}
      <div className="panel p-3.5">
        <p className="label mb-2.5">Chercher l’image sur…</p>
        <div className="flex flex-wrap gap-1.5">
          {SEARCH_LINKS.map(({ label, url }) => (
            <a
              key={label}
              href={url(wineName)}
              target="_blank"
              rel="noopener noreferrer"
              className="chip"
            >
              {label}
              <ExternalLink />
            </a>
          ))}
        </div>
        <p className="mt-2.5 text-xs text-faint">
          Clic droit sur l’image, « Copier l’adresse de l’image », puis collez-la ci-dessus.
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
      />
    </div>
  );
}
