import { NextRequest, NextResponse } from "next/server";
import { getStats, isLiked } from "@/lib/listing-stats";
import { tgUserFrom } from "@/lib/tg-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const stats = (await getStats([params.id]))[params.id] ?? { views: 0, likes: 0 };
  const user = tgUserFrom(req);
  return NextResponse.json({ ...stats, liked: user ? await isLiked(params.id, user.id) : false });
}
