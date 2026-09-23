import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { ITEM_BOT, escapeHtml, sendTelegramMessage, sendTelegramPhoto } from "@/lib/telegram";
import { CURRENCIES, Currency, convertToRub } from "@/lib/pricing";

const SYMBOL: Record<Currency, string> = { JPY: "¥", CNY: "CN¥", KRW: "₩", USD: "$", EUR: "€" };
const fmt = (n: number) => n.toLocaleString("ru-RU");

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  if (!ITEM_BOT.token || !ITEM_BOT.chatId) {
    return NextResponse.json(
      { error: "Бот карточек не настроен: добавьте ITEM_BOT_TOKEN в переменные Vercel и сделайте Redeploy" },
      { status: 500 }
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Некорректные данные формы" }, { status: 400 });

  const field = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const link = field("url", 2000);
  const title = field("title", 250);
  const size = field("size", 40);
  const condition = field("condition", 80);
  const price = parseFloat(field("price", 20).replace(/[^\d.]/g, ""));
  const currencyRaw = field("currency", 3);
  const currency = (CURRENCIES as readonly string[]).includes(currencyRaw) ? (currencyRaw as Currency) : null;
  const photo = form.get("photo");

  let priceLine: string | null = null;
  if (Number.isFinite(price) && price > 0 && currency) {
    const rub = convertToRub(price, currency);
    priceLine =
      `Цена: ${fmt(price)} ${SYMBOL[currency]}` +
      (rub != null ? ` ≈ <b>${fmt(rub)} ₽</b>\n<i>по курсу, без доставки и комиссии</i>` : " (курс не задан)");
  }

  const info = [
    `<b>${escapeHtml(title || "Без названия")}</b>`,
    ``,
    size ? `Размер: ${escapeHtml(size)}` : null,
    condition ? `Состояние: ${escapeHtml(condition)}` : null,
    priceLine
  ]
    .filter((l) => l !== null)
    .join("\n");

  const linkLine = link ? `\n\n🔗 ${escapeHtml(link)}` : "";
  // Подпись к фото — максимум 1024 символа (поля выше обрезаны так, что info
  // всегда влезает); длинную ссылку шлём отдельным сообщением.
  const captionFits = (info + linkLine).length <= 1024;
  const caption = captionFits ? info + linkLine : info;

  const sent =
    photo instanceof Blob && photo.size > 0
      ? await sendTelegramPhoto(photo, "item.jpg", caption, ITEM_BOT)
      : await sendTelegramMessage(caption, ITEM_BOT, true);
  if (sent && !captionFits && link) await sendTelegramMessage(`🔗 ${escapeHtml(link)}`, ITEM_BOT, true);

  if (!sent) {
    return NextResponse.json(
      { error: "Telegram не принял сообщение. Проверьте, что вы нажали /start в боте карточек." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
