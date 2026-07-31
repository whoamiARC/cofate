import { getCustomQuota } from "../../../lib/custom-quota";
import { guardRequest } from "../../../lib/request-guard";

export async function GET(request: Request) {
  try {
    const blocked = await guardRequest(request, "quota:read", 120);
    if (blocked) return blocked;
    const deviceId = new URL(request.url).searchParams.get("deviceId") || "";
    return Response.json(await getCustomQuota(deviceId), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "额度暂时无法读取";
    return Response.json({ error: message }, { status: 400 });
  }
}
