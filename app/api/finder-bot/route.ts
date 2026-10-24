import { NextRequest, NextResponse } from "next/server";
import {
  FINDER_ALLOWED,
  FINDER_SECRET,
  FINDER_TOKEN,
  dedupe,
  downloadTgFile,
  finderApi,
  formatResults,
  hasSerpApi,
  identify,
  lensSearch,
  stashImage,
  textSearch,
  type Found
} from "@/lib/finder";
import { redis } from "@/lib/redis";
import { SITE_URL } from "@/lib/site";
import { escapeHtml } from "@/lib/telegram";

export const maxDuration = 60;

type Msg = {
  chat: { id: number };
  from?: { id: number };
  text?: string;
  photo?: { file_id: string; width: number }[];
  document?: { file_id: string; mime_type?: string };
};

const HELP =
  "Пришлите фото вещи — найду её на Mercari, Yahoo, Rakuten, Grailed, Taobao, Poizon и Musinsa.\n\n" +
  "Лучше всего работает фото с площадки или чёткое фото целиком на светлом фоне.";

// Вебхук бота поиска по фото. Telegram подписывает запросы секретом из setWebhook.
export async function POST(req: NextRequest) {
  if (!FINDER_TOKEN || req.headers.get("x-telegram-bot-api-secret-token") !== FINDER_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = (await req.json().catch(() => null)) as { update_id?: number; message?: Msg } | null;
  const msg = update?.message;
  if (!msg?.from) return NextResponse.json({ ok: true });

  // Telegram повторяет вебхук, если ответ задержался, — не ищем дважды.
  if (redis && update?.update_id != null) {
    const fresh = await redis.set(`yenway:finder-upd:${update.update_id}`, 1, { nx: true, ex: 3600 }).catch(() => "OK");
    if (fresh !== "OK") return NextResponse.json({ ok: true });
  }

  const chatId = msg.chat.id;
  const reply = (text: string) => finderApi("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true });

  // Поиск платный (SerpApi) — только для своих.
  if (!FINDER_ALLOWED.includes(msg.from.id)) {
    await reply(`Бот закрытый. Ваш Telegram id: <code>${msg.from.id}</code> — добавьте его в FINDER_ALLOWED_IDS в Vercel.`);
    return NextResponse.json({ ok: true });
  }

  const fileId = msg.photo?.length
    ? msg.photo.reduce((a, b) => (b.width > a.width ? b : a)).file_id
    : msg.document?.mime_type?.startsWith("image/")
      ? msg.document.file_id
      : null;
  if (!fileId) {
    await reply(HELP);
    return NextResponse.json({ ok: true });
  }
  if (!hasSerpApi()) {
    await reply("Не задан SERPAPI_KEY в Vercel — поиск выключен.");
    return NextResponse.json({ ok: true });
  }
  if (redis) {
    const key = `yenway:finder-day:${msg.from.id}`;
    const n = await redis.incr(key).catch(() => 0);
    if (n === 1) await redis.expire(key, 24 * 3600).catch(() => {});
    if (n > 50) {
      await reply("Лимит 50 поисков в сутки — попробуйте завтра.");
      return NextResponse.json({ ok: true });
    }
  }

  await reply("Ищу вещь… это займёт до минуты.");
  const file = await downloadTgFile(fileId);
  if (!file) {
    await reply("Не удалось скачать фото — пришлите его ещё раз.");
    return NextResponse.json({ ok: true });
  }

  const imageId = await stashImage(file.data, file.type);
  const [lens, info] = await Promise.all([
    imageId ? lensSearch(`${SITE_URL}/api/finder-image/${imageId}`) : Promise.resolve([] as Found[]),
    identify(file.data, file.type)
  ]);
  let found = dedupe(lens);
  // Точных совпадений мало — добираем поиском по словам от Claude.
  if (found.length < 5 && info?.queries.length) {
    const byText = await Promise.all(info.queries.map(textSearch));
    found = dedupe([...found, ...byText.flat()]);
  }
  const note = info ? `${escapeHtml(info.description)}\n<i>${info.queries.map(escapeHtml).join(" · ")}</i>` : undefined;
  await reply(formatResults(found.slice(0, 10), note));
  return NextResponse.json({ ok: true });
}
