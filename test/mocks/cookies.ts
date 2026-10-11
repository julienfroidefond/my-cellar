/**
 * Petit pot à cookies en mémoire, partagé entre le mock de `next/headers`
 * et les tests (pour (dé)poser la session).
 */
export const cookieJar = new Map<string, string>();

export function setSessionCookie(value = process.env.AUTH_SECRET ?? "test-secret") {
  cookieJar.set("session", value);
}

export function resetCookies() {
  cookieJar.clear();
}
