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
