import { asc, eq } from "drizzle-orm";
import { ensureSchema, getDb } from "../../../db";
import { sessionMembers, sessions } from "../../../db/schema";
import {
  addMember,
  claimForGeneration,
  createSession,
  generateSessionWorld,
} from "../../../lib/session-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; theme?: string };
    const name = body.name?.trim().slice(0, 16);
    if (!name) return Response.json({ error: "请先留下你的称呼" }, { status: 400 });
    await ensureSchema();
    const db = getDb();
    const waiting = await db
      .select()
      .from(sessions)
      .where(eq(sessions.mode, "match"))
      .orderBy(asc(sessions.createdAt))
      .limit(12);
    for (const candidate of waiting) {
      if (candidate.status !== "waiting") continue;
      const members = await db.select().from(sessionMembers).where(eq(sessionMembers.sessionId, candidate.id));
      if (members.length !== 1 || members[0].name.toLocaleLowerCase() === name.toLocaleLowerCase()) continue;
      const joined = await addMember(candidate.id, name);
      const claimed = await claimForGeneration(candidate.id);
      let generationError: string | undefined;
      if (claimed) {
        try {
          await generateSessionWorld(candidate.id);
        } catch (error) {
          generationError = error instanceof Error ? error.message : "世界生成失败";
        }
      }
      return Response.json({
        code: candidate.code,
        playerToken: joined.playerToken,
        matched: true,
        error: generationError,
      }, { status: 201 });
    }

    const created = await createSession({
      name,
      theme: body.theme?.trim().slice(0, 300) || "两个陌生人在深夜收到同一份规则",
      mode: "match",
      maxPlayers: 2,
    });
    return Response.json({
      code: created.code,
      playerToken: created.playerToken,
      matched: false,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "匹配暂时不可用";
    return Response.json({ error: message }, { status: 500 });
  }
}
