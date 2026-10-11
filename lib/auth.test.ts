import { describe, expect, it } from "vitest";

import { setSessionCookie } from "../test/mocks/cookies";
import { requireSession } from "./auth";

describe("requireSession", () => {
  it("laisse passer une session dont le cookie correspond à AUTH_SECRET", async () => {
    setSessionCookie();
    await expect(requireSession()).resolves.toBeUndefined();
  });

  it("rejette l'absence de cookie", async () => {
    await expect(requireSession()).rejects.toThrow("Unauthorized");
  });

  it("rejette un cookie différent du secret", async () => {
    setSessionCookie("mauvais-secret");
    await expect(requireSession()).rejects.toThrow("Unauthorized");
  });

  it("rejette quand AUTH_SECRET n'est pas configuré", async () => {
    const original = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    try {
      setSessionCookie(original ?? "test-secret");
      await expect(requireSession()).rejects.toThrow("Unauthorized");
    } finally {
      process.env.AUTH_SECRET = original;
    }
  });
});
