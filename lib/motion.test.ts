import { afterEach, describe, expect, it, vi } from "vitest";

import { motion, prefersReducedMotion } from "@/lib/motion";

describe("prefersReducedMotion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renvoie false hors navigateur (rendu serveur)", () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it("suit un système qui demande de réduire les animations", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    expect(prefersReducedMotion()).toBe(true);
  });

  it("renvoie false quand le système autorise les animations", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe("motion", () => {
  it("garde des durées positives et croissantes du plus court au plus long", () => {
    const { fast, base, slow, bottle } = motion.duration;
    expect(fast).toBeGreaterThan(0);
    expect(fast).toBeLessThan(base);
    expect(base).toBeLessThan(slow);
    expect(slow).toBeLessThan(bottle);
  });
});
