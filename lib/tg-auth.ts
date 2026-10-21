import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

// Пользователь мини-аппа: Telegram подписывает initData токеном бота, поэтому
// сервер может доверять id без регистрации и паролей.
export interface TgUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

export const TG_INIT_HEADER = "x-tg-init-data";
const MAX_AGE_SEC = 30 * 24 * 3600;

// Мини-апп может висеть на любом из ботов — проверяем подпись каждым токеном.
const TOKENS = Array.from(
  new Set(
    [
      process.env.TELEGRAM_MINIAPP_BOT_TOKEN,
      process.env.LISTING_BOT_TOKEN,
      process.env.ITEM_BOT_TOKEN,
      process.env.TELEGRAM_BOT_TOKEN
    ].filter((t): t is string => !!t)
  )
);

export function verifyInitData(initData: string, tokens: string[] = TOKENS): TgUser | null {
  if (!initData || initData.length > 4096) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return null;
  params.delete("hash");
  const check = Array.from(params.entries())
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");
  const ok = tokens.some((token) => {
    const secret = createHmac("sha256", "WebAppData").update(token).digest();
    const expected = createHmac("sha256", secret).update(check).digest();
    return timingSafeEqual(expected, Buffer.from(hash, "hex"));
  });
  if (!ok) return null;
  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SEC) return null;
  try {
    const user = JSON.parse(params.get("user") ?? "null") as TgUser | null;
    return user && Number.isInteger(user.id) ? user : null;
  } catch {
    return null;
  }
}

export function tgUserFrom(req: NextRequest): TgUser | null {
  return verifyInitData(req.headers.get(TG_INIT_HEADER) ?? "");
}
