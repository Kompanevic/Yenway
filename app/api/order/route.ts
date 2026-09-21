import { NextRequest, NextResponse } from "next/server";
import { fetchLinkPreview } from "@/lib/og";
import { calculatePrice } from "@/lib/pricing";
import { sendTelegramMessage } from "@/lib/telegram";
import { REGIONS, RegionKey } from "@/lib/regions";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const link: string | undefined = body?.link;
  const usernameRaw: string | undefined = body?.username;
  const region: RegionKey | undefined = body?.region;

  if (!link || !usernameRaw || !region || !REGIONS[region]) {
    return NextResponse.json({ error: "Заполните ссылку, ник в Telegram и регион" }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return NextResponse.json({ error: "Некорректная ссылка" }, { status: 400 });
  }

  const username = usernameRaw.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9_]{4,32}$/.test(username)) {
    return NextResponse.json({ error: "Некорректный ник в Telegram (например: ivan_petrov)" }, { status: 400 });
  }

  const preview = await fetchLinkPreview(url.toString());
  const breakdown = calculatePrice(preview.price, region);
  const regionInfo = REGIONS[region];

  const lines = [
    `🛒 <b>Новая заявка — Yenway</b>`,
    ``,
    `Регион: ${regionInfo.flag} ${regionInfo.name}`,
    `Покупатель: @${username}`,
    `Ссылка: ${url.toString()}`,
    preview.title ? `Товар: ${preview.title}` : null,
    ``,
    breakdown.isEstimate
      ? `Стоимость товара не определена автоматически — уточнить вручную.\nДоставка (ориентир): ${breakdown.deliveryRUB} ₽`
      : [
          `Товар: ${breakdown.itemPriceLocal} ${regionInfo.currency} (~${breakdown.itemPriceRUB} ₽)`,
          `Комиссия сервиса: ${breakdown.serviceFeeRUB} ₽`,
          `Страховка: ${breakdown.insuranceRUB} ₽`,
          `Доставка: ${breakdown.deliveryRUB} ₽`,
          `<b>Итого: ${breakdown.totalRUB} ₽</b>`
        ].join("\n")
  ]
    .filter(Boolean)
    .join("\n");

  const sent = await sendTelegramMessage(lines);

  return NextResponse.json({
    preview,
    breakdown,
    region: regionInfo,
    notified: sent
  });
}
