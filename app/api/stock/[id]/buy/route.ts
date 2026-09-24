import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getListing, kindOf, LISTING_PATH } from "@/lib/listings-store";
import { escapeHtml, sendTelegramMessage } from "@/lib/telegram";
import { SITE_URL } from "@/lib/site";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const allowed = await checkRateLimit(req, "buy", 8, 600);
  if (!allowed) {
    return NextResponse.json({ error: "Слишком много заявок. Попробуйте через несколько минут." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? "").trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9_]{4,32}$/.test(username)) {
    return NextResponse.json({ error: "Некорректный ник в Telegram (например: ivan_petrov)" }, { status: 400 });
  }

  const listing = await getListing(params.id);
  if (!listing || listing.status !== "published") {
    return NextResponse.json({ error: "Вещь уже недоступна" }, { status: 404 });
  }

  const preorder = kindOf(listing) === "preorder";
  const sent = await sendTelegramMessage(
    [
      preorder ? `🛍 <b>Хочу заказать — Под заказ</b>` : `🛍 <b>Хочу купить — В наличии</b>`,
      ``,
      `Вещь: ${escapeHtml(listing.title)} • ${escapeHtml(listing.size)}`,
      `Цена: ${listing.price.toLocaleString("ru-RU")} ₽`,
      `Покупатель: @${username}`,
      preorder ? null : `Продавец: ${listing.own ? "YenWay (ваша вещь)" : `@${listing.seller}`}`,
      listing.sourceUrl ? `Ссылка на товар: ${escapeHtml(listing.sourceUrl)}` : null,
      ``,
      `${SITE_URL}${LISTING_PATH[kindOf(listing)]}/${listing.id}`
    ]
      .filter((x) => x !== null)
      .join("\n"),
    undefined,
    true
  );

  if (!sent) {
    return NextResponse.json(
      { error: "Не удалось отправить заявку. Напишите нам напрямую в Telegram: @yenwayceo" },
      { status: 502 }
    );
  }
  return NextResponse.json({ notified: true });
}
