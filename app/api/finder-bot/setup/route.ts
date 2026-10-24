import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { FINDER_SECRET, FINDER_TOKEN, finderApi } from "@/lib/finder";
import { SITE_URL } from "@/lib/site";

// Один раз открыть в браузере, войдя в админку: подключает вебхук бота поиска.
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Сначала войдите в /admin" }, { status: 401 });
  if (!FINDER_TOKEN) return NextResponse.json({ error: "Не задан FINDER_BOT_TOKEN в Vercel" }, { status: 400 });
  const res = await finderApi("setWebhook", {
    url: `${SITE_URL}/api/finder-bot`,
    secret_token: FINDER_SECRET,
    allowed_updates: ["message"],
    drop_pending_updates: true
  });
  return NextResponse.json({ ok: !!res?.ok, telegram: res?.description ?? null, webhook: `${SITE_URL}/api/finder-bot` });
}
