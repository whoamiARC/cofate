import { createSession } from "../../../lib/session-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      theme?: string;
      title?: string;
      maxPlayers?: number;
    };
    const name = body.name?.trim().slice(0, 16);
    if (!name) return Response.json({ error: "请先留下你的称呼" }, { status: 400 });
    const created = await createSession({
      name,
      theme: body.theme?.trim().slice(0, 300) || "熟悉的聚会地点出现了无法解释的新规则",
      title: body.title,
      mode: "private",
      maxPlayers: Number.isFinite(body.maxPlayers) ? Number(body.maxPlayers) : 4,
    });
    return Response.json({ code: created.code, playerToken: created.playerToken }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "入口创建失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
