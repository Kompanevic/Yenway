import { redis } from "./redis";
import { createHashStore, requireRedis } from "./hash-store";

export interface StoredReview {
  id: string;
  username: string;
  rating: number;
  text: string;
  date: string;
  status: "pending" | "published";
  hasPhoto?: boolean;
  createdAt: string;
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

const store = createHashStore<StoredReview>("yenway:reviews:v2", "yenway:reviews");
// Фото лежат отдельными ключами, чтобы записи отзывов оставались лёгкими.
const photoKey = (id: string) => `yenway:review-photo:${id}`;

export function getAll(): Promise<StoredReview[]> {
  return store.all();
}

export async function getPublished(): Promise<StoredReview[]> {
  return (await store.all()).filter((r) => r.status === "published");
}

export async function getPending(): Promise<StoredReview[]> {
  return (await store.all()).filter((r) => r.status === "pending");
}

export function getReview(id: string): Promise<StoredReview | undefined> {
  return store.get(id);
}

export async function getPhoto(id: string): Promise<ReviewPhoto | null> {
  if (!redis) return null;
  return redis.get<ReviewPhoto>(photoKey(id));
}

async function add(input: ReviewInput, status: StoredReview["status"]): Promise<StoredReview> {
  const r = requireRedis();
  const now = new Date().toISOString();
  const review: StoredReview = {
    id: crypto.randomUUID(),
    username: input.username,
    rating: input.rating,
    text: input.text,
    date: now.slice(0, 7),
    status,
    hasPhoto: !!input.photo,
    createdAt: now
  };
  if (input.photo) await r.set(photoKey(review.id), input.photo);
  await store.put(review);
  return review;
}

export function addPending(input: ReviewInput): Promise<StoredReview> {
  return add(input, "pending");
}

export function addPublished(input: ReviewInput): Promise<StoredReview> {
  return add(input, "published");
}

export async function approve(id: string): Promise<void> {
  await store.patch(id, { status: "published" }, "Отзыв не найден");
}

export async function remove(id: string): Promise<void> {
  await store.remove(id);
  await redis?.del(photoKey(id));
}

export function averageRating(reviews: StoredReview[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
