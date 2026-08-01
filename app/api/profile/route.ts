import { getPlayerProfile } from "../../../lib/session-service";
import { guardRequest } from "../../../lib/request-guard";

export async function GET(request: Request) {
  try {
    const blocked = await guardRequest(request, "profile:read", 120);
    if (blocked) return blocked;
    const deviceId = new URL(request.url).searchParams.get("deviceId")?.trim().slice(0, 120) || "";
    if (!deviceId) return Response.json({ error: "缺少玩家档案标识" }, { status: 400 });
    const profile = await getPlayerProfile(deviceId);
    return Response.json(profile ?? {
      displayName: "新玩家",
      xp: 0,
      points: 0,
      level: 1,
      nextLevelXp: 120,
      gamesPlayed: 0,
      goalsCompleted: 0,
      wins: 0,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "玩家档案暂时无法读取";
    return Response.json({ error: message }, { status: 500 });
  }
}
