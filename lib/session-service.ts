import { and, asc, desc, eq, or } from "drizzle-orm";
import { waitUntil } from "cloudflare:workers";
import { ensureSchema, getDb } from "../db";
import { sessionEntries, sessionMembers, sessions } from "../db/schema";
import { advanceWorld, generateWorld } from "./deepseek";
import { findScriptByTheme, getScriptPlan, getScriptStage } from "./script-catalog";
import type {
  RoleCard,
  SessionMode,
  SessionStatus,
  SessionView,
  WorldState,
} from "./session-types";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function makeToken() {
  return `${crypto.randomUUID()}-${crypto.randomUUID()}`;
}

export function safeJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function createSession(input: {
  name: string;
  theme: string;
  title?: string;
  mode: SessionMode;
  maxPlayers: number;
}) {
  await ensureSchema();
  const db = getDb();
  let code = makeCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const [existing] = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.code, code)).limit(1);
    if (!existing) break;
    code = makeCode();
  }
  const sessionId = crypto.randomUUID();
  const memberId = crypto.randomUUID();
  const playerToken = makeToken();
  const now = new Date();
  await db.batch([
    db.insert(sessions).values({
      id: sessionId,
      code,
      title: input.title?.trim().slice(0, 32) || "等待生成的世界",
      theme: input.theme.trim().slice(0, 300) || "熟悉空间里悄然改变的规则",
      mode: input.mode,
      status: "waiting",
      maxPlayers: Math.max(2, Math.min(input.maxPlayers, 8)),
      hostMemberId: memberId,
      worldJson: null,
      turn: 0,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    }),
    db.insert(sessionMembers).values({
      id: memberId,
      sessionId,
      playerToken,
      name: input.name.trim().slice(0, 16),
      roleJson: null,
      isHost: true,
      joinedAt: now,
      lastSeen: now,
    }),
    db.insert(sessionEntries).values({
      id: crypto.randomUUID(),
      sessionId,
      memberId: null,
      turn: 0,
      kind: "system",
      author: "因果",
      content: input.mode === "match" ? "匹配信号已经发出。另一个人正在靠近。" : "世界的入口已经建立，等待其他人到场。",
      metaJson: null,
      createdAt: now,
    }),
  ]);
  return { code, playerToken, sessionId, memberId };
}

export async function findSession(code: string) {
  await ensureSchema();
  const [session] = await getDb()
    .select()
    .from(sessions)
    .where(eq(sessions.code, code.trim().toUpperCase()))
    .limit(1);
  return session ?? null;
}

export async function findMember(sessionId: string, playerToken: string) {
  if (!playerToken) return null;
  const [member] = await getDb()
    .select()
    .from(sessionMembers)
    .where(and(eq(sessionMembers.sessionId, sessionId), eq(sessionMembers.playerToken, playerToken)))
    .limit(1);
  return member ?? null;
}

export async function addMember(sessionId: string, name: string, asHost = false) {
  const db = getDb();
  const memberId = crypto.randomUUID();
  const playerToken = makeToken();
  const now = new Date();
  await db.batch([
    db.insert(sessionMembers).values({
      id: memberId,
      sessionId,
      playerToken,
      name: name.trim().slice(0, 16),
      roleJson: null,
      isHost: asHost,
      joinedAt: now,
      lastSeen: now,
    }),
    db.insert(sessionEntries).values({
      id: crypto.randomUUID(),
      sessionId,
      memberId: null,
      turn: 0,
      kind: "arrival",
      author: "因果",
      content: `${name.trim().slice(0, 16)} 进入了入口。`,
      metaJson: null,
      createdAt: now,
    }),
    db.update(sessions).set({ updatedAt: now }).where(eq(sessions.id, sessionId)),
  ]);
  return { memberId, playerToken };
}

