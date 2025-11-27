import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  console.log("🔴 can`t find the database");
} else {
  console.log("🟢 db connected");
}

export default {
  dialect: "postgresql",
  schema: "./src/lib/supabase/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
} satisfies Config;
