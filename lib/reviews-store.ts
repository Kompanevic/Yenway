import { redis } from "./redis";

export interface StoredReview {
  id: string;
  username: string;
  rating: number;
  text: string;
  date: string;
  status: "pending" | "published";
  hasPhoto?: boolean;
}

export interface ReviewPhoto {
  type: string;
  data: string; // base64
}

export interface ReviewInput {
  username: string;
  rating: number;
  text: string;
  photo?: ReviewPhoto;
}

const KEY = "yenway:reviews";
// Фото лежат отдельными ключами, чтобы список отзывов оставался лёгким.
const photoKey = (id: string) => `yenway:review-photo:${id}`;

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

export async function getReview(id: string): Promise<StoredReview | undefined> {
  const all = await readAll();
  return all.find((r) => r.id === id);
}

export async function getPhoto(id: string): Promise<ReviewPhoto | null> {
  if (!redis) return null;
  return redis.get<ReviewPhoto>(photoKey(id));
}

async function add(input: ReviewInput, status: StoredReview["status"]): Promise<StoredReview> {
  if (!redis) throw new Error("Хранилище отзывов не настроено (нет KV_REST_API_URL/TOKEN)");
  const review: StoredReview = {
    id: crypto.randomUUID(),
    username: input.username,
    rating: input.rating,
    text: input.text,
    date: new Date().toISOString().slice(0, 7),
    status,
    hasPhoto: !!input.photo
  };
  if (input.photo) await redis.set(photoKey(review.id), input.photo);
  const all = await readAll();
  all.unshift(review);
  await writeAll(all);
  return review;
}

export function addPending(input: ReviewInput): Promise<StoredReview> {
  return add(input, "pending");
}

export function addPublished(input: ReviewInput): Promise<StoredReview> {
  return add(input, "published");
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
  await redis?.del(photoKey(id));
}

export function averageRating(reviews: StoredReview[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
