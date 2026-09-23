import { CURRENCIES, Currency } from "./pricing";

export interface ItemInfo {
  title: string | null;
  image: string | null;
  description: string | null;
  price: number | null;
  currency: Currency | null;
  condition: string | null;
  size: string | null;
  fetchError?: string | null;
}

const EMPTY: ItemInfo = {
  title: null,
  image: null,
  description: null,
  price: null,
  currency: null,
  condition: null,
  size: null
};

function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function meta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const k = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m =
      html.match(new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${k}["'][^>]*content=["']([^"']*)["']`, "i")) ||
      html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${k}["']`, "i"));
    if (m?.[1]?.trim()) return decodeEntities(m[1].trim());
  }
  return null;
}

type Json = Record<string, unknown>;

function findProduct(html: string): Json | null {
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, raw] of blocks) {
    let data: unknown;
    try {
      data = JSON.parse(raw.trim());
    } catch {
      continue;
    }
    const queue: unknown[] = [data];
    while (queue.length) {
      const node = queue.shift();
      if (Array.isArray(node)) queue.push(...node);
      else if (node && typeof node === "object") {
        const obj = node as Json;
        const type = obj["@type"];
        if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return obj;
        if (obj["@graph"]) queue.push(obj["@graph"]);
      }
    }
  }
  return null;
}

function str(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return decodeEntities(v.trim());
  if (typeof v === "number") return String(v);
  return null;
}

function firstImage(v: unknown): string | null {
  if (Array.isArray(v)) return firstImage(v[0]);
  if (v && typeof v === "object") return str((v as Json).url);
  return str(v);
}

// Хвосты площадок в заголовках: «... by メルカリ», «... - Yahoo!オークション» и т.п.
function cleanTitle(t: string): string {
  return t
    .replace(/\s*by\s*メルカリ\s*$/i, "")
    .replace(/\s*[-|｜]\s*(メルカリ|Mercari|Yahoo!オークション|ヤフオク!?|楽天市場|Grailed|eBay|ZOZOTOWN)[^]*$/i, "")
    .trim();
}

const SCHEMA_CONDITION: Record<string, string> = {
  NewCondition: "Новое",
  UsedCondition: "Б/у",
  RefurbishedCondition: "Восстановленное",
  DamagedCondition: "С повреждениями"
};

// Стандартные состояния Mercari/Yahoo — от более длинных к коротким,
// чтобы «やや傷や汚れあり» не совпало с «傷や汚れあり».
const JP_CONDITIONS: [string, string][] = [
  ["新品、未使用", "Новое, не использовалось"],
  ["新品・未使用", "Новое, не использовалось"],
  ["未使用に近い", "Почти новое"],
  ["目立った傷や汚れなし", "Без заметных следов носки"],
  ["やや傷や汚れあり", "Есть небольшие следы носки"],
  ["全体的に状態が悪い", "Плохое состояние"],
  ["傷や汚れあり", "Есть следы носки"]
];

// Состояния англоязычных площадок (Grailed: is_new / is_gently_used / is_used / is_worn).
function enCondition(v: string): string {
  const s = v.toLowerCase().replace(/^is_/, "").replace(/_/g, " ");
  if (/new|never worn|deadstock/.test(s)) return "Новое";
  if (/gently/.test(s)) return "Бережно ношенное";
  if (/very worn|heavily/.test(s)) return "Сильно ношенное";
  if (/used|worn/.test(s)) return "Б/у";
  return v;
}

function detectCondition(text: string): string | null {
  const labelled = text.match(/(?:商品の状態|状態|Condition|Состояние)\s*[:：]?\s*([^\n]{0,60})/i)?.[1] ?? "";
  for (const [jp, ru] of JP_CONDITIONS) if (labelled.includes(jp)) return ru;
  // Без подписи доверяем, только если на странице ровно одно состояние
  // (иначе это, скорее всего, список фильтров).
  let rest = text;
  const found = new Set<string>();
  for (const [jp, ru] of JP_CONDITIONS) {
    if (rest.includes(jp)) {
      found.add(ru);
      rest = rest.split(jp).join(" ");
    }
  }
  if (found.size === 1) return [...found][0];
  const en = labelled.match(/^(new with tags|new|gently used|very worn|used|worn)/i)?.[1];
  return en ? enCondition(en) : null;
}

function detectSize(text: string): string | null {
  const m = text.match(/(?:サイズ|Size|Размер|尺码|尺碼|사이즈)\s*[:：]?\s*([A-Za-z0-9./½-]{1,12}(?:\s?(?:cm|см|US|EU|UK|JP))?)/i);
  const v = m?.[1]?.trim();
  if (!v || /^(表|chart|guide)$/i.test(v)) return null;
  return v;
}

function currencyFromHost(host: string): Currency | null {
  if (/mercari|rakuten|zozo|yahoo\.co\.jp|\.jp$/.test(host)) return "JPY";
  if (/taobao|tmall|1688|dewu|95fen|goofish|xianyu|\.cn$/.test(host)) return "CNY";
  if (/coupang|musinsa|naver|gmarket|29cm|\.kr$/.test(host)) return "KRW";
  if (/ssense|farfetch|endclothing|vinted|zalando|\.(eu|de|fr|it|es|nl)$/.test(host)) return "EUR";
  if (/grailed|goat|stockx|ebay\.com|nike\.com/.test(host)) return "USD";
  return null;
}

function toCurrency(v: string | null): Currency | null {
  const c = v?.toUpperCase();
  return c && (CURRENCIES as readonly string[]).includes(c) ? (c as Currency) : null;
}

