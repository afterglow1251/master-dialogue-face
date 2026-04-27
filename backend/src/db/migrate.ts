import { migrate } from "drizzle-orm/postgres-js/migrator";

import { db } from "./index.ts";

async function runMigrations(): Promise<void> {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle/migrations" });
  console.log("Migrations complete.");
  process.exit(0);
}

runMigrations().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
