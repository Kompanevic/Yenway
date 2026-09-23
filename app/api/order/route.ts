import { NextRequest, NextResponse } from "next/server";
import { fetchLinkPreview } from "@/lib/og";
import { calculatePrice, isManualRegion, MANAGER_TELEGRAM, CUSTOMS_NOTE } from "@/lib/pricing";
import { sendTelegramMessage } from "@/lib/telegram";
import { REGIONS, RegionKey } from "@/lib/regions";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const allowed = await checkRateLimit(req, "order", 8, 600);
  if (!allowed) {
    return NextResponse.json({ error: "Слишком много заявок. Попробуйте через несколько минут." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);

  const link: string | undefined = body?.link;
  const usernameRaw: string | undefined = body?.username;
  const region: RegionKey | undefined = body?.region;
  const weightKg: number | null =
    typeof body?.weightKg === "number" && !Number.isNaN(body.weightKg) ? body.weightKg : null;
  const chinaTier: string | undefined = body?.chinaTier;

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
  const regionInfo = REGIONS[region];
  const manual = isManualRegion(region);
  const breakdown = manual
    ? null
    : calculatePrice(preview.price, region, url.toString(), weightKg, chinaTier);

  const priceLines = manual
    ? [`Регион с ручным расчётом — обратитесь к менеджеру @${MANAGER_TELEGRAM}`]
    : [
        breakdown!.itemPriceRUB != null
          ? `Товар: ${breakdown!.itemPriceLocal} ${regionInfo.currency} (~${breakdown!.itemPriceRUB} ₽)`
          : `Товар: цена не определена автоматически — уточнить вручную`,
        breakdown!.commissionRUB != null ? `Комиссия: ${breakdown!.commissionRUB} ₽` : `Комиссия: уточняется`,
        breakdown!.serviceFeeRUB != null ? `Сервис: ${breakdown!.serviceFeeRUB} ₽` : null,
        breakdown!.insuranceRUB != null ? `Страховка: ${breakdown!.insuranceRUB} ₽` : `Страховка: уточняется`,
        breakdown!.deliveryRUB != null
          ? `Доставка: ${breakdown!.deliveryRUB} ₽${breakdown!.deliveryDays ? ` (${breakdown!.deliveryDays})` : ""}`
          : `Доставка: укажите вес для расчёта`,
        breakdown!.totalRUB != null
          ? `<b>Итого${breakdown!.hasIndividualParts ? " (без учёта индивидуальных пунктов)" : ""}: ${breakdown!.totalRUB} ₽</b>`
          : `<b>Итого уточним вручную</b>`,
        CUSTOMS_NOTE
      ].filter(Boolean);

  const lines = [
    `🛒 <b>Новая заявка — YenWay</b>`,
    ``,
    `Регион: ${regionInfo.flag} ${regionInfo.name}`,
    `Покупатель: @${username}`,
    `Ссылка: ${url.toString()}`,
    preview.title ? `Товар: ${preview.title}` : null,
    weightKg != null ? `Вес: ${weightKg} кг` : null,
    ``,
    ...priceLines
  ]
    .filter(Boolean)
    .join("\n");

  const sent = await sendTelegramMessage(lines);

  return NextResponse.json({
    preview,
    breakdown,
    manual,
    managerTelegram: MANAGER_TELEGRAM,
    region: regionInfo,
    notified: sent
  });
}
