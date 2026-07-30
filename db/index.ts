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
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      theme TEXT NOT NULL,
      mode TEXT NOT NULL,
      status TEXT NOT NULL,
      max_players INTEGER NOT NULL,
      host_member_id TEXT NOT NULL,
      world_json TEXT,
      turn INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS session_members (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      player_token TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role_json TEXT,
      is_host INTEGER NOT NULL DEFAULT 0,
      joined_at INTEGER NOT NULL,
      last_seen INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS session_entries (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      member_id TEXT,
      turn INTEGER NOT NULL,
      kind TEXT NOT NULL,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      meta_json TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    )`),
    env.DB.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS sessions_code_unique ON sessions(code)"
    ),
    env.DB.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS session_members_token_unique ON session_members(player_token)"
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS session_members_session_idx ON session_members(session_id, joined_at)"
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS session_entries_session_idx ON session_entries(session_id, created_at)"
    ),
    env.DB.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS session_choice_unique ON session_entries(session_id, member_id, turn, kind)"
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS sessions_match_idx ON sessions(mode, status, created_at)"
    ),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS request_limits (
      key TEXT PRIMARY KEY NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER NOT NULL
    )`),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS request_limits_expiry_idx ON request_limits(expires_at)"
    ),
  ]);
}