export async function getSessionView(code: string, playerToken: string): Promise<SessionView | null> {
  const session = await findSession(code);
  if (!session) return null;
  const db = getDb();
  const me = await findMember(session.id, playerToken);
  if (me) {
    await db.update(sessionMembers).set({ lastSeen: new Date() }).where(eq(sessionMembers.id, me.id));
  }
  const [members, allEntries] = await Promise.all([
    db.select().from(sessionMembers).where(eq(sessionMembers.sessionId, session.id)).orderBy(asc(sessionMembers.joinedAt)),
    me
      ? db.select().from(sessionEntries).where(eq(sessionEntries.sessionId, session.id)).orderBy(asc(sessionEntries.createdAt)).limit(160)
      : Promise.resolve([]),
  ]);
  const chosen = new Set(
    allEntries
      .filter((entry) => entry.kind === "choice" && entry.turn === session.turn && entry.memberId)
      .map((entry) => entry.memberId)
  );
  const visibleEntries = allEntries.filter((entry) => entry.kind !== "private" || entry.memberId === me?.id);
  const world = me ? safeJson<WorldState | null>(session.worldJson, null) : null;
  return {
    code: session.code,
    title: session.title,
    theme: session.theme,
    mode: session.mode as SessionMode,
    status: session.status as SessionStatus,
    maxPlayers: session.maxPlayers,
    turn: session.turn,
    errorMessage: session.errorMessage,
    members: members.map((member) => ({
      id: member.id,
      name: member.name,
      isHost: member.isHost,
      hasChosen: chosen.has(member.id),
    })),
    me: me ? {
      id: me.id,
      name: me.name,
      isHost: me.isHost,
      role: safeJson<RoleCard | null>(me.roleJson, null),
    } : null,
    world,
    entries: visibleEntries.map((entry) => ({
      id: entry.id,
      memberId: entry.memberId,
      turn: entry.turn,
      kind: entry.kind as SessionView["entries"][number]["kind"],
      author: entry.author,
      content: entry.content,
      createdAt: entry.createdAt,
    })),
  };
}

