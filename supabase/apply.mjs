import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL belum di-set.");
  process.exit(1);
}

const files = [
  "migrations/0001_schema.sql",
  "migrations/0002_functions.sql",
  "migrations/0003_rls.sql",
  "seed.sql",
];

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  for (const f of files) {
    const sql = await readFile(join(__dirname, f), "utf8");
    process.stdout.write(`Menjalankan ${f} ... `);
    await client.query(sql);
    console.log("OK");
  }
  console.log("Semua migration berhasil diterapkan.");
} catch (err) {
  console.error("\nGAGAL:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
