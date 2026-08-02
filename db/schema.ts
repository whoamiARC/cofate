import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
}, (table) => [
  uniqueIndex("session_choice_unique")
    .on(table.sessionId, table.memberId, table.turn, table.kind)
    .where(sql`${table.kind} = 'choice'`),
]);

export const dailyCustomUsage = sqliteTable("daily_custom_usage", {
  deviceId: text("device_id").notNull(),
  usageDay: text("usage_day").notNull(),
  count: integer("count").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [primaryKey({ columns: [table.deviceId, table.usageDay] })]);

export const playerProfiles = sqliteTable("player_profiles", {
  deviceId: text("device_id").primaryKey(),
  displayName: text("display_name").notNull(),
  xp: integer("xp").notNull().default(0),
  points: integer("points").notNull().default(0),
  gamesPlayed: integer("games_played").notNull().default(0),
  goalsCompleted: integer("goals_completed").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const sessionMemberProfiles = sqliteTable("session_member_profiles", {
  memberId: text("member_id")
    .primaryKey()
    .references(() => sessionMembers.id, { onDelete: "cascade" }),
  deviceId: text("device_id")
    .notNull()
    .references(() => playerProfiles.deviceId, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const sessionResults = sqliteTable("session_results", {
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  memberId: text("member_id")
    .notNull()
    .references(() => sessionMembers.id, { onDelete: "cascade" }),
  resultJson: text("result_json").notNull(),
  xpEarned: integer("xp_earned").notNull(),
  pointsEarned: integer("points_earned").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [primaryKey({ columns: [table.sessionId, table.memberId] })]);

export const sessionRoleClaims = sqliteTable("session_role_claims", {
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull(),
  memberId: text("member_id")
    .notNull()
    .unique()
    .references(() => sessionMembers.id, { onDelete: "cascade" }),
  selectedAt: integer("selected_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [primaryKey({ columns: [table.sessionId, table.roleId] })]);
