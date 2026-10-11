import { describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";

import { loginAction, logoutAction } from "@/app/actions/auth";

import { formData } from "../factories";
import { cookieJar, setSessionCookie } from "../mocks/cookies";
import { expectRedirectTo } from "../redirect";

const redirectMock = vi.mocked(redirect);

describe("loginAction", () => {
  it("refuse un mauvais mot de passe sans ouvrir de session", async () => {
    await expectRedirectTo(() => loginAction(formData({ password: "mauvais" })), "/login?error=1");

    expect(cookieJar.has("session")).toBe(false);
    expect(redirectMock).toHaveBeenCalledWith("/login?error=1");
  });

  it("ouvre la session et redirige vers l'accueil", async () => {
    await expectRedirectTo(() => loginAction(formData({ password: "test-password" })), "/");

    expect(cookieJar.get("session")).toBe("test-secret");
  });
});

describe("logoutAction", () => {
  it("supprime le cookie de session", async () => {
    setSessionCookie();

    await expectRedirectTo(() => logoutAction(), "/login");

    expect(cookieJar.has("session")).toBe(false);
  });
});
