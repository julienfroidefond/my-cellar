"use client";

import { useState, useRef } from "react";

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
        setPreview(data.url);
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
        setPreview(data.url);
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
      {/* Preview */}
      <div className="flex items-start gap-5">
        <div
          className="rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ width: 72, height: 140, background: "rgba(26,10,14,0.04)", border: "1px solid rgba(26,10,14,0.09)" }}
        >
          {preview ? (
            <img src={preview} alt="Bouteille" className="w-full h-full object-contain" onError={() => { setPreview(null); setUrlError(true); }} />
          ) : (
            <span style={{ fontSize: 28, opacity: 0.3 }}>🍷</span>
          )}
        </div>

        <div className="flex-1 space-y-2.5">
          {/* Upload */}
          <button
            type="button"
            onClick={() => { setUploadError(""); fileRef.current?.click(); }}
            className="w-full text-sm px-4 py-2.5 rounded-xl text-left transition-opacity hover:opacity-80"
            style={{ background: "rgba(26,10,14,0.04)", border: "1px solid rgba(26,10,14,0.10)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
          >
            {uploading ? "Upload en cours…" : "📁 Uploader un fichier"}
          </button>
          {uploadError && (
            <p className="text-xs" style={{ color: "rgba(220,50,50,0.9)", fontFamily: "var(--font-inter)" }}>{uploadError}</p>
          )}

          {/* Paste URL */}
          <div className="flex gap-2">
            <input
              value={pasteUrl}
              onChange={(e) => { setPasteUrl(e.target.value); setUrlError(false); }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyUrl())}
              placeholder="Coller une URL d'image…"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm"
              style={{
                background: "rgba(26,10,14,0.04)",
                border: `1px solid ${urlError ? "rgba(255,80,80,0.5)" : "rgba(26,10,14,0.10)"}`,
                fontFamily: "var(--font-inter)",
                color: "#1a0a0e",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={applyUrl}
              disabled={!pasteUrl.trim()}
              className="px-3 py-2.5 rounded-xl text-sm disabled:opacity-30 transition-opacity hover:opacity-80"
              style={{ background: "rgba(192,25,59,0.10)", color: "var(--wine-red)", border: "1px solid rgba(192,25,59,0.25)", fontFamily: "var(--font-inter)" }}
            >
              OK
            </button>
          </div>
          {urlError && (
            <p className="text-xs" style={{ color: "rgba(255,80,80,0.8)", fontFamily: "var(--font-inter)" }}>
              URL invalide ou image inaccessible
            </p>
          )}

          {preview && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={removeBackground}
                disabled={removingBg}
                className="text-xs transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
              >
                {removingBg ? "Détourage en cours…" : "✂️ Détourer automatiquement"}
              </button>
              {removeBgError && (
                <span className="text-xs" style={{ color: "rgba(220,50,50,0.9)", fontFamily: "var(--font-inter)" }}>{removeBgError}</span>
              )}
              <button
                type="button"
                onClick={() => { setPreview(null); onSelect(""); }}
                className="text-xs transition-opacity hover:opacity-80"
                style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}
              >
                Supprimer l'image
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Liens de recherche */}
      <div className="rounded-xl p-3" style={{ background: "rgba(26,10,14,0.04)", border: "1px solid rgba(26,10,14,0.08)" }}>
        <p className="text-xs mb-2.5" style={{ fontFamily: "var(--font-inter)", color: "rgba(26,10,14,0.40)" }}>
          Chercher l'image sur…
        </p>
        <div className="flex gap-2 flex-wrap">
          {SEARCH_LINKS.map(({ label, url }) => (
            <a
              key={label}
              href={url(wineName)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{ background: "rgba(26,10,14,0.05)", border: "1px solid rgba(26,10,14,0.09)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
            >
              {label} ↗
            </a>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ fontFamily: "var(--font-inter)", color: "rgba(26,10,14,0.30)" }}>
          Clic droit sur l'image → "Copier l'adresse de l'image" → coller ci-dessus
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
