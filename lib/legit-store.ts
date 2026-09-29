import { redis } from "./redis";
import { createHashStore, requireRedis } from "./hash-store";
import type { ReviewPhoto } from "./reviews-store";
import type { VerdictKind } from "./legit";

// Опубликованный вердикт легит-чека.
export interface Verdict {
  id: string;
  title: string;
  verdict: VerdictKind;
  note: string;
  photoCount: number;
  createdAt: string;
}

const store = createHashStore<Verdict>("yenway:legit:v1", "yenway:legit");
const photoKey = (id: string, n: number) => `yenway:legit-photo:${id}:${n}`;

export function getVerdicts(): Promise<Verdict[]> {
  return store.all();
}

export function getVerdict(id: string): Promise<Verdict | undefined> {
  return store.get(id);
}

export async function getVerdictPhoto(id: string, n: number): Promise<ReviewPhoto | null> {
  if (!redis) return null;
  return redis.get<ReviewPhoto>(photoKey(id, n));
}

export async function addVerdict(input: Omit<Verdict, "id" | "photoCount" | "createdAt">, photos: ReviewPhoto[]): Promise<Verdict> {
  const r = requireRedis();
  const verdict: Verdict = { ...input, id: crypto.randomUUID(), photoCount: photos.length, createdAt: new Date().toISOString() };
  await Promise.all(photos.map((p, i) => r.set(photoKey(verdict.id, i), p)));
  await store.put(verdict);
  return verdict;
}

export async function removeVerdict(id: string): Promise<void> {
  const r = requireRedis();
  const verdict = await store.get(id);
  await store.remove(id);
  if (verdict?.photoCount) {
    await r.del(...Array.from({ length: verdict.photoCount }, (_, i) => photoKey(id, i)));
  }
}
