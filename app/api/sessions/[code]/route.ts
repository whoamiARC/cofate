import { eq } from "drizzle-orm";
import { waitUntil } from "cloudflare:workers";
import { getDb } from "../../../../db";
import { sessionMembers } from "../../../../db/schema";
import {
  addMember,
  claimForGeneration,
  findMember,
  findSession,
  generateSessionWorld,
  getSessionView,
  RoleAlreadyClaimedError,
  selectMemberRole,
  sessionStartError,
  submitChoice,
} from "../../../../lib/session-service";
import { guardRequest } from "../../../../lib/request-guard";

type RouteContext = { params: Promise<{ code: string }> };

function tokenFrom(request: Request) {
  return request.headers.get("x-player-token")?.trim() || "";
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const view = await getSessionView(code, tokenFrom(request));
    if (!view) return Response.json({ error: "这个入口不存在或已经消失" }, { status: 404 });
    return Response.json(view, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "世界暂时无法打开";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as {
      action?: "join" | "select_role" | "start" | "choice";
      name?: string;
      content?: string;
      deviceId?: string;
      roleId?: string;
    };
    const limits = {
      join: 40,
      select_role: 40,
      start: 8,
      choice: 120,
    } as const;
    if (body.action && body.action in limits) {
      const blocked = await guardRequest(
        request,
        `session:${body.action}`,
        limits[body.action as keyof typeof limits],
      );
      if (blocked) return blocked;
    }
    const session = await findSession(code);
    if (!session) return Response.json({ error: "这个入口不存在或已经消失" }, { status: 404 });

    if (body.action === "join") {
      if (session.status !== "waiting") {
        return Response.json({ error: "这一局已经开始，暂时不能中途进入" }, { status: 409 });
      }
      const name = body.name?.trim().slice(0, 16);
      if (!name) return Response.json({ error: "请输入你的称呼" }, { status: 400 });
      const db = getDb();
      const members = await db.select().from(sessionMembers).where(eq(sessionMembers.sessionId, session.id));
      if (members.length >= session.maxPlayers) return Response.json({ error: "这个入口已经满员" }, { status: 409 });
      if (members.some((member) => member.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        return Response.json({ error: "这个称呼已经有人使用" }, { status: 409 });
      }
      const joined = await addMember(session.id, name, body.deviceId);
      return Response.json({ playerToken: joined.playerToken }, { status: 201 });
    }

    const member = await findMember(session.id, tokenFrom(request));
    if (!member) return Response.json({ error: "参与者凭证无效，请重新进入" }, { status: 403 });

    if (body.action === "select_role") {
      const roleId = body.roleId?.trim().slice(0, 120);
      if (!roleId) return Response.json({ error: "请选择一个角色" }, { status: 400 });
      await selectMemberRole(session.id, member.id, roleId);
      return Response.json({ ok: true });
    }

    if (body.action === "start") {
      if (!member.isHost) return Response.json({ error: "只有发起人可以开启世界" }, { status: 403 });
      const startError = await sessionStartError(session.id);
      if (startError) return Response.json({ error: startError }, { status: 409 });
      const claimed = await claimForGeneration(session.id);
      if (!claimed) return Response.json({ error: "世界正在生成或已经开始" }, { status: 409 });
      waitUntil(generateSessionWorld(session.id));
      return Response.json({ ok: true, processing: true }, { status: 202 });
    }

    if (body.action === "choice") {
      const content = body.content?.trim().slice(0, 360);
      if (!content) return Response.json({ error: "写下你的选择后再提交" }, { status: 400 });
      const result = await submitChoice({ sessionId: session.id, memberId: member.id, content });
      return Response.json({ ok: true, ...result });
    }

    return Response.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "操作失败";
    return Response.json({ error: message }, {
      status: error instanceof RoleAlreadyClaimedError ? 409 : 500,
    });
  }
}
