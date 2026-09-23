import { CURRENCIES, Currency } from "./pricing";

export interface ItemInfo {
  title: string | null;
  image: string | null;
  description: string | null;
  price: number | null;
  currency: Currency | null;
  condition: string | null;
  size: string | null;
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
  const en = labelled.match(/^(new with tags|new|gently used|used|worn)/i)?.[1];
  return en ?? null;
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

  return {
    title: titleRaw ? cleanTitle(decodeEntities(titleRaw.trim())) : null,
    image,
    description,
    price,
    currency,
    condition,
    size
  };
}

export async function fetchItemInfo(url: string): Promise<ItemInfo> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.8,ru;q=0.6"
      }
    });
    if (!res.ok) return { ...EMPTY, currency: currencyFromHost(new URL(url).hostname) };
    return parseItemHtml(await res.text(), res.url || url);
  } catch {
    return { ...EMPTY, currency: currencyFromHost(new URL(url).hostname) };
  } finally {
    clearTimeout(timeout);
  }
}
