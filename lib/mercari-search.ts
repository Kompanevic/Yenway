import { createSign, generateKeyPairSync, randomUUID, type KeyObject } from "crypto";
export { MERCARI_TYPES } from "./mercari-types";
import { normalizeSize } from "./mercari-types";

// Поиск по Mercari через тот же API, что и сайт jp.mercari.com. Каждый запрос
// подписывается DPoP-токеном (ES256) — ключ генерируем сами, аккаунт не нужен.

const SEARCH_URL = "https://api.mercari.jp/v2/entities:search";

let key: { privateKey: KeyObject; jwk: { crv: string; kty: string; x: string; y: string } } | null = null;

function dpopKey() {
  if (!key) {
    const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const jwk = publicKey.export({ format: "jwk" }) as { crv: string; kty: string; x: string; y: string };
    key = { privateKey, jwk: { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y } };
  }
  return key;
}

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

function dpop(url: string, method: string): string {
  const { privateKey, jwk } = dpopKey();
  const header = b64url(JSON.stringify({ typ: "dpop+jwt", alg: "ES256", jwk }));
  const payload = b64url(JSON.stringify({ iat: Math.floor(Date.now() / 1000), jti: randomUUID(), htu: url, htm: method, uuid: randomUUID() }));
  const signer = createSign("SHA256");
  signer.update(`${header}.${payload}`);
  const sig = signer.sign({ key: privateKey, dsaEncoding: "ieee-p1363" });
  return `${header}.${payload}.${b64url(sig)}`;
}

export interface MercariItem {
  id: string;
  title: string;
  price: number;
  image: string | null;
  link: string;
  size: string | null;
}


type Size = { name?: string } | undefined;
type RawItem = { id: string; name: string; price: string | number; thumbnails?: string[]; itemSize?: Size; itemSizes?: Size[] };

// Одна страница выдачи (до 120 вещей) и токен следующей.
async function searchPage(keyword: string, maxPriceJPY: number | null, pageToken: string, sessionId: string) {
  const body = {
    userId: "",
    pageSize: 120,
    pageToken,
    searchSessionId: sessionId,
    indexRouting: "INDEX_ROUTING_UNSPECIFIED",
    thumbnailTypes: [],
    searchCondition: {
      keyword,
      excludeKeyword: "",
      sort: "SORT_CREATED_TIME",
      order: "ORDER_DESC",
      status: ["STATUS_ON_SALE"],
      sizeId: [],
      categoryId: [],
      brandId: [],
      sellerId: [],
      priceMin: 0,
      priceMax: maxPriceJPY ?? 0,
      itemConditionId: [],
      shippingPayerId: [],
      shippingFromArea: [],
      shippingMethod: [],
      colorId: [],
      hasCoupon: false,
      attributes: [],
      itemTypes: [],
      skuIds: []
    },
    defaultDatasets: ["DATASET_TYPE_MERCARI", "DATASET_TYPE_BEYOND"],
    serviceFrom: "suruga",
    withItemBrand: true,
    withItemSize: true,
    withItemPromotions: false,
    withItemSizes: true,
    withShopname: false
  };
  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      DPoP: dpop(SEARCH_URL, "POST"),
      "X-Platform": "web",
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`Mercari ответил ${res.status}`);
  const data = (await res.json()) as { items?: RawItem[]; meta?: { nextPageToken?: string } };
  return { items: data.items ?? [], next: data.meta?.nextPageToken || "" };
}

// sizes — нужные размеры в общем виде (см. normalizeSize); пусто — любые.
// limit — сколько вещей нужно (Infinity — все); maxPages — сколько страниц по 120 можно пролистать.
export async function searchMercari(
  keyword: string,
  maxPriceJPY: number | null,
  limit: number,
  sizes: string[] = [],
  maxPages = 1
): Promise<MercariItem[]> {
  const want = new Set(sizes);
  const sessionId = randomUUID().replace(/-/g, "");
  const found: { i: RawItem; size: string | null }[] = [];
  const seen = new Set<string>();
  let token = "";
  for (let page = 0; page < maxPages && found.length < limit; page++) {
    // Ошибку первой страницы показываем; на следующих — отдаём то, что уже нашли.
    let res;
    try {
      res = await searchPage(keyword, maxPriceJPY, token, sessionId);
    } catch (e) {
      if (page === 0) throw e;
      break;
    }
    for (const i of res.items) {
      if (!i.id || !i.name || seen.has(i.id)) continue;
      seen.add(i.id);
      const size = i.itemSize?.name ?? i.itemSizes?.[0]?.name ?? null;
      if (want.size) {
        const n = normalizeSize(size);
        if (!(n === "free" || (n != null && want.has(n)))) continue;
      }
      found.push({ i, size });
    }
    if (!res.next) break;
    token = res.next;
  }
  return found
    .slice(0, limit)
    .map(({ i, size }) => ({
      size,
      id: i.id,
      title: i.name,
      price: Number(i.price) || 0,
      image: i.thumbnails?.[0] ?? null,
      link: i.id.startsWith("m") ? `https://jp.mercari.com/item/${i.id}` : `https://jp.mercari.com/shops/product/${i.id}`
    }));
}
