"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, LoaderCircle, Pencil, Plus, Ruler, Trash2, X } from "lucide-react";
import {
  MAX_RACK_COLS,
  MAX_RACK_LEVELS,
  capacityForConfig,
  defaultRackConfig,
  depthForConfig,
  heightForConfig,
  isUniformConfig,
  numColsForConfig,
} from "@/lib/rack-configs";
import type { LevelConfig, RackData } from "./types";

type Draft = {
  id: string | null;
  name: string;
  levels: LevelConfig[];
};

type DeleteTarget = { id: string; name: string; bottles: number };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value) || min));

export function CellarDesigner({
  racks,
  initialRackId,
  onClose,
  onChanged,
}: {
  racks: RackData[];
  initialRackId?: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const initialRack = initialRackId ? racks.find((rack) => rack.id === initialRackId) : undefined;
  const [form, setForm] = useState<Draft | null>(() => {
    if (!initialRack) return null;
    const levels = initialRack.config.levels.length > 0 ? initialRack.config.levels : defaultRackConfig().levels;
    return {
      id: initialRack.id,
      name: initialRack.name,
      levels: levels.map((level) => ({ ...level })),
    };
  });
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState("");
  const [overflow, setOverflow] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!initialRackId) return;
    formRef.current?.scrollIntoView({ block: "start" });
  }, [initialRackId]);

  function startCreate() {
    setError("");
    setOverflow(null);
    setDeleteTarget(null);
    setForm({ id: null, name: "", levels: defaultRackConfig().levels });
  }

  function startEdit(rack: RackData) {
    setError("");
    setOverflow(null);
    setDeleteTarget(null);
    const levels = rack.config.levels.length > 0 ? rack.config.levels : defaultRackConfig().levels;
    setForm({
      id: rack.id,
      name: rack.name,
      levels: levels.map((level) => ({ ...level })),
    });
  }

  /** Ajoute/retire des étagères par le haut, comme la liste du formulaire. */
  function setHeight(next: number) {
    if (!form) return;
    const target = clamp(next, 1, MAX_RACK_LEVELS);
    if (target === form.levels.length) return;

    if (target > form.levels.length) {
      const template = form.levels[0] ?? { front: 4, back: 4 };
      const added = Array.from({ length: target - form.levels.length }, () => ({ ...template }));
      setForm({ ...form, levels: [...added, ...form.levels] });
    } else {
      setForm({ ...form, levels: form.levels.slice(form.levels.length - target) });
    }
  }

  /** Applique la largeur à toutes les étagères, en conservant la présence d'une rangée arrière. */
  function setWidth(next: number) {
    if (!form) return;
    const width = clamp(next, 1, MAX_RACK_COLS);
    setForm({
      ...form,
      levels: form.levels.map((level) => ({
        front: width,
        back: level.back > 0 ? width : 0,
      })),
    });
  }

  function setDepth(depth: 1 | 2) {
    if (!form) return;
    setForm({
      ...form,
      levels: form.levels.map((level) => ({
        ...level,
        back: depth === 2 ? level.front : 0,
      })),
    });
  }

  function updateLevel(index: number, patch: Partial<LevelConfig>) {
    if (!form) return;
    setForm({
      ...form,
      levels: form.levels.map((level, levelIndex) =>
        levelIndex === index ? { ...level, ...patch } : level,
      ),
    });
  }

  async function save(options?: { unrackOverflow?: boolean }) {
    if (!form) return;
    setPending("save");
    setError("");
    setOverflow(null);

    let res: Response;
    try {
      res = await fetch(form.id ? `/api/racks/${form.id}` : "/api/racks", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          layout: form.levels,
          ...options,
        }),
      });
    } catch {
      setPending(null);
      setError("Erreur réseau");
      return;
    }

    const json = await res.json().catch(() => ({}));
    if (res.status === 409 && typeof json.overflow === "number") {
      setPending(null);
      setOverflow(json.overflow);
      return;
    }
    if (!res.ok) {
      setPending(null);
      setError(typeof json.error === "string" ? json.error : "Erreur serveur");
      return;
    }

    setPending(null);
    setForm(null);
    onChanged();
  }

  async function remove(id: string) {
    setPending("delete");
    setError("");

    let res: Response;
    try {
      res = await fetch(`/api/racks/${id}`, { method: "DELETE" });
    } catch {
      setPending(null);
      setError("Erreur réseau");
      return;
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPending(null);
      setError(typeof json.error === "string" ? json.error : "Erreur serveur");
      return;
    }

    setPending(null);
    setDeleteTarget(null);
    onChanged();
  }

  const formCols = form ? Math.max(...form.levels.map((level) => Math.max(level.front, level.back)), 1) : 0;
  const capacity = form ? form.levels.reduce((total, level) => total + level.front + level.back, 0) : 0;
  let depthMode: 1 | 2 | null = 1;
  if (form) {
    if (form.levels.some((level) => level.back > 0)) {
      depthMode = form.levels.every((level) => level.back === level.front) ? 2 : null;
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cellar-designer-title"
    >
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div className="sheet relative z-[var(--z-modal)] flex max-h-[88dvh] w-full flex-col overflow-hidden sm:max-w-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 pb-4 pt-5">
          <div>
            <p className="eyebrow">Design de la cave</p>
            <h2 id="cellar-designer-title" className="text-title">
              Casiers & dimensions
            </h2>
            <p className="mt-1 text-sm text-muted">
              Hauteur, largeur, profondeur et nombre de bouteilles s’appliquent au plan et à la vue 3D.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon -mr-2 -mt-1 shrink-0"
            aria-label="Fermer"
          >
            <X />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {error && (
            <p role="alert" className="mb-3 rounded-[var(--radius-md)] bg-[var(--wine-tint)] px-3 py-2 text-sm text-wine-deep">
              {error}
            </p>
          )}

          <ul className="space-y-2">
            {racks.map((rack) => {
              const height = heightForConfig(rack.config);
              const width = numColsForConfig(rack.config);
              const depth = depthForConfig(rack.config);
              const total = capacityForConfig(rack.config);
              const occupied = rack.wines.reduce((sum, wine) => sum + wine.quantity, 0);
              const isEditing = form?.id === rack.id;

              return (
                <li key={rack.id} className={`rounded-[var(--radius-md)] border p-3 ${isEditing ? "border-wine-red/40 bg-[var(--wine-tint)]" : "border-border bg-surface"}`}>
                  <div className="flex items-center gap-3">
                    <span className="badge h-8 min-w-9 rounded-lg bg-ink text-sm text-background">
                      {rack.name}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {height} étagère{height > 1 ? "s" : ""} · {width} de large · {depth} de profondeur
                      </p>
                      <p className="mt-0.5 text-xs text-muted tabular">
                        {occupied} / {total} bouteilles
                        {!isUniformConfig(rack.config) && " · disposition irrégulière"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(rack)}
                      className="btn btn-ghost btn-icon shrink-0"
                      aria-label={`Modifier le casier ${rack.name}`}
                      aria-pressed={isEditing}
                    >
                      <Pencil />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteTarget({ id: rack.id, name: rack.name, bottles: occupied });
                        setForm(null);
                        setError("");
                      }}
                      className="btn btn-ghost btn-icon shrink-0 text-wine-deep"
                      aria-label={`Supprimer le casier ${rack.name}`}
                    >
                      <Trash2 />
                    </button>
                  </div>

                  {deleteTarget?.id === rack.id && (
                    <div className="mt-3 rounded-[var(--radius-sm)] border border-wine-red/30 bg-surface p-3">
                      <p className="text-sm font-medium">Supprimer le casier {rack.name} ?</p>
                      <p className="mt-0.5 text-sm text-muted">
                        {deleteTarget.bottles > 0
                          ? `${deleteTarget.bottles} bouteille${deleteTarget.bottles > 1 ? "s" : ""} repasseront « à ranger ». Le stock n’est pas modifié.`
                          : "Le casier est vide."}
                      </p>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(null)}
                          disabled={pending === "delete"}
                          className="btn btn-secondary btn-sm"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(deleteTarget.id)}
                          disabled={pending === "delete"}
                          className="btn btn-danger btn-sm"
                        >
                          {pending === "delete" ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {racks.length === 0 && (
            <p className="rounded-[var(--radius-md)] border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted">
              Aucun casier. Ajoutez le premier pour dessiner votre cave.
            </p>
          )}

          {form ? (
            <form
              ref={formRef}
              className="mt-4 rounded-[var(--radius-md)] border border-border bg-surface-2 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-display text-lg font-semibold">
                  {form.id ? "Modifier le casier" : "Nouveau casier"}
                </h3>
                <button
                  type="button"
                  onClick={() => { setForm(null); setOverflow(null); setError(""); }}
                  className="btn btn-ghost btn-icon -mr-2 shrink-0"
                  aria-label="Fermer le formulaire"
                >
                  <X />
                </button>
              </div>

              {!isUniformConfig({ levels: form.levels }) && (
                <p className="mb-3 rounded-[var(--radius-sm)] bg-surface px-3 py-2 text-xs text-muted">
                  Les étagères ont des tailles différentes. Ajustez-les étagère par étagère ci-dessous.
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="block text-sm">
                  <span className="label">Nom du casier</span>
                  <input
                    autoFocus
                    type="text"
                    required
                    maxLength={30}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Ex. 6B"
                    className="input mt-1"
                  />
                </label>

                <div className="text-sm">
                  <span className="label">Profondeur</span>
                  <div className="segmented mt-1" role="group" aria-label="Profondeur du casier">
                    {([1, 2] as const).map((depth) => (
                      <button
                        key={depth}
                        type="button"
                        onClick={() => setDepth(depth)}
                        aria-pressed={depthMode === depth}
                      >
                        {depth} rangée{depth > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                  {depthMode === null && (
                    <p className="mt-1 text-xs text-muted">Variable selon les étagères.</p>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="label">Hauteur (étagères)</span>
                  <input
                    type="number"
                    min={1}
                    max={MAX_RACK_LEVELS}
                    value={form.levels.length}
                    onChange={(event) => setHeight(Number(event.target.value))}
                    className="input mt-1 tabular"
                  />
                </label>
                <label className="block text-sm">
                  <span className="label">Largeur (bouteilles)</span>
                  <input
                    type="number"
                    min={1}
                    max={MAX_RACK_COLS}
                    value={formCols}
                    onChange={(event) => setWidth(Number(event.target.value))}
                    className="input mt-1 tabular"
                  />
                </label>
              </div>
              <p className="mt-1 text-xs text-muted">
                La largeur s’applique à toutes les étagères. Les étagères sont ajoutées ou retirées par le haut.
              </p>

              <div className="mt-4 rounded-[var(--radius-sm)] border border-border bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Étagères (haut → bas)</p>
                  <p className="text-xs text-muted">Avant / arrière</p>
                </div>
                <div className="mt-2 space-y-1.5">
                  {form.levels.map((level, index) => {
                    const shelfNumber = form.levels.length - index;
                    return (
                      <div
                        key={index}
                        className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2"
                      >
                        <span className="w-20 text-xs text-muted tabular">Étagère {shelfNumber}</span>
                        <label className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted">Avant</span>
                          <input
                            type="number"
                            min={1}
                            max={MAX_RACK_COLS}
                            value={level.front}
                            onChange={(event) =>
                              updateLevel(index, {
                                front: clamp(Number(event.target.value), 1, MAX_RACK_COLS),
                              })
                            }
                            className="input h-8 px-2 py-1 text-sm tabular"
                            aria-label={`Étagère ${shelfNumber}, bouteilles avant`}
                          />
                        </label>
                        <label className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted">Arrière</span>
                          <input
                            type="number"
                            min={0}
                            max={MAX_RACK_COLS}
                            value={level.back}
                            onChange={(event) =>
                              updateLevel(index, {
                                back: clamp(Number(event.target.value), 0, MAX_RACK_COLS),
                              })
                            }
                            className="input h-8 px-2 py-1 text-sm tabular"
                            aria-label={`Étagère ${shelfNumber}, bouteilles arrière`}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-[var(--radius-sm)] border border-border bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <Ruler className="h-4 w-4 text-muted" aria-hidden="true" />
                    Aperçu
                  </p>
                  <p className="text-sm font-semibold tabular">
                    {capacity} bouteille{capacity > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="mt-2 space-y-1">
                  {form.levels.map((level, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-1">
                      <span className="w-5 text-[10px] text-muted tabular">
                        {form.levels.length - index}
                      </span>
                      {Array.from({ length: level.front }, (_, col) => (
                        <span
                          key={`front-${index}-${col}`}
                          className="h-2 w-2 rounded-full bg-wine-red/70"
                          aria-hidden="true"
                        />
                      ))}
                      {Array.from({ length: level.back }, (_, col) => (
                        <span
                          key={`back-${index}-${col}`}
                          className="h-2 w-2 rounded-full border border-wine-red/40"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">
                  {form.levels.length} étagère{form.levels.length > 1 ? "s" : ""} · {capacity}{" "}
                  emplacement{capacity > 1 ? "s" : ""}. La rangée arrière apparaît en creux.
                </p>
              </div>

              {overflow !== null && (
                <div role="alert" className="mt-3 rounded-[var(--radius-sm)] border border-wine-red/30 bg-[var(--wine-tint)] p-3 text-sm">
                  <p className="font-medium text-wine-deep">
                    Réduire ce casier libère {overflow} bouteille{overflow > 1 ? "s" : ""} actuellement rangée{overflow > 1 ? "s" : ""}.
                  </p>
                  <p className="mt-0.5 text-muted">Elles repasseront « à ranger », sans toucher au stock.</p>
                  <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setOverflow(null)} className="btn btn-secondary btn-sm">
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => save({ unrackOverflow: true })}
                      disabled={pending === "save"}
                      className="btn btn-primary btn-sm"
                    >
                      Remettre à ranger
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setForm(null); setOverflow(null); setError(""); }}
                  disabled={pending === "save"}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" disabled={pending === "save" || form.name.trim().length === 0} className="btn btn-primary">
                  {pending === "save" ? <LoaderCircle className="animate-spin" /> : <Check />}
                  {form.id ? "Enregistrer" : "Créer le casier"}
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={startCreate} className="btn btn-secondary mt-4 w-full">
              <Plus />
              Ajouter un casier
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
