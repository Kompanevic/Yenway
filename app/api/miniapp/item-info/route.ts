import { NextRequest, NextResponse } from "next/server";
import { fetchItemInfo } from "@/lib/item-info";
import { marketplaceItemUrl } from "@/lib/marketplaces";
import { checkRateLimit } from "@/lib/rate-limit";
import { tgUserFrom } from "@/lib/tg-auth";

export const maxDuration = 30;

// Автозаполнение объявления продавца по ссылке — только из мини-аппа.
export async function POST(req: NextRequest) {
  if (!tgUserFrom(req)) return NextResponse.json({ error: "Откройте в приложении YenWay в Telegram" }, { status: 401 });
  if (!(await checkRateLimit(req, "mini-item-info", 20, 600))) {
    return NextResponse.json({ error: "Слишком много запросов. Подождите пару минут." }, { status: 429 });
  }
  const url = marketplaceItemUrl(String((await req.json().catch(() => null))?.url ?? ""));
  if (!url) return NextResponse.json({ error: "Вставьте ссылку на Mercari, Rakuten, Yahoo, Taobao, Poizon или Musinsa" }, { status: 400 });
  return NextResponse.json(await fetchItemInfo(url.toString()));
}