function parsePrice(v: string | null): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Объявление внутри JSON (Next.js __NEXT_DATA__ или API площадки): ищем
// ближайший к корню объект, похожий на лот — с названием, ценой и фото/размером.
function findListing(root: unknown): Json | null {
  const queue: unknown[] = [root];
  for (let seen = 0; queue.length && seen < 20000; seen++) {
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;
    if (Array.isArray(node)) {
      queue.push(...node);
      continue;
    }
    const o = node as Json;
    if (
      typeof o.title === "string" &&
      (typeof o.price === "number" || typeof o.price === "string") &&
      (Array.isArray(o.photos) || Array.isArray(o.designers) || "size" in o)
    ) {
      return o;
    }
    queue.push(...Object.values(o));
  }
  return null;
}

function listingInfo(o: Json, pageUrl: string): Partial<ItemInfo> {
  const designers = Array.isArray(o.designers)
    ? o.designers.map((d) => str((d as Json)?.name)).filter(Boolean).join(" × ")
    : "";
  const title = str(o.title);
  let image = firstImage(Array.isArray(o.photos) ? o.photos[0] : null) ?? firstImage(o.cover_photo);
  try {
    image = image ? new URL(image, pageUrl).toString() : null;
  } catch {
    image = null;
  }
  const condition = str(o.condition);
  return {
    title: title && designers && !title.toLowerCase().includes(designers.toLowerCase()) ? `${designers} ${title}` : title,
    image,
    description: str(o.description),
    price: parsePrice(str(o.price)),
    size: str(o.size),
    condition: condition ? enCondition(condition) : null
  };
}

// Структурированные размер/состояние/название из лота надёжнее догадок по тексту;
// цену, фото и описание оставляем из JSON-LD/метатегов, если они уже есть.
function mergeListing(base: ItemInfo, l: Partial<ItemInfo>): ItemInfo {
  return {
    ...base,
    title: l.title ?? base.title,
    size: l.size ?? base.size,
    condition: l.condition ?? base.condition,
    image: base.image ?? l.image ?? null,
    price: base.price ?? l.price ?? null,
    description: base.description ?? l.description ?? null
  };
}

export function parseItemHtml(html: string, pageUrl: string): ItemInfo {
  const product = findProduct(html);
  const offersRaw = product?.offers;
  const offer = (Array.isArray(offersRaw) ? offersRaw[0] : offersRaw) as Json | undefined;

  const titleRaw =
    str(product?.name) ?? meta(html, ["og:title", "twitter:title"]) ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null;
  const description = str(product?.description) ?? meta(html, ["og:description", "description", "twitter:description"]);

  let image = firstImage(product?.image) ?? meta(html, ["og:image", "og:image:secure_url", "twitter:image"]);
  if (image) {
    try {
      image = new URL(image, pageUrl).toString();
    } catch {
      image = null;
    }
  }

  const price =
    parsePrice(str(offer?.price) ?? str(offer?.lowPrice)) ??
    parsePrice(meta(html, ["product:price:amount", "og:price:amount", "price"]));

  const host = new URL(pageUrl).hostname;
  const currency =
    toCurrency(str(offer?.priceCurrency)) ??
    toCurrency(meta(html, ["product:price:currency", "og:price:currency", "priceCurrency"])) ??
    currencyFromHost(host);

  const pageText = decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, "\n")
  ).replace(/\n\s*\n+/g, "\n");

  const schemaCondition = str(offer?.itemCondition ?? product?.itemCondition)?.split("/").pop() ?? "";
  const condition =
    detectCondition(`${description ?? ""}\n${pageText}`) ?? SCHEMA_CONDITION[schemaCondition] ?? null;
  const size = detectSize(description ?? "") ?? detectSize(pageText);

  const info: ItemInfo = {
    title: titleRaw ? cleanTitle(decodeEntities(titleRaw.trim())) : null,
    image,
    description,
    price,
    currency,
    condition,
    size
  };

  const nextData = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (nextData) {
    try {
      const listing = findListing(JSON.parse(nextData));
      if (listing) return mergeListing(info, listingInfo(listing, pageUrl));
    } catch {
      // битый JSON — остаёмся с тем, что нашли в метатегах
    }
  }
  return info;
}

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept-Language": "ja,en-US;q=0.9,en;q=0.8,ru;q=0.7",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none"
};

function get(url: string, accept: string, ms: number): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(ms), headers: { ...BROWSER_HEADERS, Accept: accept } });
}

export async function fetchItemInfo(url: string): Promise<ItemInfo> {
  const u = new URL(url);
  let info: ItemInfo = { ...EMPTY, currency: currencyFromHost(u.hostname), fetchError: null };
  try {
    const res = await get(url, "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", 8000);
    if (res.ok) info = { ...parseItemHtml(await res.text(), res.url || url), fetchError: null };
    else info.fetchError = `ошибка ${res.status}`;
  } catch (e) {
    info.fetchError = e instanceof Error && e.name === "TimeoutError" ? "сайт не ответил за 8 секунд" : "сайт недоступен";
  }

  // Grailed часто не отдаёт страницу серверу — у него есть JSON по номеру лота.
  const listingId = u.pathname.match(/\/listings\/(\d+)/)?.[1];
  if (listingId && (!info.title || !info.image || !info.size)) {
    try {
      const res = await get(`${u.origin}/api/listings/${listingId}`, "application/json", 6000);
      const listing = res.ok ? findListing(await res.json()) : null;
      if (listing) info = { ...mergeListing(info, listingInfo(listing, url)), fetchError: null };
    } catch {
      // оставляем то, что есть, вместе с причиной ошибки страницы
    }
  }
  return info;
}
