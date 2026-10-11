import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "@/proxy";
import { hashApiToken } from "@/lib/api-token";
import { prisma } from "@/lib/db";

import { resetDatabase } from "./reset-db";

const BASE = "http://localhost";

function request(path: string, init?: { cookie?: string; authorization?: string }) {
  const headers = new Headers();
  if (init?.cookie) headers.set("cookie", init.cookie);
  if (init?.authorization) headers.set("authorization", init.authorization);
  return new NextRequest(`${BASE}${path}`, { headers });
}

describe("proxy (middleware d'authentification)", () => {
  beforeEach(resetDatabase);

  it("laisse passer une session valide", async () => {
    const res = await proxy(request("/api/wines", { cookie: "session=test-secret" }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("rejette une session invalide", async () => {
    const res = await proxy(request("/api/wines", { cookie: "session=mauvais" }));
    expect(res.status).toBe(401);
  });

  it("accepte un jeton d'API valide et met à jour lastUsedAt", async () => {
    const token = "jeton-de-test";
    await prisma.apiToken.create({ data: { tokenHash: hashApiToken(token) } });

    const res = await proxy(request("/api/wines", { authorization: `Bearer ${token}` }));

    expect(res.headers.get("x-middleware-next")).toBe("1");
    const stored = await prisma.apiToken.findFirst();
    expect(stored?.lastUsedAt).not.toBeNull();
  });

  it("rejette un jeton d'API inconnu", async () => {
    const res = await proxy(request("/api/wines", { authorization: "Bearer inconnu" }));
    expect(res.status).toBe(401);
  });

  it("renvoie 401 en JSON pour une route /api sans authentification", async () => {
    const res = await proxy(request("/api/wines"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("redirige vers /login pour une page sans authentification", async () => {
    const res = await proxy(request("/wines"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`${BASE}/login`);
  });
});
