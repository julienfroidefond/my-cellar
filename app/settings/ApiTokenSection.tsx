"use client";

import { useEffect, useState } from "react";

type TokenStatus = { exists: boolean; createdAt: string | null; lastUsedAt: string | null };

export default function ApiTokenSection() {
  const [status, setStatus] = useState<TokenStatus | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/settings/api-token").then((r) => r.json()).then(setStatus);
  }, []);

  async function generate() {
    if (status?.exists && !confirm("Générer un nouveau token invalidera l'ancien. Continuer ?")) return;
    setLoading(true);
    const res = await fetch("/api/settings/api-token", { method: "POST" });
    const data = await res.json();
    setNewToken(data.token);
    setStatus({ exists: true, createdAt: data.createdAt, lastUsedAt: null });
    setCopied(false);
    setLoading(false);
  }

  async function revoke() {
    if (!confirm("Révoquer le token ? Les appels externes cesseront de fonctionner immédiatement.")) return;
    setLoading(true);
    await fetch("/api/settings/api-token", { method: "DELETE" });
    setStatus({ exists: false, createdAt: null, lastUsedAt: null });
    setNewToken(null);
    setLoading(false);
  }

  function copy() {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-2xl p-8" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,10,14,0.07)" }}>
      <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-playfair)", color: "var(--foreground)" }}>
        Token API
      </h2>
      <p className="text-sm mb-6" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
        Permet d&apos;appeler les APIs (/api/wines, /api/vintages…) depuis l&apos;extérieur, en ajoutant l&apos;en-tête{" "}
        <code style={{ background: "var(--surface-2)", padding: "1px 5px", borderRadius: 4 }}>Authorization: Bearer &lt;token&gt;</code>.
        Utile pour piloter les données par un agent.
      </p>

      {newToken && (
        <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(192,25,59,0.06)", border: "1px solid rgba(192,25,59,0.25)" }}>
          <p className="text-xs font-semibold mb-2" style={{ fontFamily: "var(--font-inter)", color: "var(--wine-red)" }}>
            Ce token ne sera plus jamais affiché — copie-le maintenant.
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 text-xs px-3 py-2 rounded-lg break-all"
              style={{ background: "var(--surface-2)", fontFamily: "monospace", color: "var(--foreground)" }}
            >
              {newToken}
            </code>
            <button
              onClick={copy}
              className="text-xs px-3 py-2 rounded-lg font-medium shrink-0 transition-opacity hover:opacity-90"
              style={{ background: "var(--wine-red)", color: "#fff", fontFamily: "var(--font-inter)" }}
            >
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
        </div>
      )}

      {status && (
        <p className="text-sm mb-4" style={{ fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}>
          {status.exists
            ? `Token actif${status.createdAt ? " · généré le " + new Date(status.createdAt).toLocaleDateString("fr-FR") : ""}`
            : "Aucun token configuré."}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={generate}
          disabled={loading}
          className="px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: "var(--wine-red)", color: "white", fontFamily: "var(--font-inter)" }}
        >
          {status?.exists ? "Régénérer" : "Générer un token"}
        </button>
        {status?.exists && (
          <button
            onClick={revoke}
            disabled={loading}
            className="px-5 py-2.5 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ border: "1.5px solid var(--border)", fontFamily: "var(--font-inter)", color: "var(--text-muted)" }}
          >
            Révoquer
          </button>
        )}
      </div>
    </section>
  );
}
