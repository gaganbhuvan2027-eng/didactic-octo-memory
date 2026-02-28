#!/usr/bin/env node
/**
 * Run SQL migrations against Supabase Postgres.
 * Loads .env.local - requires DATABASE_URL (or SUPABASE_DB_URL / DIRECT_URL).
 * Get it from Supabase Dashboard > Project Settings > Database > Connection string (URI)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const MIGRATIONS = [
  "023_create_interview_reports.sql",
  "025_add_question_tracking_to_interview_results.sql",
  "026_add_question_count_to_interviews.sql",
];

async function main() {
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.DIRECT_URL;

  if (!dbUrl) {
    console.error(
      "Missing DATABASE_URL. Get it from Supabase Dashboard > Project Settings > Database > Connection string (URI)."
    );
    console.error(
      "Then run: DATABASE_URL=\"your-connection-string\" node scripts/run-migrations.js"
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  const scriptsDir = path.join(__dirname);

  try {
    await client.connect();
    console.log("Connected to database.");

    for (const file of MIGRATIONS) {
      const filePath = path.join(scriptsDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn("Skipping (not found):", file);
        continue;
      }
      const sql = fs.readFileSync(filePath, "utf8");
      try {
        await client.query(sql);
        console.log("Done:", file);
      } catch (err) {
        if (/already exists/i.test(err.message)) {
          console.log("SKIP (column already exists):", file);
        } else {
          throw err;
        }
      }
    }

    console.log("Migrations completed.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
