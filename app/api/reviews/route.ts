import { NextResponse } from "next/server";
import { getPublished, averageRating } from "@/lib/reviews-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const reviews = await getPublished();
  return NextResponse.json({ reviews, average: averageRating(reviews), count: reviews.length });
}
