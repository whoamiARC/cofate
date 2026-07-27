import { eq } from "drizzle-orm";
import { ensureSchema, getDb } from "../../../db";
import { messages, participants, worlds } from "../../../db/schema";
import {
  assignIdentity,
  createWorldSeed,
  VIBES,
  type VibeKey,
} from "../../../lib/causality-engine";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {
  return Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      vibe?: string;
      hostName?: string;
    };
    const name = body.name?.trim().slice(0, 24) || "今晚的世界";
    const hostName = body.hostName?.trim().slice(0, 12) || "发起人";
    const vibe =
      body.vibe && body.vibe in VIBES
        ? (body.vibe as VibeKey)
        : "gathering";

    await ensureSchema();
    const db = getDb();
    let code = makeCode();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const [found] = await db
        .select({ id: worlds.id })
        .from(worlds)
        .where(eq(worlds.code, code))
        .limit(1);
      if (!found) break;
      code = makeCode();
    }

    const worldId = crypto.randomUUID();
    const participantId = crypto.randomUUID();
    const now = new Date();
    const opening = createWorldSeed(vibe);
    const identity = assignIdentity(0);

    await db.batch([
      db.insert(worlds).values({
        id: worldId,
        code,
        name,
        vibe,
        prompt: opening,
        createdAt: now,
      }),
      db.insert(participants).values({
        id: participantId,
        worldId,
        name: hostName,
        emoji: identity.emoji,
        identity: identity.identity,
        joinedAt: now,
      }),
      db.insert(messages).values({
        id: crypto.randomUUID(),
        worldId,
        participantId: null,
        author: "因果",
        kind: "guide",
        content: `世界已建立。${opening}`,
        createdAt: now,
      }),
    ]);

    return Response.json({ code, participantId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
