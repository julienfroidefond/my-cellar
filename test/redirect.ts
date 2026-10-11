import { expect } from "vitest";

/** Attend une redirection Next.js vers une URL précise. */
export async function expectRedirectTo(action: () => Promise<unknown>, url: string) {
  await expect(action()).rejects.toThrow(`NEXT_REDIRECT:${url}`);
}

/** Attend une redirection Next.js vers n'importe quelle URL. */
export async function expectRedirect(action: () => Promise<unknown>) {
  await expect(action()).rejects.toThrow(/NEXT_REDIRECT:/);
}
