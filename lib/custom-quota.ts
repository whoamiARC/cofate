import { env } from "cloudflare:workers";
import { ensureSchema } from "../db";

export const DAILY_CUSTOM_LIMIT = 3;

export class CustomQuotaExceededError extends Error {
  constructor() {
    super("今天的 3 次免费自定义额度已经用完");
    this.name = "CustomQuotaExceededError";
  }
}

function normalizedDeviceId(deviceId: string) {
  const value = deviceId.trim();
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(value)) throw new Error("设备凭证无效，请重新打开 APP");
  return value;
}

function usageDay() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function getCustomQuota(deviceId: string) {
  await ensureSchema();
  const id = normalizedDeviceId(deviceId);
  const day = usageDay();
  const row = await env.DB.prepare("SELECT count FROM daily_custom_usage WHERE device_id = ? AND usage_day = ?")
    .bind(id, day)
    .first<{ count: number }>();
  const used = Math.max(0, Math.min(DAILY_CUSTOM_LIMIT, Number(row?.count || 0)));
  return { day, used, remaining: DAILY_CUSTOM_LIMIT - used, limit: DAILY_CUSTOM_LIMIT };
}

export async function consumeCustomQuota(deviceId: string) {
  await ensureSchema();
  const id = normalizedDeviceId(deviceId);
  const day = usageDay();
  const result = await env.DB.prepare(`INSERT INTO daily_custom_usage (device_id, usage_day, count, updated_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(device_id, usage_day) DO UPDATE SET
      count = count + 1,
      updated_at = excluded.updated_at
    WHERE count < ?`)
    .bind(id, day, Date.now(), DAILY_CUSTOM_LIMIT)
    .run();
  if (!result.meta.changes) throw new CustomQuotaExceededError();
  return getCustomQuota(id);
}
