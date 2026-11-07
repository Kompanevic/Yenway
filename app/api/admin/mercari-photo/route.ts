import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { hasSerpApi, identify, lensSearch, stashImage } from "@/lib/finder";
import { searchMercari, type MercariItem } from "@/lib/mercari-search";
import { CLOTHING_SIZES, SHOE_SIZES } from "@/lib/mercari-types";
import { SITE_URL } from "@/lib/site";

export const maxDuration = 60;

const MAX_PHOTO = 4 * 1024 * 1024;

// Поиск по фото для админки: Claude называет вещь и пишет запросы, по ним ищем
// на Mercari; если подключён SerpApi — ещё точные совпадения через Google Lens.
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!(photo instanceof Blob) || !photo.type.startsWith("image/") || photo.size === 0) {
    return NextResponse.json({ error: "Прикрепите фото" }, { status: 400 });
  }
  if (photo.size > MAX_PHOTO) return NextResponse.json({ error: "Фото слишком большое" }, { status: 400 });
  const data = Buffer.from(await photo.arrayBuffer());
  const maxPriceJPY = Number(form?.get("maxPriceJPY")) > 0 ? Math.round(Number(form?.get("maxPriceJPY"))) : null;
  const all = Number(form?.get("limit")) === 0;
  const limit = all ? Infinity : Math.min(100, Math.max(3, Number(form?.get("limit")) || 20));
  const list = (k: string, allowed: string[]) => String(form?.get(k) ?? "").split(",").filter((x) => allowed.includes(x));
  const sizes = [...list("sizes", CLOTHING_SIZES), ...list("shoeSizes", SHOE_SIZES)];

  const lensOn = hasSerpApi();
  const [info, lens] = await Promise.all([
    identify(data, photo.type),
    lensOn
      ? stashImage(data, photo.type).then((id) => (id ? lensSearch(`${SITE_URL}/api/finder-image/${id}`) : []))
      : Promise.resolve([])
  ]);
  if (!info && !lens.length) {
    return NextResponse.json(
      { error: process.env.ANTHROPIC_API_KEY ? "Не удалось распознать вещь — попробуйте другое фото" : "Не задан ANTHROPIC_API_KEY в Vercel — поиск по фото выключен" },
      { status: 400 }
    );
  }

  const results: { brand: string; type: string; keyword: string; items: MercariItem[]; error?: string }[] = [];
  if (lens.length) {
    results.push({
      brand: "Точные совпадения",
      type: "Google Lens",
      keyword: "lens",
      items: lens.map((f) => ({
        id: f.link,
        title: `${f.flag} ${f.market}: ${f.title}`,
        price: Number((f.price ?? "").replace(/[^\d]/g, "")) || 0,
        image: f.image ?? null,
        link: f.link,
        size: null
      }))
    });
  }
  const queries = info?.queries.slice(0, 3) ?? [];
  results.push(
    ...(await Promise.all(
      queries.map(async (keyword) => {
        try {
          return { brand: "По фото", type: keyword, keyword, items: await searchMercari(keyword, maxPriceJPY, limit, sizes, all ? 3 : Math.ceil(Math.min(limit, 360) / 120)) };
        } catch (e) {
          return { brand: "По фото", type: keyword, keyword, items: [], error: e instanceof Error ? e.message : "ошибка" };
        }
      })
    ))
  );
  // Одна вещь могла найтись по нескольким запросам — показываем её один раз.
  const seen = new Set<string>();
  for (const r of results) r.items = r.items.filter((i) => !seen.has(i.link) && !!seen.add(i.link));
  return NextResponse.json({ description: info?.description ?? null, lens: lensOn, results });
}
