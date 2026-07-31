import { createSession } from "../../../lib/session-service";
import { guardRequest } from "../../../lib/request-guard";
import { consumeCustomQuota, CustomQuotaExceededError } from "../../../lib/custom-quota";
import { findScript } from "../../../lib/script-catalog";

export async function POST(request: Request) {
  try {
    const blocked = await guardRequest(request, "session:create", 12);
    if (blocked) return blocked;
    const body = (await request.json()) as {
      name?: string;
      theme?: string;
      title?: string;
      maxPlayers?: number;
      creationKind?: "custom" | "catalog";
      scriptId?: string;
      deviceId?: string;
    };
    const name = body.name?.trim().slice(0, 16);
    if (!name) return Response.json({ error: "请先留下你的称呼" }, { status: 400 });
    const creationKind = body.creationKind === "catalog" ? "catalog" : "custom";
    const catalogScript = creationKind === "catalog" ? findScript(body.scriptId || "") : undefined;
    if (creationKind === "catalog" && !catalogScript) {
      return Response.json({ error: "这个剧本暂时不存在" }, { status: 404 });
    }
    if (catalogScript?.price) {
      return Response.json({
        error: "这是一个 ¥1 精品剧本，需要解锁后开始",
        paymentRequired: true,
        price: catalogScript.price,
        item: catalogScript.title,
      }, { status: 402 });
    }
    const quota = creationKind === "custom" ? await consumeCustomQuota(body.deviceId || "") : null;
    const created = await createSession({
      name,
      theme: catalogScript?.theme || body.theme?.trim().slice(0, 300) || "熟悉的聚会地点出现了无法解释的新规则",
      title: catalogScript?.title || body.title,
      mode: "private",
      maxPlayers: Number.isFinite(body.maxPlayers) ? Number(body.maxPlayers) : 4,
    });
    return Response.json({ code: created.code, playerToken: created.playerToken, quota }, { status: 201 });
  } catch (error) {
    if (error instanceof CustomQuotaExceededError) {
      return Response.json({
        error: error.message,
        paymentRequired: true,
        price: 1,
        item: "自定义世界",
      }, { status: 402 });
    }
    const message = error instanceof Error ? error.message : "入口创建失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
