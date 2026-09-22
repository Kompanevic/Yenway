import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "ADMIN_PASSWORD не настроен на сервере" }, { status: 500 });
  }

  // Простая защита от перебора пароля: не больше 8 попыток за 15 минут с одного IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (redis) {
    const key = `yenway:login-attempts:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 900);
    if (count > 8) {
      return NextResponse.json({ error: "Слишком много попыток. Попробуйте через 15 минут" }, { status: 429 });
    }
  }

  const body = await req.json().catch(() => null);
  const password: string | undefined = body?.password;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, password, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return res;
}
