import { NextRequest, NextResponse } from "next/server";
import { getListings, kindOf, LISTING_PATH } from "@/lib/listings-store";

export const dynamic = "force-dynamic";

// Публичные карточки по списку id — для избранного в мини-аппе.
export async function GET(req: NextRequest) {
  const ids = new Set((req.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 100));
  const items = (await getListings().catch(() => []))
    .filter((l) => ids.has(l.id) && l.status !== "pending")
    .map((l) => ({
      id: l.id,
      title: l.title,
      size: l.size,
      price: l.price,
      href: `${LISTING_PATH[kindOf(l)]}/${l.id}`,
      unavailable: l.status === "sold" || kindOf(l) === "bought"
    }));
  return NextResponse.json({ items }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
