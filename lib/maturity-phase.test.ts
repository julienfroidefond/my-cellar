import { describe, expect, it } from "vitest";

import { getMaturityPhase } from "./maturity-phase";

describe("getMaturityPhase", () => {
  const from = 2010;
  const until = 2030;

  it("classe les années au-delà de la fenêtre comme « past »", () => {
    expect(getMaturityPhase(from, until, 2031)).toBe("past");
  });

  it("classe les 2 dernières années (bornes incluses) comme « nearing-end »", () => {
    expect(getMaturityPhase(from, until, 2030)).toBe("nearing-end");
    expect(getMaturityPhase(from, until, 2028)).toBe("nearing-end");
  });

  it("classe la pleine maturité comme « ready »", () => {
    expect(getMaturityPhase(from, until, 2027)).toBe("ready");
    expect(getMaturityPhase(from, until, 2010)).toBe("ready");
  });

  it("classe l'approche (2 ans avant) comme « soon »", () => {
    expect(getMaturityPhase(from, until, 2009)).toBe("soon");
    expect(getMaturityPhase(from, until, 2008)).toBe("soon");
  });

  it("classe les années trop précoces comme « too-early »", () => {
    expect(getMaturityPhase(from, until, 2007)).toBe("too-early");
  });
});
