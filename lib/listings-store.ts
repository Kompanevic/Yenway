import { redis } from "./redis";
import { createHashStore, requireRedis } from "./hash-store";
import type { ReviewPhoto } from "./reviews-store";

export type ListingStatus = "pending" | "published" | "sold";
import type { ListingKind } from "./listing-constants";
export { kindOf, LISTING_PATH, type ListingKind } from "./listing-constants";

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
  kind?: ListingKind;
  // Ссылка на товар для «под заказ» — только для админа, на сайт не выводится.
  sourceUrl?: string;
}

export type ListingInput = Omit<Listing, "id" | "photoCount" | "status" | "createdAt">;

const store = createHashStore<Listing>("yenway:listings:v2", "yenway:listings");
// Фото — отдельными ключами, чтобы записи объявлений оставались лёгкими.
const photoKey = (id: string, n: number) => `yenway:listing-photo:${id}:${n}`;

export function getListings(): Promise<Listing[]> {
  return store.all();
}

export function getListing(id: string): Promise<Listing | undefined> {
  return store.get(id);
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
  await store.put(listing);
  return listing;
}

export function setListingStatus(id: string, status: ListingStatus): Promise<Listing> {
  return store.patch(id, { status }, "Объявление не найдено");
}

export async function removeListing(id: string): Promise<void> {
  const r = requireRedis();
  const listing = await store.get(id);
  await store.remove(id);
  if (listing?.photoCount) {
    await r.del(...Array.from({ length: listing.photoCount }, (_, i) => photoKey(id, i)));
  }
}
