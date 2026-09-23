import type { Listing, ListingInput } from "./listings-store";
import type { ReviewPhoto } from "./reviews-store";
import { LISTING_BOT, escapeHtml, sendTelegramAlbum, sendTelegramMessage } from "./telegram";
import { LISTING_CONDITIONS, MAX_LISTING_PHOTOS } from "./listing-constants";
// Фото ужимаются в браузере до ~100–300 КБ; лимит с запасом под Upstash.
const MAX_PHOTO_BYTES = 600 * 1024;

export type ParsedListing =
  | { ok: true; value: ListingInput; photos: ReviewPhoto[]; blobs: Blob[] }
  | { ok: false; error: string };

export async function parseListingForm(form: FormData, own: boolean): Promise<ParsedListing> {
  const text = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const title = text("title", 120);
  const size = text("size", 20);
  const price = Math.round(Number(text("price", 12).replace(/[^\d.]/g, "")));
  const condition = text("condition", 40);
  const description = text("description", 800);
  const seller = own ? "" : text("seller", 40).replace(/^@/, "");

  if (title.length < 2) return { ok: false, error: "Укажите название модели" };
  if (!size) return { ok: false, error: "Укажите размер" };
  if (!Number.isFinite(price) || price < 1) return { ok: false, error: "Укажите цену в рублях" };
  if (!LISTING_CONDITIONS.includes(condition)) return { ok: false, error: "Выберите состояние" };
  if (!own && !/^[a-zA-Z0-9_]{4,32}$/.test(seller)) {
    return { ok: false, error: "Некорректный ник в Telegram (например: ivan_petrov)" };
  }

  const blobs = form.getAll("photos").filter((p): p is File => p instanceof Blob && p.size > 0);
  if (blobs.length === 0) return { ok: false, error: "Добавьте хотя бы одно фото" };
  if (blobs.length > MAX_LISTING_PHOTOS) return { ok: false, error: `Не больше ${MAX_LISTING_PHOTOS} фото` };
  for (const b of blobs) {
    if (!b.type.startsWith("image/")) return { ok: false, error: "Все файлы должны быть изображениями" };
    if (b.size > MAX_PHOTO_BYTES) return { ok: false, error: "Одно из фото слишком большое — попробуйте другое" };
  }
  const photos = await Promise.all(
    blobs.map(async (b) => ({ type: b.type, data: Buffer.from(await b.arrayBuffer()).toString("base64") }))
  );

  return { ok: true, value: { title, size, price, condition, description, seller, own }, photos, blobs };
}

// Готовый пост для канала: каждая строка жирная со значком, без ника продавца.
export function listingPost(l: ListingInput & { id: string }, origin: string): string {
  const desc = l.description.length > 500 ? l.description.slice(0, 500) + "…" : l.description;
  const line = (text: string) => `<b>✦ ${text}</b>`;
  return [
    line(escapeHtml(l.title)),
    line(`Размер: ${escapeHtml(l.size)}`),
    desc ? line(escapeHtml(desc)) : null,
    line(`Состояние: ${escapeHtml(l.condition)}`),
    ``,
    ``,
    line(`Цена: ${l.price.toLocaleString("ru-RU")} ₽`),
    ``,
    `Купить: ${origin}/stock/${l.id}`
  ]
    .filter((x) => x !== null)
    .join("\n");
}

// Пост уходит в бота объявлений; ник продавца — отдельным сообщением,
// чтобы при пересылке поста в канал он туда не попал.
export async function notifyListing(listing: Listing, blobs: Blob[], origin: string): Promise<boolean> {
  const sent = await sendTelegramAlbum(blobs, listingPost(listing, origin), LISTING_BOT);
  if (sent && !listing.own) {
    await sendTelegramMessage(
      `Продавец: @${listing.seller}\nОбъявление на модерации — опубликовать можно в /admin → «В наличии».`,
      LISTING_BOT,
      true
    );
  }
  return sent;
}
