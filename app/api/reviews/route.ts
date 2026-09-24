import { NextResponse } from "next/server";
import { getPublished, averageRating } from "@/lib/reviews-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const reviews = await getPublished().catch(() => []);
  return NextResponse.json(
    { reviews, average: averageRating(reviews), count: reviews.length },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
