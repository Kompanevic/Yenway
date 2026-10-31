import { fetchItemInfo, regionFromUrl } from "./item-info";
import { fetchLinkPreview } from "./og";
import type { Currency } from "./pricing";

export interface PricePreview {
  title: string | null;
  image: string | null;
  price: number | null;
  currency: Currency | null;
}

// Только обычные публичные сайты: без IP-адресов и внутренних имён.
export function isPublicUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) return null;
    const h = u.hostname;
    if (!h.includes(".") || /^[\d.]+$/.test(h) || h.includes(":") || /(^|\.)(localhost|local|internal)$/i.test(h)) return null;
    return u;
  } catch {
    return null;
  }
}

// Название, фото и цена вещи по ссылке: известные площадки разбираем
// подробно (как в админке), остальные сайты — по мета-тегам страницы.
export async function fetchPricePreview(url: string): Promise<PricePreview> {
  if (regionFromUrl(url)) {
    const info = await fetchItemInfo(url);
    if (info.price || info.title) return { title: info.title, image: info.image, price: info.price, currency: info.currency };
  }
  const p = await fetchLinkPreview(url);
  return { title: p.title, image: p.image, price: p.price, currency: null };
}
