import { describe, expect, it } from "vitest";

import { generateApiToken, hashApiToken } from "./api-token";

describe("generateApiToken", () => {
  it("génère un jeton hexadécimal de 64 caractères (32 octets)", () => {
    const token = generateApiToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("génère des jetons différents à chaque appel", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateApiToken()));
    expect(tokens.size).toBe(50);
  });
});

describe("hashApiToken", () => {
  it("calcule un SHA-256 hexadécimal déterministe", () => {
    expect(hashApiToken("test")).toBe(
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    );
    expect(hashApiToken("test")).toBe(hashApiToken("test"));
  });

  it("produit toujours 64 caractères hexadécimaux", () => {
    expect(hashApiToken("")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashApiToken(generateApiToken())).toMatch(/^[0-9a-f]{64}$/);
  });

  it("donne des empreintes différentes pour des jetons différents", () => {
    expect(hashApiToken("a")).not.toBe(hashApiToken("b"));
  });
});
