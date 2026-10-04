import { NextResponse } from "next/server";
import { getListings, kindOf } from "@/lib/listings-store";
import { regionFromUrl } from "@/lib/item-info";

export const dynamic = "force-dynamic";

// Последние выкупленные вещи для ленты на главной. Ссылку на товар наружу не
// отдаём — только страну (флажок).
export async function GET() {
  const date = (l: { boughtAt?: string; createdAt: string }) => l.boughtAt ?? l.createdAt;
  const items = (await getListings().catch(() => []))
    .filter((l) => l.status === "published" && kindOf(l) === "bought")
    .sort((a, b) => date(b).localeCompare(date(a)))
    .slice(0, 12)
    .map(({ id, title, region, sourceUrl }) => ({ id, title, region: region ?? regionFromUrl(sourceUrl) }));
  return NextResponse.json({ items }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
