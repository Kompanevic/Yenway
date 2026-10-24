import Anthropic from "@anthropic-ai/sdk";
import { createHash, randomUUID } from "crypto";
import { redis } from "./redis";
import { escapeHtml } from "./telegram";

// Бот поиска вещи по фото: Google Lens (через SerpApi) находит ту же картинку
// на площадках; если совпадений мало — Claude описывает вещь, и ищем по словам.

export const FINDER_TOKEN = process.env.FINDER_BOT_TOKEN?.trim() ?? "";
// Секрет вебхука выводим из токена — отдельная переменная не нужна.
export const FINDER_SECRET = FINDER_TOKEN ? createHash("sha256").update("finder:" + FINDER_TOKEN).digest("hex").slice(0, 48) : "";
const SERPAPI_KEY = process.env.SERPAPI_KEY?.trim() ?? "";
export const FINDER_ALLOWED = (process.env.FINDER_ALLOWED_IDS ?? "")
  .split(/[\s,]+/)
  .map(Number)
  .filter((n) => n > 0);

// Площадки, с которых заказываем: домен → название и флаг.
const MARKETS: { host: RegExp; name: string; flag: string; item?: RegExp }[] = [
  { host: /(^|\.)mercari\.com$/, name: "Mercari", flag: "🇯🇵", item: /\/(item|shops\/product)\// },
  { host: /(^|\.)paypayfleamarket\.yahoo\.co\.jp$/, name: "Yahoo Flea", flag: "🇯🇵", item: /\/item\// },
  { host: /(^|\.)auctions\.yahoo\.co\.jp$/, name: "Yahoo Auctions", flag: "🇯🇵", item: /\/auction\// },
  { host: /(^|\.)rakuten\.co\.jp$/, name: "Rakuten", flag: "🇯🇵" },
  { host: /(^|\.)zozo\.jp$/, name: "ZOZO", flag: "🇯🇵" },
  { host: /(^|\.)2ndstreet\.jp$/, name: "2nd Street", flag: "🇯🇵" },
  { host: /(^|\.)grailed\.com$/, name: "Grailed", flag: "🇺🇸", item: /\/listings\// },
  { host: /(^|\.)(taobao|tmall)\.com$/, name: "Taobao", flag: "🇨🇳" },
  { host: /(^|\.)goofish\.com$/, name: "Xianyu", flag: "🇨🇳" },
  { host: /(^|\.)(dewu|poizon)\.com$/, name: "Poizon", flag: "🇨🇳" },
  { host: /(^|\.)musinsa\.com$/, name: "Musinsa", flag: "🇰🇷" },
  { host: /(^|\.)kream\.co\.kr$/, name: "KREAM", flag: "🇰🇷" }
];
const SITE_FILTER = "(site:jp.mercari.com OR site:paypayfleamarket.yahoo.co.jp OR site:auctions.yahoo.co.jp OR site:grailed.com OR site:rakuten.co.jp OR site:2ndstreet.jp OR site:musinsa.com)";

export interface Found {
  title: string;
  link: string;
  market: string;
  flag: string;
  price?: string;
}

function market(link: string): (typeof MARKETS)[number] | null {
  try {
    const u = new URL(link);
    const m = MARKETS.find((x) => x.host.test(u.hostname));
    return m && (!m.item || m.item.test(u.pathname)) ? m : null;
  } catch {
    return null;
  }
}

function toFound(r: { title?: string; link?: string; price?: { value?: string } }): Found | null {
  const m = r.link ? market(r.link) : null;
  if (!m || !r.link) return null;
  return { title: (r.title ?? m.name).slice(0, 90), link: r.link, market: m.name, flag: m.flag, price: r.price?.value };
}

async function serp(params: Record<string, string>): Promise<Record<string, unknown> | null> {
  const qs = new URLSearchParams({ ...params, api_key: SERPAPI_KEY });
  try {
    const res = await fetch(`https://serpapi.com/search.json?${qs}`, { signal: AbortSignal.timeout(25000) });
    return res.ok ? ((await res.json()) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// Картинка для Google Lens: кладём во временное хранилище и отдаём по
// неугадываемой ссылке (ссылка на файл Telegram содержит токен бота — её наружу нельзя).
export async function stashImage(data: Buffer, type: string): Promise<string | null> {
  if (!redis) return null;
  const id = randomUUID();
  await redis.set(`yenway:finder-img:${id}`, { type, data: data.toString("base64") }, { ex: 900 });
  return id;
}

export async function getStashedImage(id: string): Promise<{ type: string; data: string } | null> {
  if (!redis || !/^[\w-]{36}$/.test(id)) return null;
  return redis.get<{ type: string; data: string }>(`yenway:finder-img:${id}`);
}

export async function lensSearch(imageUrl: string): Promise<Found[]> {
  const d = await serp({ engine: "google_lens", url: imageUrl, hl: "en" });
  const matches = (d?.visual_matches as Parameters<typeof toFound>[0][] | undefined) ?? [];
  return matches.map(toFound).filter((x): x is Found => !!x);
}

export async function textSearch(query: string): Promise<Found[]> {
  const d = await serp({ engine: "google", q: `${query} ${SITE_FILTER}`, num: "20" });
  const results = (d?.organic_results as Parameters<typeof toFound>[0][] | undefined) ?? [];
  return results.map(toFound).filter((x): x is Found => !!x);
}

export interface Identified {
  description: string;
  queries: string[];
}

// Claude смотрит на фото и пишет, что это за вещь, плюс поисковые запросы
// на английском, японском и китайском.
export async function identify(data: Buffer, type: string): Promise<Identified | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic();
  try {
    const res = await client.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              description: { type: "string" },
              queries: { type: "array", items: { type: "string" } }
            },
            required: ["description", "queries"],
            additionalProperties: false
          }
        }
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: type as "image/jpeg", data: data.toString("base64") } },
            {
              type: "text",
              text:
                "Это фото вещи (одежда, обувь, аксессуар), которую хотят найти на Mercari, Yahoo Auctions, Grailed и похожих площадках. " +
                "Определи бренд и модель как можно точнее. description — коротко по-русски, что это за вещь. " +
                "queries — 3 поисковых запроса: на английском, на японском (как пишут на Mercari, бренд катаканой) и на китайском. " +
                "Только бренд, модель, ключевые признаки — без слов вроде «купить»."
            }
          ]
        }
      ]
    });
    if (res.stop_reason === "refusal") return null;
    const text = res.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text;
    const parsed = text ? (JSON.parse(text) as Identified) : null;
    return parsed && Array.isArray(parsed.queries) ? { description: parsed.description, queries: parsed.queries.slice(0, 3) } : null;
  } catch (e) {
    console.error("finder: Claude не ответил", e);
    return null;
  }
}

