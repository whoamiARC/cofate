import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export async function ensureSchema() {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }

  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS worlds (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      vibe TEXT NOT NULL,
      prompt TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY NOT NULL,
      world_id TEXT NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      identity TEXT NOT NULL,
      joined_at INTEGER NOT NULL,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      world_id TEXT NOT NULL,
      participant_id TEXT,
      author TEXT NOT NULL,
      kind TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
    )`),
    env.DB.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS worlds_code_unique ON worlds(code)"
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS participants_world_idx ON participants(world_id, joined_at)"
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS messages_world_idx ON messages(world_id, created_at)"
    ),
  ]);
}
