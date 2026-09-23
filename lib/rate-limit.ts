import { NextRequest } from "next/server";
import { redis } from "./redis";

/**
 * Простой rate-limit на Redis: не больше `limit` запросов с одного IP
 * за `windowSeconds`. Если Redis не настроен — лимит не применяется
 * (лучше пропустить, чем сломать форму для реальных покупателей).
 */
export async function checkRateLimit(
  req: NextRequest,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  if (!redis) return true;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const redisKey = `yenway:ratelimit:${key}:${ip}`;
  const count = await redis.incr(redisKey);
  if (count === 1) await redis.expire(redisKey, windowSeconds);
  return count <= limit;
}
