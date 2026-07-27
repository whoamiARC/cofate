import { and, asc, count, eq } from "drizzle-orm";
import { ensureSchema, getDb } from "../../../../db";
import { messages, participants, worlds } from "../../../../db/schema";
import {
  assignIdentity,
  nextSocialPrompt,
  VIBES,
  type VibeKey,
} from "../../../../lib/causality-engine";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(_: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    await ensureSchema();
    const db = getDb();
    const [world] = await db
      .select()
      .from(worlds)
      .where(eq(worlds.code, code.toUpperCase()))
      .limit(1);

    if (!world) {
      return Response.json({ error: "这个世界还不存在" }, { status: 404 });
    }

    const [people, roomMessages] = await Promise.all([
      db
        .select()
        .from(participants)
        .where(eq(participants.worldId, world.id))
        .orderBy(asc(participants.joinedAt)),
      db
        .select()
        .from(messages)
        .where(eq(messages.worldId, world.id))
        .orderBy(asc(messages.createdAt))
        .limit(80),
    ]);

    return Response.json({
      world,
      participants: people,
      messages: roomMessages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取失败";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as {
      action?: "join" | "message";
      name?: string;
      participantId?: string;
      content?: string;
    };
    await ensureSchema();
    const db = getDb();
    const [world] = await db
      .select()
      .from(worlds)
      .where(eq(worlds.code, code.toUpperCase()))
      .limit(1);

    if (!world) {
      return Response.json({ error: "这个世界还不存在" }, { status: 404 });
    }

    if (body.action === "join") {
      const name = body.name?.trim().slice(0, 12);
      if (!name) {
        return Response.json({ error: "请输入你的名字" }, { status: 400 });
      }

      const [{ value: memberCount }] = await db
        .select({ value: count() })
        .from(participants)
        .where(eq(participants.worldId, world.id));
      const participantId = crypto.randomUUID();
      const identity = assignIdentity(memberCount);
      const now = new Date();

      await db.batch([
        db.insert(participants).values({
          id: participantId,
          worldId: world.id,
          name,
          emoji: identity.emoji,
          identity: identity.identity,
          joinedAt: now,
        }),
        db.insert(messages).values({
          id: crypto.randomUUID(),
          worldId: world.id,
          participantId: null,
          author: "因果",
          kind: "arrival",
          content: `${name}进入了世界。因果为TA生成了身份「${identity.identity}」。`,
          createdAt: now,
        }),
      ]);

      return Response.json({ participantId, identity });
    }

    if (body.action === "message") {
      const content = body.content?.trim().slice(0, 280);
      if (!content || !body.participantId) {
        return Response.json({ error: "消息不能为空" }, { status: 400 });
      }

      const [person] = await db
        .select()
        .from(participants)
        .where(
          and(
            eq(participants.id, body.participantId),
            eq(participants.worldId, world.id)
          )
        )
        .limit(1);
      if (!person) {
        return Response.json({ error: "请先进入这个世界" }, { status: 403 });
      }

      const [{ value: messageCount }] = await db
        .select({ value: count() })
        .from(messages)
        .where(
          and(
            eq(messages.worldId, world.id),
            eq(messages.kind, "message")
          )
        );
      const now = new Date();

      await db.insert(messages).values({
        id: crypto.randomUUID(),
        worldId: world.id,
        participantId: person.id,
        author: person.name,
        kind: "message",
        content,
        createdAt: now,
      });

      if ((messageCount + 1) % 3 === 0) {
        const vibe = (world.vibe in VIBES ? world.vibe : "gathering") as VibeKey;
        await db.insert(messages).values({
          id: crypto.randomUUID(),
          worldId: world.id,
          participantId: null,
          author: "因果",
          kind: "guide",
          content: nextSocialPrompt(vibe, messageCount + 1),
          createdAt: new Date(now.getTime() + 1),
        });
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "操作失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
