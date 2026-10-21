import { NextRequest, NextResponse } from "next/server";
import { tgUserFrom } from "@/lib/tg-auth";
import { getUserRequests } from "@/lib/requests-store";

export const dynamic = "force-dynamic";

// Профиль мини-аппа: пользователь Telegram (по подписи) и его заявки.
export async function GET(req: NextRequest) {
  const user = tgUserFrom(req);
  if (!user) return NextResponse.json({ error: "Откройте в Telegram" }, { status: 401 });
  const requests = await getUserRequests(user.id).catch(() => []);
  return NextResponse.json({ user, requests }, { headers: { "Cache-Control": "private, no-store" } });
}
