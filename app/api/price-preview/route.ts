import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { fetchPricePreview, isPublicUrl } from "@/lib/price-preview";

export const maxDuration = 30;

// Калькулятор: цена с сайта сразу после вставки ссылки, до отправки заявки.
export async function POST(req: NextRequest) {
  if (!(await checkRateLimit(req, "price-preview", 30, 600))) {
    return NextResponse.json({ error: "Слишком много запросов — подождите пару минут" }, { status: 429 });
  }
  const url = isPublicUrl(String((await req.json().catch(() => null))?.url ?? ""));
  if (!url) return NextResponse.json({ error: "Некорректная ссылка" }, { status: 400 });
  return NextResponse.json(await fetchPricePreview(url.toString()));
}
