import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import * as schema from "./schema";

const DDL = `
CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, lc TEXT, cf TEXT, daily_goal INTEGER NOT NULL DEFAULT 3, freezes_per_month INTEGER NOT NULL DEFAULT 2, last_sync INTEGER);
CREATE TABLE IF NOT EXISTS problems (id TEXT PRIMARY KEY, platform TEXT NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL, difficulty TEXT, rating INTEGER, tags TEXT NOT NULL DEFAULT '[]', paid INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS progress (problem_id TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0, solved_at INTEGER, review_count INTEGER NOT NULL DEFAULT 0, last_review_at INTEGER);
CREATE TABLE IF NOT EXISTS activity (day TEXT NOT NULL, platform TEXT NOT NULL, count INTEGER NOT NULL, PRIMARY KEY (day, platform));
CREATE TABLE IF NOT EXISTS snapshots (day TEXT NOT NULL, platform TEXT NOT NULL, total INTEGER NOT NULL, easy INTEGER NOT NULL DEFAULT 0, medium INTEGER NOT NULL DEFAULT 0, hard INTEGER NOT NULL DEFAULT 0, rating INTEGER, PRIMARY KEY (day, platform));
CREATE TABLE IF NOT EXISTS ratings (contest_id INTEGER PRIMARY KEY, name TEXT NOT NULL, at INTEGER NOT NULL, rating INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS recs (day TEXT NOT NULL, problem_id TEXT NOT NULL, score REAL NOT NULL, why TEXT NOT NULL, kind TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, problem_id));
CREATE TABLE IF NOT EXISTS notes (problem_id TEXT PRIMARY KEY, text TEXT NOT NULL DEFAULT '', revisit INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS badges (id TEXT PRIMARY KEY, earned_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires_at INTEGER);
CREATE INDEX IF NOT EXISTS problems_platform ON problems(platform);
`;

function open() {
  mkdirSync("data", { recursive: true });
  const sqlite = new Database("data/grindlog.db", { timeout: 10_000 });
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(DDL);
  return drizzle(sqlite, { schema });
}

const g = globalThis as unknown as { __db?: ReturnType<typeof open> };
export const db = (g.__db ??= open());
export * from "./schema";
