import { createSign, generateKeyPairSync, randomUUID, type KeyObject } from "crypto";
export { MERCARI_TYPES } from "./mercari-types";

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
}


export async function searchMercari(keyword: string, maxPriceJPY: number | null, limit: number): Promise<MercariItem[]> {
  const body = {
    userId: "",
    pageSize: Math.min(120, Math.max(limit, 20)),
    pageToken: "",
    searchSessionId: randomUUID().replace(/-/g, ""),
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
    withItemSize: false,
    withItemPromotions: false,
    withItemSizes: false,
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
  const data = (await res.json()) as { items?: { id: string; name: string; price: string | number; thumbnails?: string[] }[] };
  return (data.items ?? [])
    .filter((i) => i.id && i.name)
    .slice(0, limit)
    .map((i) => ({
      id: i.id,
      title: i.name,
      price: Number(i.price) || 0,
      image: i.thumbnails?.[0] ?? null,
      link: i.id.startsWith("m") ? `https://jp.mercari.com/item/${i.id}` : `https://jp.mercari.com/shops/product/${i.id}`
    }));
}
