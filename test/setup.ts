import { beforeEach, vi } from "vitest";

import { cookieJar, resetCookies } from "./mocks/cookies";

beforeEach(() => {
  vi.clearAllMocks();
  resetCookies();
});


// Next.js échafaude ses API (cache, navigation, cookies) sur des primitives
// serveur qu'on remplace par des versions inertes/contrôlables.

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  // Le vrai `redirect` interrompt le flux en levant : on reproduit ce comportement
  // pour que les tests respectent le même ordre d'exécution qu'en production.
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT:${url}`);
    (error as { digest?: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw error;
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
    has: (name: string) => cookieJar.has(name),
    getAll: (...names: string[]) => {
      const entries = [...cookieJar.entries()].map(([name, value]) => ({ name, value }));
      return names.length ? entries.filter((c) => names.includes(c.name)) : entries;
    },
  }),
}));
