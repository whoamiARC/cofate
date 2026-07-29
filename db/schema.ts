import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const worlds = sqliteTable("worlds", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  vibe: text("vibe").notNull(),
  prompt: text("prompt").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const participants = sqliteTable("participants", {
  id: text("id").primaryKey(),
  worldId: text("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  identity: text("identity").notNull(),
  joinedAt: integer("joined_at", { mode: "timestamp_ms" }).notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  worldId: text("world_id")
    .notNull()
    .references(() => worlds.id, { onDelete: "cascade" }),
  participantId: text("participant_id"),
  author: text("author").notNull(),
  kind: text("kind").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  theme: text("theme").notNull(),
  mode: text("mode").notNull(),
  status: text("status").notNull(),
  maxPlayers: integer("max_players").notNull(),
  hostMemberId: text("host_member_id").notNull(),
  worldJson: text("world_json"),
  turn: integer("turn").notNull(),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const sessionMembers = sqliteTable("session_members", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  playerToken: text("player_token").notNull().unique(),
  name: text("name").notNull(),
  roleJson: text("role_json"),
  isHost: integer("is_host", { mode: "boolean" }).notNull(),
  joinedAt: integer("joined_at", { mode: "timestamp_ms" }).notNull(),
  lastSeen: integer("last_seen", { mode: "timestamp_ms" }).notNull(),
});

export const sessionEntries = sqliteTable("session_entries", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  memberId: text("member_id"),
  turn: integer("turn").notNull(),
  kind: text("kind").notNull(),
  author: text("author").notNull(),
  content: text("content").notNull(),
  metaJson: text("meta_json"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
