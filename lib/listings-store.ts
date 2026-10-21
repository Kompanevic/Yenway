import { redis } from "./redis";
import { createHashStore, requireRedis } from "./hash-store";
import type { ReviewPhoto } from "./reviews-store";
import type { RegionKey } from "./regions";

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
  // Примерный вес «под заказ», по нему считалась цена под ключ.
  weightKg?: number;
  // Продавец из мини-аппа (не YenWay): аккаунт Telegram, аватарка и
  // стоимость выкупа под ключ на момент публикации — разница с ценой его заработок.
  sellerTgId?: number;
  sellerName?: string;
  sellerPhoto?: string;
  basePrice?: number;
  // Выплата продавцу: due — к выплате (вещь выкуплена), paid — выплачено.
  payout?: "due" | "paid";
  // Пост в канале уже вышел — повторно при «Вернуть» не публикуем.
  channelPosted?: boolean;
  // Тип вещи (LISTING_CATEGORIES) — для фильтров.
  category?: string;
  // Когда вещь попала в «Выкупленные» — по этой дате сортируем витрину.
  boughtAt?: string;
  // Страна товара «под заказ» — флажок в ленте.
  region?: RegionKey;
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

// Правка опубликованного объявления из админки (фото не меняются).
export type ListingEdit = Partial<Pick<Listing, "title" | "size" | "price" | "condition" | "description" | "category">>;

export function editListing(id: string, changes: ListingEdit): Promise<Listing> {
  return store.patch(id, changes, "Объявление не найдено");
}

// Массово проставить тип вещи (пустой — снять тип).
export async function setListingsCategory(ids: string[], category: string | undefined): Promise<number> {
  const done = await Promise.all(ids.map((id) => store.patch(id, { category }, "").then(() => 1).catch(() => 0)));
  return done.reduce<number>((a, b) => a + b, 0);
}

// «Под заказ» ↔ «Выкупленные»: вещь переезжает в раздел и сразу видна в нём.
export async function setListingKind(id: string, kind: "preorder" | "bought"): Promise<Listing> {
  const current = await store.get(id);
  // Выкупили вещь продавца — его заработок становится «к выплате».
  const earns = !!current?.sellerTgId && sellerEarning(current) > 0 && current.payout !== "paid";
  return store.patch(
    id,
    {
      kind,
      status: "published",
      ...(kind === "bought" ? { boughtAt: new Date().toISOString(), ...(earns ? { payout: "due" as const } : {}) } : {}),
      ...(kind === "preorder" && current?.payout === "due" ? { payout: undefined } : {})
    },
    "Объявление не найдено"
  );
}

export function sellerEarning(l: Pick<Listing, "price" | "basePrice">): number {
  return l.basePrice ? Math.max(0, l.price - l.basePrice) : 0;
}

export function markChannelPosted(id: string): Promise<Listing> {
  return store.patch(id, { channelPosted: true }, "Объявление не найдено");
}

export function setPayoutPaid(id: string): Promise<Listing> {
  return store.patch(id, { payout: "paid" }, "Объявление не найдено");
}

export async function removeListing(id: string): Promise<void> {
  const r = requireRedis();
  const listing = await store.get(id);
  await store.remove(id);
  if (listing?.photoCount) {
    await r.del(...Array.from({ length: listing.photoCount }, (_, i) => photoKey(id, i)));
  }
}
