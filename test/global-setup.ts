import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";

/** Crée un schéma SQLite propre avant la suite de tests. */
export default function globalSetup() {
  const dbPath = process.env.TEST_DB_PATH;
  const dbUrl = process.env.TEST_DB_URL;
  if (!dbPath || !dbUrl) throw new Error("TEST_DB_PATH/TEST_DB_URL manquants");

  mkdirSync(dirname(dbPath), { recursive: true });
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    rmSync(`${dbPath}${suffix}`, { force: true });
  }

  execFileSync("npx", ["prisma", "db", "push", "--url", dbUrl, "--accept-data-loss"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
}
