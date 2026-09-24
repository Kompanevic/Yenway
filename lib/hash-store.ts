import type { Redis } from "@upstash/redis";
import { redis } from "./redis";

export interface StoredItem {
  id: string;
  createdAt: string;
}

export function requireRedis(): Redis {
  if (!redis) throw new Error("Хранилище не настроено (нет KV_REST_API_URL/TOKEN)");
  return redis;
}

// Коллекция в Redis-хэше: каждая запись — отдельное поле, поэтому одновременные
// добавления/изменения разных записей не затирают друг друга (раньше весь
// список читался и перезаписывался целиком).
export function createHashStore<T extends StoredItem>(hashKey: string, legacyKey: string) {
  let legacyChecked = false;

  // Разовый перенос со старого формата (один JSON-массив, новые — первыми).
  // hsetnx не перезапишет запись, если её уже успели изменить после переноса;
  // старый ключ остаётся резервной копией.
  async function migrate(r: Redis) {
    if (legacyChecked) return;
    const legacy = await r.get<T[]>(legacyKey);
    if (legacy?.length) {
      const now = Date.now();
      await Promise.all(
        legacy.map((item, i) =>
          r.hsetnx(hashKey, item.id, { ...item, createdAt: item.createdAt ?? new Date(now - i * 1000).toISOString() })
        )
      );
      await r.rename(legacyKey, `${legacyKey}:backup`).catch(() => {});
    }
    legacyChecked = true;
  }

  return {
    async all(): Promise<T[]> {
      if (!redis) return [];
      await migrate(redis);
      const map = await redis.hgetall<Record<string, T>>(hashKey);
      return Object.values(map ?? {}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async get(id: string): Promise<T | undefined> {
      if (!redis) return undefined;
      await migrate(redis);
      return (await redis.hget<T>(hashKey, id)) ?? undefined;
    },

    async put(item: T): Promise<void> {
      const r = requireRedis();
      await migrate(r);
      await r.hset(hashKey, { [item.id]: item });
    },

    async patch(id: string, changes: Partial<T>, notFound: string): Promise<T> {
      const r = requireRedis();
      await migrate(r);
      const current = await r.hget<T>(hashKey, id);
      if (!current) throw new Error(notFound);
      const next = { ...current, ...changes };
      await r.hset(hashKey, { [id]: next });
      return next;
    },

    async remove(id: string): Promise<void> {
      const r = requireRedis();
      await migrate(r);
      await r.hdel(hashKey, id);
    }
  };
}