export function dedupe(items: Found[]): Found[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = i.link.split("?")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatResults(items: Found[], note?: string): string {
  const lines = items.map(
    (i, n) => `${n + 1}. ${i.flag} <a href="${escapeHtml(i.link)}">${escapeHtml(i.title)}</a>\n    ${i.market}${i.price ? ` · ${escapeHtml(i.price)}` : ""}`
  );
  return [items.length ? `🔎 <b>Нашёл ${items.length}</b>` : "😕 На площадках ничего не нашлось.", note, "", ...lines].filter((x) => x !== undefined).join("\n");
}

export async function finderApi(method: string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${FINDER_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function downloadTgFile(fileId: string): Promise<{ data: Buffer; type: string } | null> {
  const info = await finderApi("getFile", { file_id: fileId });
  const path = (info?.result as { file_path?: string } | undefined)?.file_path;
  if (!path) return null;
  try {
    const res = await fetch(`https://api.telegram.org/file/bot${FINDER_TOKEN}/${path}`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const data = Buffer.from(await res.arrayBuffer());
    const type = /\.png$/i.test(path) ? "image/png" : /\.webp$/i.test(path) ? "image/webp" : "image/jpeg";
    return data.byteLength <= 10 * 1024 * 1024 ? { data, type } : null;
  } catch {
    return null;
  }
}

export const hasSerpApi = () => !!SERPAPI_KEY;
