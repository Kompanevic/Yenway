import { redis } from "./redis";

export interface StoredReview {
  id: string;
  username: string;
  rating: number;
  text: string;
  date: string;
  status: "pending" | "published";
}

const KEY = "yenway:reviews";

async function readAll(): Promise<StoredReview[]> {
  if (!redis) return [];
  const data = await redis.get<StoredReview[]>(KEY);
  return data ?? [];
}

async function writeAll(reviews: StoredReview[]): Promise<void> {
  if (!redis) throw new Error("Хранилище отзывов не настроено (нет KV_REST_API_URL/TOKEN)");
  await redis.set(KEY, reviews);
}

export async function getAll(): Promise<StoredReview[]> {
  return readAll();
}

export async function getPublished(): Promise<StoredReview[]> {
  const all = await readAll();
  return all.filter((r) => r.status === "published");
}

export async function getPending(): Promise<StoredReview[]> {
  const all = await readAll();
  return all.filter((r) => r.status === "pending");
}

function newReview(
  input: { username: string; rating: number; text: string },
  status: StoredReview["status"]
): StoredReview {
  return {
    id: crypto.randomUUID(),
    username: input.username,
    rating: input.rating,
    text: input.text,
    date: new Date().toISOString().slice(0, 7),
    status
  };
}

export async function addPending(input: { username: string; rating: number; text: string }): Promise<StoredReview> {
  const all = await readAll();
  const review = newReview(input, "pending");
  all.unshift(review);
  await writeAll(all);
  return review;
}

export async function addPublished(input: { username: string; rating: number; text: string }): Promise<StoredReview> {
  const all = await readAll();
  const review = newReview(input, "published");
  all.unshift(review);
  await writeAll(all);
  return review;
}

export async function approve(id: string): Promise<void> {
  const all = await readAll();
  const review = all.find((r) => r.id === id);
  if (!review) throw new Error("Отзыв не найден");
  review.status = "published";
  await writeAll(all);
}

export async function remove(id: string): Promise<void> {
  const all = await readAll();
  await writeAll(all.filter((r) => r.id !== id));
}

export function averageRating(reviews: StoredReview[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
