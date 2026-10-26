"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Ban, Check, Copy, KeyRound, RefreshCw, type LucideIcon } from "lucide-react";

type TokenStatus = { exists: boolean; createdAt: string | null; lastUsedAt: string | null };

/**
 * Ligne de réglage : icône, titre et description à gauche, action à droite
 * (empilée sous le texte sur mobile). Partagée par les sections de la page Données.
 */
export function SettingsRow({
  icon: Icon,
  title,
  titleId,
  description,
  action,
  children,
}: {
  icon: LucideIcon;
  title: ReactNode;
  titleId?: string;
  description: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-foreground sm:flex">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-display text-lg font-semibold">
            {title}
          </h2>
          <div className="mt-1 text-sm text-muted">{description}</div>
        </div>
        {action && <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">{action}</div>}
      </div>
      {children && <div className="mt-5 sm:pl-[3.75rem]">{children}</div>}
    </div>
  );
}

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
    <SettingsRow
      icon={KeyRound}
      title="Token API"
      description={
        <>
          Appelle les APIs (<code className="font-mono text-[0.8125rem]">/api/wines</code>,{" "}
          <code className="font-mono text-[0.8125rem]">/api/vintages</code>…) depuis l&apos;extérieur avec l&apos;en-tête{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.8125rem] text-foreground">
            Authorization: Bearer &lt;token&gt;
          </code>
          . Utile pour piloter la cave depuis un agent.
        </>
      }
      action={
        <>
          {status?.exists && (
            <button type="button" onClick={revoke} disabled={loading} className="btn btn-ghost order-last sm:order-none">
              <Ban />
              Révoquer
            </button>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className={`btn ${status?.exists ? "btn-secondary" : "btn-primary"}`}
          >
            {status?.exists ? <RefreshCw /> : <KeyRound />}
            {status?.exists ? "Régénérer" : "Générer un token"}
          </button>
        </>
      }
    >
      {status && (
        <p className="flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${status.exists ? "bg-success" : "bg-border-strong"}`}
          />
          <span className={status.exists ? "font-medium" : "text-muted"}>
            {status.exists
              ? `Token actif${status.createdAt ? " · généré le " + new Date(status.createdAt).toLocaleDateString("fr-FR") : ""}`
              : "Aucun token configuré."}
          </span>
        </p>
      )}

      {newToken && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-[rgba(192,25,59,0.3)] bg-[var(--wine-tint)] p-4">
          <p className="text-sm font-semibold text-wine-deep">
            Ce token ne sera plus jamais affiché : copie-le maintenant.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <code className="flex-1 break-all rounded-lg bg-surface px-3 py-2.5 font-mono text-xs">
              {newToken}
            </code>
            <button type="button" onClick={copy} className="btn btn-primary shrink-0">
              {copied ? <Check /> : <Copy />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
        </div>
      )}
    </SettingsRow>
  );
}
