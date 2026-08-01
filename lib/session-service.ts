import { and, asc, desc, eq, or } from "drizzle-orm";
import { waitUntil } from "cloudflare:workers";
import { ensureSchema, getDb } from "../db";
import { playerProfiles, sessionEntries, sessionMemberProfiles, sessionMembers, sessionResults, sessionRoleClaims, sessions } from "../db/schema";
import { advanceWorld, generateWorld } from "./deepseek";
import { findScriptByTheme, getScriptMechanics, getScriptPlan, getScriptRoleOptions, getScriptStage } from "./script-catalog";
import type {
  PlayerEndingResult,
  PlayerProfile,
  RoleCard,
  SessionMode,
  SessionStatus,
  SessionView,
  WorldState,
} from "./session-types";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class RoleAlreadyClaimedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoleAlreadyClaimedError";
  }
}

function normalizeDeviceId(value: string | undefined, fallback: string) {
  return value?.trim().slice(0, 120) || `guest-${fallback}`;
}

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 120)) + 1);
}

function profileView(profile: typeof playerProfiles.$inferSelect): PlayerProfile {
  const level = levelFromXp(profile.xp);
  return {
    displayName: profile.displayName,
    xp: profile.xp,
    points: profile.points,
    level,
    nextLevelXp: level * level * 120,
    gamesPlayed: profile.gamesPlayed,
    goalsCompleted: profile.goalsCompleted,
    wins: profile.wins,
  };
}

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
  deviceId?: string;
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
  const deviceId = normalizeDeviceId(input.deviceId, memberId);
  const now = new Date();
  await db.batch([
    db.insert(sessions).values({
      id: sessionId,
      code,
      title: input.title?.trim().slice(0, 32) || "等待生成的世界",
      theme: input.theme.trim().slice(0, 300) || "熟悉空间里悄然改变的规则",
      mode: input.mode,
      status: "waiting",
      maxPlayers: Math.max(1, Math.min(input.maxPlayers, 8)),
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
    db.insert(playerProfiles).values({
      deviceId,
      displayName: input.name.trim().slice(0, 16),
      xp: 0,
      points: 0,
      gamesPlayed: 0,
      goalsCompleted: 0,
      wins: 0,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: playerProfiles.deviceId,
      set: { displayName: input.name.trim().slice(0, 16), updatedAt: now },
    }),
    db.insert(sessionMemberProfiles).values({ memberId, deviceId, createdAt: now }),
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

export async function addMember(sessionId: string, name: string, deviceIdValue = "", asHost = false) {
  const db = getDb();
  const memberId = crypto.randomUUID();
  const playerToken = makeToken();
  const deviceId = normalizeDeviceId(deviceIdValue, memberId);
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
    db.insert(playerProfiles).values({
      deviceId,
      displayName: name.trim().slice(0, 16),
      xp: 0,
      points: 0,
      gamesPlayed: 0,
      goalsCompleted: 0,
      wins: 0,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: playerProfiles.deviceId,
      set: { displayName: name.trim().slice(0, 16), updatedAt: now },
    }),
    db.insert(sessionMemberProfiles).values({ memberId, deviceId, createdAt: now }),
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

export async function getPlayerProfile(deviceIdValue: string) {
  await ensureSchema();
  const deviceId = deviceIdValue.trim().slice(0, 120);
  if (!deviceId) return null;
  const [profile] = await getDb().select().from(playerProfiles).where(eq(playerProfiles.deviceId, deviceId)).limit(1);
  return profile ? profileView(profile) : null;
}

export async function selectMemberRole(sessionId: string, memberId: string, roleId: string) {
  const db = getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session || session.status !== "waiting") throw new Error("这一局已经不能更换角色");
  if (session.mode === "match") throw new Error("匹配局由系统即时分配角色");
  const script = findScriptByTheme(session.theme);
  const options = getScriptRoleOptions(script?.id, session.maxPlayers);
  const selected = options.find((option) => option.id === roleId);
  if (!selected) throw new Error("这个角色不属于当前剧本");
  const role: RoleCard = {
    roleId: selected.id,
    identity: selected.title,
    publicDescription: selected.teaser,
    secretRule: "开局后由因果单独揭晓",
    privateGoal: "开局后由因果单独揭晓",
    privateTasks: [],
    survivalCondition: script?.victoryRule || "根据私人目标与最终选择独立结算。",
  };
  const now = new Date();
  try {
    await db.batch([
      db.delete(sessionRoleClaims).where(and(eq(sessionRoleClaims.sessionId, session.id), eq(sessionRoleClaims.memberId, memberId))),
      db.insert(sessionRoleClaims).values({ sessionId: session.id, roleId: selected.id, memberId, selectedAt: now }),
      db.update(sessionMembers).set({ roleJson: JSON.stringify(role), lastSeen: now }).where(and(
        eq(sessionMembers.id, memberId),
        eq(sessionMembers.sessionId, session.id),
      )),
    ]);
  } catch {
    throw new RoleAlreadyClaimedError(`${selected.title} 已经被其他人选择`);
  }
}

export async function sessionStartError(sessionId: string) {
  const db = getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session) return "世界不存在";
  const members = await db.select().from(sessionMembers).where(eq(sessionMembers.sessionId, session.id));
  const script = findScriptByTheme(session.theme);
  if (script?.playerCount && members.length !== script.playerCount) {
    return `这是固定 ${script.playerCount} 人本，需要所有角色到齐`;
  }
  const minimumPlayers = script?.playerCount ?? (session.maxPlayers === 1 ? 1 : 2);
  if (members.length < minimumPlayers) return minimumPlayers === 1 ? null : "至少等一个人到场，再开启世界";
  if (session.mode !== "match" && session.status === "waiting" && members.some((member) => !safeJson<RoleCard | null>(member.roleJson, null)?.roleId)) {
    return "每个人都选择角色后才能开局";
  }
  return null;
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
  const visibleEntries = allEntries.filter((entry) => {
    if (entry.kind === "private") {
      const meta = safeJson<{ senderMemberId?: string }>(entry.metaJson, {});
      return entry.memberId === me?.id || meta.senderMemberId === me?.id;
    }
    if (entry.kind === "choice") return entry.memberId === me?.id;
    return true;
  });
  const memberRoles = new Map(members.map((member) => [member.id, safeJson<RoleCard | null>(member.roleJson, null)]));
  const catalogScript = findScriptByTheme(session.theme);
  const roleOptions = session.mode === "match" ? [] : getScriptRoleOptions(catalogScript?.id, session.maxPlayers).map((option) => ({
    ...option,
    claimedBy: members.find((member) => memberRoles.get(member.id)?.roleId === option.id)?.name ?? null,
  }));
  let myProfile: PlayerProfile | null = null;
  let myResult: PlayerEndingResult | null = null;
  if (me) {
    const [[profileLink], [resultRow]] = await Promise.all([
      db.select().from(sessionMemberProfiles).where(eq(sessionMemberProfiles.memberId, me.id)).limit(1),
      db.select().from(sessionResults).where(and(eq(sessionResults.sessionId, session.id), eq(sessionResults.memberId, me.id))).limit(1),
    ]);
    if (profileLink) {
      const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.deviceId, profileLink.deviceId)).limit(1);
      if (profile) myProfile = profileView(profile);
    }
    if (resultRow) myResult = safeJson<PlayerEndingResult | null>(resultRow.resultJson, null);
  }
  const world = me ? safeJson<WorldState | null>(session.worldJson, null) : null;
  return {
    code: session.code,
    title: session.title,
    theme: session.theme,
    mode: session.mode as SessionMode,
    status: session.status as SessionStatus,
    maxPlayers: session.maxPlayers,
    requiredPlayers: catalogScript?.playerCount ?? null,
    turn: session.turn,
    errorMessage: session.errorMessage,
    members: members.map((member) => ({
      id: member.id,
      name: member.name,
      isHost: member.isHost,
      hasChosen: chosen.has(member.id),
      selectedRoleId: memberRoles.get(member.id)?.roleId ?? null,
      roleName: memberRoles.get(member.id)?.identity ?? null,
    })),
    me: me ? {
      id: me.id,
      name: me.name,
      isHost: me.isHost,
      role: memberRoles.get(me.id) ?? null,
      result: myResult,
      profile: myProfile,
    } : null,
    roleOptions,
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
  const catalogScript = findScriptByTheme(session.theme);
  const minimumPlayers = catalogScript?.playerCount ?? (session.maxPlayers === 1 ? 1 : 2);
  if (members.length < minimumPlayers) throw new Error(minimumPlayers === 1 ? "还没有找到独行者。" : "至少需要两个人，世界才会显现。");

  try {
    const roleOptions = getScriptRoleOptions(catalogScript?.id, session.maxPlayers);
    const draft = await generateWorld({
      theme: session.theme,
      members: members.map((member) => {
        const selectedRoleId = safeJson<RoleCard | null>(member.roleJson, null)?.roleId;
        return { name: member.name, selectedRole: roleOptions.find((option) => option.id === selectedRoleId) ?? null };
      }),
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
      format: catalogScript?.format ?? (session.maxPlayers === 1 ? "独行" : "合作"),
      victoryRule: catalogScript?.victoryRule ?? "每个人根据自己的私人目标、任务完成度与最终选择独立结算。",
      mechanics: session.maxPlayers === 1 && !catalogScript
        ? ["AI 角色对话", "状态抉择", "多结局收藏"]
        : getScriptMechanics(catalogScript?.id),
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
        roleId: role.roleId,
        identity: role.identity,
        publicDescription: role.publicDescription,
        secretRule: role.secretRule,
        privateGoal: role.privateGoal,
        privateTasks: role.privateTasks,
        survivalCondition: role.survivalCondition,
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

export async function sendWhisper(input: {
  sessionId: string;
  senderMemberId: string;
  targetMemberId: string;
  content: string;
}) {
  const db = getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.id, input.sessionId)).limit(1);
  if (!session || (session.status !== "active" && session.status !== "resolving")) {
    throw new Error("只有世界进行中才能发送密语");
  }
  if (input.senderMemberId === input.targetMemberId) throw new Error("不能给自己发送密语");
  const members = await db.select().from(sessionMembers).where(eq(sessionMembers.sessionId, session.id));
  const sender = members.find((member) => member.id === input.senderMemberId);
  const target = members.find((member) => member.id === input.targetMemberId);
  if (!sender || !target) throw new Error("密语对象已经不在这个世界");
  const content = input.content.trim().slice(0, 180);
  if (!content) throw new Error("先写下要发送的密语");
  await db.insert(sessionEntries).values({
    id: crypto.randomUUID(),
    sessionId: session.id,
    memberId: target.id,
    turn: session.turn,
    kind: "private",
    author: `${sender.name} · 密语`,
    content,
    metaJson: JSON.stringify({ type: "whisper", senderMemberId: sender.id, targetMemberId: target.id }),
    createdAt: new Date(),
  });
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
    const settlementWrites = turn.ended ? (await Promise.all(members.map(async (settledMember) => {
      const [profileLink] = await db.select().from(sessionMemberProfiles).where(eq(sessionMemberProfiles.memberId, settledMember.id)).limit(1);
      if (!profileLink) return [];
      const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.deviceId, profileLink.deviceId)).limit(1);
      if (!profile) return [];
      const role = safeJson<RoleCard | null>(settledMember.roleJson, null);
      const aiResult = turn.results.find((result) => result.playerName === settledMember.name);
      const completedTasks = (aiResult?.completedTasks ?? []).slice(0, 3);
      const roleTasks = role?.privateTasks ?? [];
      const failedTasks = (aiResult?.failedTasks?.length
        ? aiResult.failedTasks
        : roleTasks.filter((task) => !completedTasks.includes(task))).slice(0, 3);
      const survived = aiResult?.survived ?? world.format !== "竞争";
      const goalCompleted = aiResult?.goalCompleted ?? false;
      const xpEarned = Math.min(180, 15 + completedTasks.length * 20 + (goalCompleted ? 45 : 0) + (survived ? 35 : 0));
      const pointsEarned = Math.min(150, completedTasks.length * 10 + (goalCompleted ? 30 : 0) + (survived ? 45 : 0));
      const nextXp = profile.xp + xpEarned;
      const result: PlayerEndingResult = {
        summary: aiResult?.summary || "你走到了这一条因果的结尾，但私人目标没有得到完整确认。",
        survived,
        goalCompleted,
        completedTasks,
        failedTasks,
        xpEarned,
        pointsEarned,
        levelBefore: levelFromXp(profile.xp),
        levelAfter: levelFromXp(nextXp),
      };
      return [
        db.insert(sessionResults).values({
          sessionId: session.id,
          memberId: settledMember.id,
          resultJson: JSON.stringify(result),
          xpEarned,
          pointsEarned,
          createdAt: now,
        }),
        db.update(playerProfiles).set({
          displayName: settledMember.name,
          xp: nextXp,
          points: profile.points + pointsEarned,
          gamesPlayed: profile.gamesPlayed + 1,
          goalsCompleted: profile.goalsCompleted + (goalCompleted ? 1 : 0),
          wins: profile.wins + (survived ? 1 : 0),
          updatedAt: now,
        }).where(eq(playerProfiles.deviceId, profile.deviceId)),
      ];
    }))).flat() : [];
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
      ...settlementWrites,
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
