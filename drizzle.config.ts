import { config } from "dotenv";
config();

import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema/index.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} as Config;
