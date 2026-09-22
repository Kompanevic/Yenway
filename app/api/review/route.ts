import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const usernameRaw: string | undefined = body?.username;
  const rating: number | undefined = body?.rating;
  const textRaw: string | undefined = body?.text;

  if (!usernameRaw || !rating || !textRaw) {
    return NextResponse.json({ error: "Заполните ник, оценку и текст отзыва" }, { status: 400 });
  }

  const username = usernameRaw.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9_]{4,32}$/.test(username)) {
    return NextResponse.json({ error: "Некорректный ник в Telegram (например: ivan_petrov)" }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Оценка должна быть от 1 до 5" }, { status: 400 });
  }

  const text = textRaw.trim().slice(0, 1000);
  if (text.length < 5) {
    return NextResponse.json({ error: "Текст отзыва слишком короткий" }, { status: 400 });
  }

  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  const lines = [
    `⭐ <b>Новый отзыв — YenWay (на модерации)</b>`,
    ``,
    `Оценка: ${stars} (${rating}/5)`,
    `Автор: @${username}`,
    `Текст: ${text}`,
    ``,
    `Опубликовать вручную после проверки.`
  ].join("\n");

  const sent = await sendTelegramMessage(lines);

  return NextResponse.json({ notified: sent });
}
