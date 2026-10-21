import { regionFromUrl } from "./item-info";

// Что сервер готов открывать по просьбе клиентов мини-аппа: только страницы
// известных площадок и их серверы картинок (не открытый прокси).
const IMAGE_HOSTS =
  /(^|\.)(mercdn\.net|mercari\.com|rakuten\.co\.jp|r10s\.jp|imgz\.jp|zozo\.jp|yimg\.jp|yahoo\.co\.jp|grailed\.com|grailedapi\.com|alicdn\.com|taobaocdn\.com|tbcdn\.cn|msscdn\.net|musinsa\.com|coupangcdn\.com|29cm\.co\.kr|kream\.co\.kr|pstatic\.net|dewu\.com|poizon\.com)$/i;

function parse(raw: string): URL | null {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u : null;
  } catch {
    return null;
  }
}

export function marketplaceItemUrl(raw: string): URL | null {
  const u = parse(raw);
  return u && regionFromUrl(u.toString()) ? u : null;
}

export function marketplaceImageUrl(raw: string): URL | null {
  const u = parse(raw);
  return u && IMAGE_HOSTS.test(u.hostname) ? u : null;
}

// Скачать фото вещи со страницы площадки (для объявления продавца).
export async function fetchMarketplaceImage(raw: string, maxBytes: number): Promise<{ type: string; data: Buffer } | null> {
  const u = marketplaceImageUrl(raw);
  if (!u) return null;
  try {
    const res = await fetch(u, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0 Safari/537.36", Referer: u.origin + "/" }
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(jpeg|png|webp)$/.test(type.split(";")[0])) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.byteLength > 0 && buf.byteLength <= maxBytes ? { type: type.split(";")[0], data: buf } : null;
  } catch {
    return null;
  }
}
