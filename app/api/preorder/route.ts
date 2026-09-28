import { NextResponse } from "next/server";
import { getListings, kindOf } from "@/lib/listings-store";
import { regionFromUrl } from "@/lib/item-info";

export const dynamic = "force-dynamic";

// Последние вещи «под заказ» для главной. Ссылку на товар наружу не отдаём —
// только страну (флажок).
export async function GET() {
  const items = (await getListings().catch(() => []))
    .filter((l) => l.status === "published" && kindOf(l) === "preorder")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)
    .map(({ id, title, size, price, photoCount, region, sourceUrl }) => ({
      id,
      title,
      size,
      price,
      photoCount,
      region: region ?? regionFromUrl(sourceUrl)
    }));
  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } }
  );
}
