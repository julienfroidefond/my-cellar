export type MaturityPhase = "too-early" | "soon" | "ready" | "nearing-end" | "past";

export function getMaturityPhase(from: number, until: number, currentYear: number): MaturityPhase {
  if (currentYear > until) return "past";
  if (currentYear >= until - 2) return "nearing-end";
  if (currentYear >= from) return "ready";
  if (currentYear >= from - 2) return "soon";
  return "too-early";
}
