import { LISTING_PATH, kindOf, type Listing, type ListingInput, type ListingKind } from "./listings-store";
import type { ReviewPhoto } from "./reviews-store";
import { CHANNEL_BOT, ITEM_BOT, LISTING_BOT, escapeHtml, sendTelegramMessage, sendTelegramPhoto } from "./telegram";
import { calculatePrice } from "./pricing";
import { REGIONS, type RegionKey } from "./regions";
import { LISTING_CONDITIONS, MAX_LISTING_PHOTOS } from "./listing-constants";
// Фото ужимаются в браузере до ~100–300 КБ; лимит с запасом под Upstash.
const MAX_PHOTO_BYTES = 600 * 1024;

export type ParsedListing =
  | { ok: true; value: ListingInput; photos: ReviewPhoto[]; blobs: Blob[]; calc?: PreorderCalc }
  | { ok: false; error: string };

// Пользователи выкладывают только «в наличии»; «под заказ» — только админ.
export async function parseListingForm(form: FormData, own: boolean): Promise<ParsedListing> {
  const text = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const title = text("title", 120);
  const size = text("size", 20);
  const price = Number(text("price", 12).replace(/\D/g, ""));
  const condition = text("condition", 40);
  const description = text("description", 800);
  const seller = own ? "" : text("seller", 40).replace(/^@/, "");
  const kind: ListingKind = own && text("kind", 10) === "preorder" ? "preorder" : "stock";
  const sourceUrl = kind === "preorder" ? text("sourceUrl", 1000) : "";
  const weight = kind === "preorder" ? parseFloat(text("weightKg", 10).replace(",", ".")) : NaN;
  const weightKg = weight > 0 && weight <= 100 ? Math.round(weight * 100) / 100 : undefined;
  const calcRegion = text("calcRegion", 10);
  const calcLocalPrice = parseFloat(text("calcLocalPrice", 20).replace(",", "."));
  const calc: PreorderCalc | undefined =
    kind === "preorder" && Object.prototype.hasOwnProperty.call(REGIONS, calcRegion) && calcLocalPrice > 0
      ? { region: calcRegion as RegionKey, localPrice: calcLocalPrice, chinaTier: text("calcChinaTier", 20) || undefined }
      : undefined;

  if (title.length < 2) return { ok: false, error: "Укажите название модели" };
  if (!size) return { ok: false, error: "Укажите размер" };
  if (!Number.isFinite(price) || price < 1) return { ok: false, error: "Укажите цену в рублях" };
  if (!LISTING_CONDITIONS.includes(condition)) return { ok: false, error: "Выберите состояние" };
  if (kind === "preorder" && !/^https?:\/\/\S+$/.test(sourceUrl)) {
    return { ok: false, error: "Укажите ссылку на товар (https://...)" };
  }
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

  return {
    ok: true,
    value: {
      title,
      size,
      price,
      condition,
      description,
      seller,
      own,
      kind,
      ...(sourceUrl ? { sourceUrl } : {}),
      ...(weightKg ? { weightKg } : {})
    },
    photos,
    blobs,
    calc
  };
}

// Готовый пост для канала: каждая строка жирная со значком, без ника продавца.
// Ссылка на страницу — кнопкой под фото, см. notifyListing.
export function listingPost(l: ListingInput): string {
  const desc = l.description.length > 500 ? l.description.slice(0, 500) + "…" : l.description;
  const line = (text: string) => `<b>✦ ${text}</b>`;
  return [
    line(escapeHtml(l.title)),
    line(`Размер: ${escapeHtml(l.size)}`),
    l.weightKg ? line(`Вес: ≈ ${l.weightKg} кг`) : null,
    line(`Состояние: ${escapeHtml(l.condition)}`),
    desc ? line(escapeHtml(desc)) : null,
    ``,
    ``,
    line(`Цена: ${l.price.toLocaleString("ru-RU")} ₽`)
  ]
    .filter((x) => x !== null)
    .join("\n");
}

