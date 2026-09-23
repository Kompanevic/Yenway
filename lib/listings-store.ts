import { redis } from "./redis";
import type { ReviewPhoto } from "./reviews-store";

export type ListingStatus = "pending" | "published" | "sold";

export interface Listing {
  id: string;
  title: string;
  size: string;
  price: number;
  condition: string;
  description: string;
  seller: string;
  own: boolean;
  photoCount: number;
  status: ListingStatus;
  createdAt: string;
}

export type ListingInput = Omit<Listing, "id" | "photoCount" | "status" | "createdAt">;

const KEY = "yenway:listings";
// Фото — отдельными ключами, чтобы список объявлений оставался лёгким.
const photoKey = (id: string, n: number) => `yenway:listing-photo:${id}:${n}`;

function requireRedis() {
  if (!redis) throw new Error("Хранилище не настроено (нет KV_REST_API_URL/TOKEN)");
  return redis;
}

export async function getListings(): Promise<Listing[]> {
  if (!redis) return [];
  return (await redis.get<Listing[]>(KEY)) ?? [];
}

export async function getListing(id: string): Promise<Listing | undefined> {
  return (await getListings()).find((l) => l.id === id);
}

export async function getListingPhoto(id: string, n: number): Promise<ReviewPhoto | null> {
  if (!redis) return null;
  return redis.get<ReviewPhoto>(photoKey(id, n));
}

export async function addListing(input: ListingInput, photos: ReviewPhoto[], status: ListingStatus): Promise<Listing> {
  const r = requireRedis();
  const listing: Listing = {
    ...input,
    id: crypto.randomUUID(),
    photoCount: photos.length,
    status,
    createdAt: new Date().toISOString()
  };
  await Promise.all(photos.map((p, i) => r.set(photoKey(listing.id, i), p)));
  const all = await getListings();
  all.unshift(listing);
  await r.set(KEY, all);
  return listing;
}

export async function setListingStatus(id: string, status: ListingStatus): Promise<Listing> {
  const r = requireRedis();
  const all = await getListings();
  const listing = all.find((l) => l.id === id);
  if (!listing) throw new Error("Объявление не найдено");
  listing.status = status;
  await r.set(KEY, all);
  return listing;
}

export async function removeListing(id: string): Promise<void> {
  const r = requireRedis();
  const all = await getListings();
  const listing = all.find((l) => l.id === id);
  await r.set(KEY, all.filter((l) => l.id !== id));
  if (listing?.photoCount) {
    await r.del(...Array.from({ length: listing.photoCount }, (_, i) => photoKey(id, i)));
  }
}
