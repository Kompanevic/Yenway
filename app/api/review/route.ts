import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage, sendTelegramPhoto, escapeHtml } from "@/lib/telegram";
import { addPending } from "@/lib/reviews-store";
import { parseReviewForm } from "@/lib/review-input";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const allowed = await checkRateLimit(req, "review", 5, 600);
  if (!allowed) {
    return NextResponse.json({ error: "Слишком много отзывов. Попробуйте через несколько минут." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Некорректные данные формы" }, { status: 400 });

  const parsed = await parseReviewForm(form, 5);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { username, rating, text } = parsed.value;

  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  // Подпись к фото в Telegram ограничена 1024 символами.
  const shownText = parsed.photoBlob && text.length > 700 ? text.slice(0, 700) + "…" : text;
  const lines = [
    `⭐ <b>Новый отзыв — YenWay (на модерации)</b>`,
    ``,
    `Оценка: ${stars} (${rating}/5)`,
    `Автор: @${username}`,
    `Текст: ${escapeHtml(shownText)}`,
    ``,
    `Опубликовать можно в /admin.`
  ].join("\n");

  const notify = async () =>
    (parsed.photoBlob && (await sendTelegramPhoto(parsed.photoBlob, "review.jpg", lines))) ||
    sendTelegramMessage(lines);

  const [sent] = await Promise.all([notify(), addPending(parsed.value).catch(() => null)]);

  return NextResponse.json({ notified: sent });
}
