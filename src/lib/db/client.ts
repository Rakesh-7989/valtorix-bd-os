import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

type DbType = ReturnType<typeof drizzle>;

/**
 * Neon + Drizzle database client.
 *
 * The DATABASE_URL environment variable must be set on the server.
 * This module is server-side only — never import DATABASE_URL into client components.
 *
 * Connection is lazy: the client is created on first use, not at import time.
 * This allows the production build to succeed even when DATABASE_URL is not set
 * (e.g., during static prerendering of pages that don't touch the database).
 */

let cachedDb: DbType | null = null;

export function getDb(): DbType {
  if (cachedDb) {
    return cachedDb;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not defined. Create a Neon project and add DATABASE_URL to .env.local",
    );
  }

  const sql = neon(connectionString);
  cachedDb = drizzle(sql, { schema });

  return cachedDb;
}

/**
 * Lazily-initialized database client.
 *
 * Use `import { db } from "@/lib/db/client"` in server components and API routes.
 * The actual connection is established on first use via getDb().
 */
export const db = new Proxy({} as DbType, {
  get: (_, prop) => getDb()[prop as keyof DbType],
});