// Данные «расчёта под ключ» из формы — только для сообщения админу, не хранятся.
export interface PreorderCalc {
  region: RegionKey;
  localPrice: number;
  chinaTier?: string;
}

function calcMessage(listing: Listing, calc: PreorderCalc | undefined): string {
  const lines = [`🧾 <b>Расчёт под ключ</b>`, ``];
  if (calc) {
    const r = REGIONS[calc.region];
    const b = calculatePrice(calc.localPrice, calc.region, listing.sourceUrl ?? "", listing.weightKg ?? null, calc.chinaTier);
    const rub = (n: number | null) => (n == null ? "уточняется" : `${n.toLocaleString("ru-RU")} ₽`);
    lines.push(
      `Страна: ${r.flag} ${r.name}`,
      `Цена товара: ${calc.localPrice.toLocaleString("ru-RU")} ${r.currency}` +
        (b.itemPriceRUB != null ? ` (≈ ${rub(b.itemPriceRUB)} по курсу)` : ` — курс не задан`),
      `Комиссия: ${rub(b.commissionRUB)}`,
      `Страховка: ${rub(b.insuranceRUB)}`,
      ...(b.serviceFeeRUB != null ? [`Сервис: ${rub(b.serviceFeeRUB)}`] : []),
      `Доставка: ${b.deliveryRUB != null ? `${rub(b.deliveryRUB)} (${listing.weightKg} кг${b.deliveryDays ? `, ${b.deliveryDays}` : ""})` : "укажите вес"}`,
      `<b>Итого по расчёту: ${rub(b.totalRUB)}</b>`
    );
  } else {
    lines.push(`Расчёт в форме не заполнялся.`);
  }
  lines.push(`На сайте: <b>${listing.price.toLocaleString("ru-RU")} ₽</b>`);
  if (listing.sourceUrl) lines.push(``, `🔗 Ссылка на товар (только для вас):`, escapeHtml(listing.sourceUrl));
  return lines.join("\n");
}

function postButton(l: Listing, origin: string) {
  return {
    text: kindOf(l) === "preorder" ? "Заказать на YenWay" : "Купить на YenWay",
    url: `${origin}${LISTING_PATH[kindOf(l)]}/${l.id}`
  };
}

// Тот же пост с кнопкой — прямо в канал (при пересылке кнопка теряется).
export function postToChannel(listing: Listing, photo: Blob, origin: string): Promise<boolean> {
  return sendTelegramPhoto(photo, "photo.jpg", listingPost(listing), CHANNEL_BOT, postButton(listing, origin));
}

// Пост — первое фото с кнопкой-ссылкой (у альбомов в Telegram кнопок не бывает,
// остальные фото — на странице вещи). «В наличии» — в бота объявлений, ник продавца отдельным сообщением,
// чтобы при пересылке в канал он туда не попал. «Под заказ» — в бота
// карточек: пост + отдельным сообщением расчёт под ключ и ссылка на товар.
export async function notifyListing(
  listing: Listing,
  blobs: Blob[],
  origin: string,
  calc?: PreorderCalc
): Promise<boolean> {
  const preorder = listing.kind === "preorder";
  const bot = preorder && ITEM_BOT.token ? ITEM_BOT : LISTING_BOT;
  // Опубликованное сразу (свои вещи, «под заказ») — ещё и в канал.
  if (listing.status === "published") await postToChannel(listing, blobs[0], origin);
  const sent = await sendTelegramPhoto(blobs[0], "photo.jpg", listingPost(listing), bot, postButton(listing, origin));
  if (!sent) return false;
  if (preorder) {
    await sendTelegramMessage(calcMessage(listing, calc), bot, true);
  } else if (!listing.own) {
    await sendTelegramMessage(
      `Продавец: @${listing.seller}\nОбъявление на модерации — опубликовать можно в /admin → «В наличии».`,
      bot,
      true
    );
  }
  return true;
}
