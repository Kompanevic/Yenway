import { NextRequest, NextResponse } from "next/server";
import { addListing } from "@/lib/listings-store";
import { notifySellerListing, parseSellerListing } from "@/lib/listing-input";
import { fetchMarketplaceImage } from "@/lib/marketplaces";
import { checkRateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";
import { tgUserFrom } from "@/lib/tg-auth";

export const maxDuration = 30;

// Объявление «под заказ» от продавца из мини-аппа — сразу на сайт и в канал.
export async function POST(req: NextRequest) {
  const user = tgUserFrom(req);
  if (!user) return NextResponse.json({ error: "Откройте в приложении YenWay в Telegram" }, { status: 401 });
  if (!user.username) {
    return NextResponse.json({ error: "Задайте имя пользователя (@ник) в настройках Telegram — по нему с вами свяжутся" }, { status: 400 });
  }
  if (!(await checkRateLimit(req, `seller:${user.id}`, 10, 24 * 3600))) {
    return NextResponse.json({ error: "Не больше 10 вещей в день. Попробуйте завтра." }, { status: 429 });
  }
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Некорректные данные формы" }, { status: 400 });

  // Фото со страницы площадки — если продавец не загрузил своё.
  const pageImage = String(form.get("pageImage") ?? "");
  if (pageImage && form.getAll("photos").filter((p) => p instanceof Blob && p.size > 0).length === 0) {
    const img = await fetchMarketplaceImage(pageImage, 600 * 1024);
    if (!img) return NextResponse.json({ error: "Не удалось взять фото со страницы — загрузите своё" }, { status: 400 });
    form.append("photos", new Blob([new Uint8Array(img.data)], { type: img.type }), "page.jpg");
  }

  const parsed = await parseSellerListing(form, user);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const listing = await addListing(parsed.value, parsed.photos, "published");
    await notifySellerListing(listing, parsed.blobs, SITE_URL, parsed.calc);
    return NextResponse.json({ ok: true, id: listing.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка хранилища" }, { status: 500 });
  }
}