export async function generateSessionWorld(sessionId: string) {
  const db = getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session) throw new Error("世界不存在");
  const members = await db.select().from(sessionMembers).where(eq(sessionMembers.sessionId, session.id)).orderBy(asc(sessionMembers.joinedAt));
  if (members.length < 2) throw new Error("至少需要两个人，世界才会显现。");

  try {
    const catalogScript = findScriptByTheme(session.theme);
    const draft = await generateWorld({
      theme: session.theme,
      members: members.map(({ name }) => ({ name })),
      userId: session.id.replaceAll("-", ""),
      script: catalogScript,
    });
    const plan = catalogScript?.plan ?? getScriptPlan(null);
    const openingStage = getScriptStage(catalogScript?.id, 1);
    const world: WorldState = {
      title: draft.title,
      premise: draft.premise,
      atmosphere: draft.atmosphere,
      scriptId: catalogScript?.id ?? null,
      stageTitle: openingStage.title,
      stageTask: openingStage.task,
      endingCondition: plan.endingCondition,
      maxTurns: plan.maxTurns,
      publicRules: draft.publicRules,
      clues: draft.clues,
      memory: draft.memory,
      nextPrompt: draft.nextPrompt,
      suggestedChoices: draft.suggestedChoices,
    };
    const now = new Date();
    const writes = members.map((member, index) => {
      const role = draft.roles[index];
      return db.update(sessionMembers).set({ roleJson: JSON.stringify({
        identity: role.identity,
        publicDescription: role.publicDescription,
        secretRule: role.secretRule,
        privateGoal: role.privateGoal,
      }) }).where(eq(sessionMembers.id, member.id));
    });
    await Promise.all(writes.map((write) => write.run()));
    await db.batch([
      db.insert(sessionEntries).values({
        id: crypto.randomUUID(),
        sessionId: session.id,
        memberId: null,
        turn: 1,
        kind: "narration",
        author: "因果",
        content: draft.opening,
        metaJson: null,
        createdAt: now,
      }),
      db.update(sessions).set({
        title: draft.title,
        worldJson: JSON.stringify(world),
        turn: 1,
        status: "active",
        errorMessage: null,
        updatedAt: now,
      }).where(eq(sessions.id, session.id)),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "世界生成失败";
    await db.update(sessions).set({ status: "error", errorMessage: message, updatedAt: new Date() }).where(eq(sessions.id, session.id));
    throw error;
  }
}

export async function submitChoice(input: {
  sessionId: string;
  memberId: string;
  content: string;
}) {
  const db = getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.id, input.sessionId)).limit(1);
  if (!session || session.status !== "active") throw new Error("现在还不能提交选择");
  const [member] = await db.select().from(sessionMembers).where(and(
    eq(sessionMembers.id, input.memberId),
    eq(sessionMembers.sessionId, session.id)
  )).limit(1);
  if (!member) throw new Error("参与者身份无效");
  const [existing] = await db.select({ id: sessionEntries.id }).from(sessionEntries).where(and(
    eq(sessionEntries.sessionId, session.id),
    eq(sessionEntries.memberId, member.id),
    eq(sessionEntries.turn, session.turn),
    eq(sessionEntries.kind, "choice")
  )).limit(1);
  if (existing) return { processing: false, duplicate: true };

  await db.insert(sessionEntries).values({
    id: crypto.randomUUID(),
    sessionId: session.id,
    memberId: member.id,
    turn: session.turn,
    kind: "choice",
    author: member.name,
    content: input.content.trim().slice(0, 360),
    metaJson: null,
    createdAt: new Date(),
  });
  const [members, choices] = await Promise.all([
    db.select().from(sessionMembers).where(eq(sessionMembers.sessionId, session.id)).orderBy(asc(sessionMembers.joinedAt)),
    db.select().from(sessionEntries).where(and(
      eq(sessionEntries.sessionId, session.id),
      eq(sessionEntries.turn, session.turn),
      eq(sessionEntries.kind, "choice")
    )).orderBy(asc(sessionEntries.createdAt)),
  ]);
  if (choices.length < members.length) return { processing: false, duplicate: false };

  const lock = await db.update(sessions).set({ status: "resolving", updatedAt: new Date() }).where(and(
    eq(sessions.id, session.id),
    eq(sessions.status, "active"),
    eq(sessions.turn, session.turn)
  )).run();
  if (!lock.meta.changes) return { processing: true, duplicate: false };

  waitUntil((async () => {
    try {
    const recent = await db.select().from(sessionEntries).where(eq(sessionEntries.sessionId, session.id)).orderBy(desc(sessionEntries.createdAt)).limit(12);
    const world = safeJson<WorldState>(session.worldJson, {
      title: session.title,
      premise: session.theme,
      atmosphere: "未知",
      publicRules: [],
      clues: [],
      memory: [],
      nextPrompt: "",
      suggestedChoices: [],
    });
    const turn = await advanceWorld({
      world,
      turn: session.turn,
      members: members.map((item) => ({ name: item.name, role: safeJson<RoleCard | null>(item.roleJson, null) })),
      choices: choices.map((item) => ({ name: item.author, content: item.content })),
      recentEntries: recent.reverse().map((item) => ({ author: item.author, content: item.content })),
      userId: session.id.replaceAll("-", ""),
    });
    const nextWorld: WorldState = {
      ...world,
      publicRules: turn.newRule ? [...world.publicRules, turn.newRule].slice(-8) : world.publicRules,
      clues: turn.newClue ? [...world.clues, turn.newClue].slice(-8) : world.clues,
      memory: [...world.memory, turn.memory].slice(-12),
      nextPrompt: turn.nextPrompt,
      suggestedChoices: turn.suggestedChoices,
    };
    const nextTurnNumber = session.turn + (turn.ended ? 0 : 1);
    const nextStage = getScriptStage(world.scriptId, nextTurnNumber);
    nextWorld.stageTitle = nextStage.title;
    nextWorld.stageTask = nextStage.task;
    nextWorld.endingCondition = getScriptPlan(world.scriptId).endingCondition;
    nextWorld.maxTurns = getScriptPlan(world.scriptId).maxTurns;
    const now = new Date();
    const privateEntries = turn.privateEchoes.flatMap((echo, index) => {
      const target = members.find((item) => item.name === echo.playerName) ?? members[index];
      if (!target) return [];
      return [db.insert(sessionEntries).values({
        id: crypto.randomUUID(),
        sessionId: session.id,
        memberId: target.id,
        turn: session.turn,
        kind: "private",
        author: "因果 · 私语",
        content: echo.content,
        metaJson: null,
        createdAt: new Date(now.getTime() + index + 1),
      })];
    });
    await db.batch([
      db.insert(sessionEntries).values({
        id: crypto.randomUUID(),
        sessionId: session.id,
        memberId: null,
        turn: session.turn,
        kind: "narration",
        author: "因果",
        content: turn.narration,
        metaJson: null,
        createdAt: now,
      }),
      ...privateEntries,
      db.update(sessions).set({
        worldJson: JSON.stringify(nextWorld),
        turn: session.turn + (turn.ended ? 0 : 1),
        status: turn.ended ? "ended" : "active",
        errorMessage: null,
        updatedAt: now,
      }).where(eq(sessions.id, session.id)),
    ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "因果暂时没有回应";
      await db.update(sessions).set({ status: "active", errorMessage: message, updatedAt: new Date() }).where(eq(sessions.id, session.id));
      throw error;
    }
  })());
  return { processing: true, duplicate: false };
}

export async function claimForGeneration(sessionId: string) {
  const result = await getDb().update(sessions).set({
    status: "generating",
    errorMessage: null,
    updatedAt: new Date(),
  }).where(and(
    eq(sessions.id, sessionId),
    or(eq(sessions.status, "waiting"), eq(sessions.status, "error"))
  )).run();
  return Boolean(result.meta.changes);
}
