import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from 'node:url';

const dbPath = process.env.DATABASE_URL?.replace("file:", "") ?? "./data/timekeeper.sqlite";

function resolveMigrationsDir() {
  const candidates = [
    path.resolve(process.cwd(), 'apps/api/migrations'),
    path.resolve(process.cwd(), 'migrations'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations')
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }

  throw new Error(`Migrations directory not found. Tried: ${candidates.join(', ')}`);
}

const migrationsDir = resolveMigrationsDir();

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.exec("PRAGMA foreign_keys = ON;");

db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);`);

const appliedRows = db.prepare("SELECT version FROM schema_migrations").all() as Array<{version: string}>;
const applied = new Set(appliedRows.map((r) => r.version));

const files = fs.readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b));

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
  const tx = db.transaction(() => {
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations(version, applied_at) VALUES(?, ?)")
      .run(file, new Date().toISOString());
  });
  tx();
  console.log(`Applied migration: ${file}`);
}

console.log("Migrations up to date.");
