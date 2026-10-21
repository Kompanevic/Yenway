import { NextRequest, NextResponse } from "next/server";
import { getStats, toggleLike } from "@/lib/listing-stats";
import { getListing } from "@/lib/listings-store";
import { tgUserFrom } from "@/lib/tg-auth";

// Лайк — только из мини-аппа (аккаунт Telegram), чтобы не накручивали.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = tgUserFrom(req);
  if (!user) return NextResponse.json({ error: "Лайки доступны в приложении YenWay в Telegram" }, { status: 401 });
  if (!(await getListing(params.id))) return NextResponse.json({ error: "Вещь не найдена" }, { status: 404 });
  try {
    const liked = await toggleLike(params.id, user.id);
    const { likes } = (await getStats([params.id]))[params.id] ?? { likes: 0 };
    return NextResponse.json({ liked, likes });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка" }, { status: 500 });
  }
}
