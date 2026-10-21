import { NextRequest, NextResponse } from "next/server";
import { tgUserFrom } from "@/lib/tg-auth";
import { getUserRequests } from "@/lib/requests-store";
import { getListings, kindOf, sellerEarning } from "@/lib/listings-store";

export const dynamic = "force-dynamic";

// Профиль мини-аппа: пользователь Telegram (по подписи) и его заявки.
export async function GET(req: NextRequest) {
  const user = tgUserFrom(req);
  if (!user) return NextResponse.json({ error: "Откройте в Telegram" }, { status: 401 });
  const [requests, listings] = await Promise.all([getUserRequests(user.id).catch(() => []), getListings().catch(() => [])]);
  // Вещи, которые пользователь выложил как продавец, и его заработок.
  const items = listings
    .filter((l) => l.sellerTgId === user.id)
    .map((l) => ({ id: l.id, title: l.title, size: l.size, price: l.price, kind: kindOf(l), status: l.status, earning: sellerEarning(l), payout: l.payout ?? null }));
  return NextResponse.json({ user, requests, items }, { headers: { "Cache-Control": "private, no-store" } });
}
