import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { MERCARI_TYPES, searchMercari, type MercariItem } from "@/lib/mercari-search";

export const maxDuration = 60;

const MAX_QUERIES = 40;

// Пакетный поиск для админки: каждый бренд × каждый тип вещи — отдельный запрос.
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { brands?: unknown; types?: unknown; maxPriceJPY?: unknown; limit?: unknown } | null;
  const brands = Array.isArray(b?.brands)
    ? Array.from(new Set(b.brands.map((x) => String(x).trim().slice(0, 60)).filter(Boolean)))
    : [];
  const types = Array.isArray(b?.types) ? b.types.map(String).filter((t) => t in MERCARI_TYPES || t === "Любые") : [];
  const maxPriceJPY = Number(b?.maxPriceJPY) > 0 ? Math.round(Number(b?.maxPriceJPY)) : null;
  const limit = Math.min(30, Math.max(3, Number(b?.limit) || 10));
  if (!brands.length) return NextResponse.json({ error: "Впишите хотя бы один бренд" }, { status: 400 });
  const kinds = types.length ? types : ["Любые"];
  const queries = brands.flatMap((brand) => kinds.map((type) => ({ brand, type, keyword: type === "Любые" ? brand : `${brand} ${MERCARI_TYPES[type]}` })));
  if (queries.length > MAX_QUERIES) {
    return NextResponse.json({ error: `Слишком много сочетаний (${queries.length}). Максимум ${MAX_QUERIES} — уберите часть брендов или типов.` }, { status: 400 });
  }

  // По 5 запросов одновременно — быстро и без лишней нагрузки на Mercari.
  const results: { brand: string; type: string; keyword: string; items: MercariItem[]; error?: string }[] = [];
  for (let i = 0; i < queries.length; i += 5) {
    results.push(
      ...(await Promise.all(
        queries.slice(i, i + 5).map(async (q) => {
          try {
            return { ...q, items: await searchMercari(q.keyword, maxPriceJPY, limit) };
          } catch (e) {
            return { ...q, items: [], error: e instanceof Error ? e.message : "ошибка" };
          }
        })
      ))
    );
  }
  return NextResponse.json({ results });
}
