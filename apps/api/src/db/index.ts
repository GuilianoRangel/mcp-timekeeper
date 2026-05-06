import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";

const dbPath = process.env.DATABASE_URL?.replace("file:", "") ?? "./data/timekeeper.sqlite";
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

export function nowIso(): string {
  return new Date().toISOString();
}
