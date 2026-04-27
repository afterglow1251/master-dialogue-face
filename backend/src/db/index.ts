import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.ts";
import { config } from "../config.ts";

const client = postgres(config.databaseUrl);

export const db = drizzle(client, { schema });
