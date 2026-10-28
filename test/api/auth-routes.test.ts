import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { POST as LOGIN } from "@/app/api/auth/login/route";
import { POST as LOGOUT } from "@/app/api/auth/logout/route";

import { cookieJar } from "../mocks/cookies";

const loginRequest = (body: unknown) =>
  new NextRequest("http://test/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    cookieJar.clear();
  });

  it("pose le cookie de session pour le bon mot de passe", async () => {
    const res = await LOGIN(loginRequest({ password: process.env.AUTH_PASSWORD }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(cookieJar.get("session")).toBe(process.env.AUTH_SECRET);
  });

  it("refuse un mot de passe incorrect sans poser de cookie", async () => {
    const res = await LOGIN(loginRequest({ password: "mauvais" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Mot de passe incorrect" });
    expect(cookieJar.has("session")).toBe(false);
  });

  it("refuse l'absence de mot de passe", async () => {
    const res = await LOGIN(loginRequest({}));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("supprime le cookie de session", async () => {
    cookieJar.set("session", "peu-importe");

    const res = await LOGOUT();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(cookieJar.has("session")).toBe(false);
  });
});
