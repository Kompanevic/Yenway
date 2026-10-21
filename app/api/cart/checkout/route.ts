import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getListings, kindOf, LISTING_PATH } from "@/lib/listings-store";
import { escapeHtml, sendTelegramMessage } from "@/lib/telegram";
import { recordRequest } from "@/lib/requests-store";
import { tgUserFrom } from "@/lib/tg-auth";
import { SITE_URL } from "@/lib/site";

// Корзина: одна заявка менеджеру со всеми вещами.
export async function POST(req: NextRequest) {
  if (!(await checkRateLimit(req, "cart", 5, 600))) {
    return NextResponse.json({ error: "Слишком много заявок. Попробуйте через несколько минут." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const user = tgUserFrom(req);
  const username = String(body?.username ?? user?.username ?? "").trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9_]{4,32}$/.test(username)) {
    return NextResponse.json({ error: "Укажите ник в Telegram (например: ivan_petrov)" }, { status: 400 });
  }
  const ids = new Set<string>(Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string").slice(0, 30) : []);
  const items = (await getListings().catch(() => [])).filter((l) => ids.has(l.id) && l.status === "published" && kindOf(l) !== "bought");
  if (items.length === 0) return NextResponse.json({ error: "В корзине нет доступных вещей" }, { status: 400 });

  const total = items.reduce((s, l) => s + l.price, 0);
  const sent = await sendTelegramMessage(
    [
      `🛒 <b>Корзина — ${items.length} шт.</b>`,
      ``,
      ...items.map((l) => `• ${escapeHtml(l.title)} • ${escapeHtml(l.size)} — ${l.price.toLocaleString("ru-RU")} ₽\n  ${SITE_URL}${LISTING_PATH[kindOf(l)]}/${l.id}`),
      ``,
      `<b>Итого: ${total.toLocaleString("ru-RU")} ₽</b>`,
      `Покупатель: @${username}${user ? " (из приложения)" : ""}`
    ].join("\n"),
    undefined,
    true
  );
  if (!sent) {
    return NextResponse.json({ error: "Не удалось отправить. Напишите нам напрямую: @yenwayceo" }, { status: 502 });
  }
  for (const l of items) {
    await recordRequest(
      { type: "buy", title: `${l.title} • ${l.size}`, username, price: l.price, link: `${LISTING_PATH[kindOf(l)]}/${l.id}` },
      user
    );
  }
  return NextResponse.json({ ok: true, count: items.length, total });
}
