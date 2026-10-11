import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Base SQLite dédiée aux tests, créée hors du dépôt (dossier temporaire).
// On l'expose via l'environnement pour que `lib/db.ts` (via DB_PATH) et le
// global setup (via TEST_DB_PATH) pointent vers le même fichier.
const TEST_DB_PATH = join(tmpdir(), "my-cellar-vitest", "cellar.db");
const TEST_DB_URL = `file:${TEST_DB_PATH}`;
process.env.TEST_DB_PATH = TEST_DB_PATH;
process.env.TEST_DB_URL = TEST_DB_URL;

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "test/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    setupFiles: ["./test/setup.ts"],
    // Les tests d'intégration partagent une même base SQLite : on les exécute en série.
    fileParallelism: false,
    env: {
      DB_PATH: TEST_DB_PATH,
      DATABASE_URL: TEST_DB_URL,
      AUTH_SECRET: "test-secret",
      AUTH_PASSWORD: "test-password",
      NODE_ENV: "test",
    },
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/**/*.test.ts"],
    },
  },
});
