import { redis } from "./redis";

// Просмотры (счётчик) и лайки (множество id пользователей Telegram) вещей.
const viewsKey = (id: string) => `yenway:views:${id}`;
const likesKey = (id: string) => `yenway:likes:${id}`;

export interface ListingStats {
  views: number;
  likes: number;
}

export async function getStats(ids: string[]): Promise<Record<string, ListingStats>> {
  const out: Record<string, ListingStats> = {};
  if (!redis || ids.length === 0) return out;
  try {
    const p = redis.pipeline();
    for (const id of ids) {
      p.get(viewsKey(id));
      p.scard(likesKey(id));
    }
    const res = (await p.exec()) as unknown[];
    ids.forEach((id, i) => {
      out[id] = { views: Number(res[i * 2] ?? 0) || 0, likes: Number(res[i * 2 + 1] ?? 0) || 0 };
    });
  } catch (e) {
    console.error("Статистика недоступна:", e);
  }
  return out;
}

export async function addView(id: string): Promise<void> {
  await redis?.incr(viewsKey(id)).catch(() => {});
}

export async function isLiked(id: string, tgId: number): Promise<boolean> {
  if (!redis) return false;
  return (await redis.sismember(likesKey(id), String(tgId)).catch(() => 0)) === 1;
}

// Переключить лайк; возвращает новое состояние.
export async function toggleLike(id: string, tgId: number): Promise<boolean> {
  if (!redis) throw new Error("Хранилище не настроено");
  if (await isLiked(id, tgId)) {
    await redis.srem(likesKey(id), String(tgId));
    return false;
  }
  await redis.sadd(likesKey(id), String(tgId));
  return true;
}
