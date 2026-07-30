import { env } from "cloudflare:workers";

const encoder = new TextEncoder();

async function fingerprint(request: Request) {
  const forwarded = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 160) || "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`${forwarded}|${userAgent}`),
  );
  return Array.from(new Uint8Array(digest).slice(0, 12))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function guardRequest(
  request: Request,
  action: string,
  limit: number,
  windowSeconds = 3600,
) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "请求来源无效" }, { status: 403 });
  }

  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }

  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / windowSeconds);
  const key = `${action}:${bucket}:${await fingerprint(request)}`;
  const expiresAt = (bucket + 1) * windowSeconds;

  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS request_limits (
    key TEXT PRIMARY KEY NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER NOT NULL
  )`).run();

  const result = await env.DB.prepare(`INSERT INTO request_limits (key, count, expires_at)
    VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1
    RETURNING count`)
    .bind(key, expiresAt)
    .first<{ count: number }>();

  if (crypto.getRandomValues(new Uint8Array(1))[0] < 3) {
    void env.DB.prepare("DELETE FROM request_limits WHERE expires_at < ?")
      .bind(now)
      .run();
  }

  if ((result?.count ?? 1) > limit) {
    const retryAfter = Math.max(1, expiresAt - now);
    return Response.json(
      { error: "操作有些频繁，请稍后再试" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  return null;
}
