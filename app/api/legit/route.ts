import { NextRequest, NextResponse } from "next/server";
import { escapeHtml, sendTelegramAlbum, sendTelegramMessage } from "@/lib/telegram";
import { checkRateLimit } from "@/lib/rate-limit";
import { LEGIT_FEE_RUB, LEGIT_MAX_PHOTOS, LEGIT_MAX_PHOTO_BYTES, LEGIT_MIN_PHOTOS } from "@/lib/legit";

// Заявка на легит-чек: фото со всех сторон + ник → альбомом в основной бот.
export async function POST(req: NextRequest) {
  const allowed = await checkRateLimit(req, "legit", 3, 600);
  if (!allowed) {
    return NextResponse.json({ error: "Слишком много заявок. Попробуйте через несколько минут." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Некорректные данные формы" }, { status: 400 });

  const username = String(form.get("username") ?? "").trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9_]{4,32}$/.test(username)) {
    return NextResponse.json({ error: "Некорректный ник в Telegram (например: ivan_petrov)" }, { status: 400 });
  }
  const model = String(form.get("model") ?? "").trim().slice(0, 120);
  const comment = String(form.get("comment") ?? "").trim().slice(0, 500);

  const photos = form.getAll("photos").filter((p): p is File => p instanceof Blob && p.size > 0);
  if (photos.length < LEGIT_MIN_PHOTOS) {
    return NextResponse.json({ error: `Нужно минимум ${LEGIT_MIN_PHOTOS} фото со всех сторон` }, { status: 400 });
  }
  if (photos.length > LEGIT_MAX_PHOTOS) {
    return NextResponse.json({ error: `Не больше ${LEGIT_MAX_PHOTOS} фото` }, { status: 400 });
  }
  for (const p of photos) {
    if (!p.type.startsWith("image/")) return NextResponse.json({ error: "Все файлы должны быть фото" }, { status: 400 });
    if (p.size > LEGIT_MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Одно из фото слишком большое — попробуйте другое" }, { status: 400 });
    }
  }

  const caption = [
    `🔎 <b>Легит-чек Rick Owens — YenWay</b>`,
    ``,
    model ? `Модель: ${escapeHtml(model)}` : null,
    comment ? `Комментарий: ${escapeHtml(comment)}` : null,
    `Клиент: @${username}`,
    `Фото: ${photos.length}`,
    ``,
    `Стоимость проверки — ${LEGIT_FEE_RUB} ₽ (обсудить с клиентом).`
  ]
    .filter((x) => x !== null)
    .join("\n");

  const sent =
    (await sendTelegramAlbum(photos, caption)) ||
    (await sendTelegramMessage(`${caption}\n\n⚠️ Фото отправить не удалось — попросите клиента прислать их в личку.`));
  if (!sent) {
    return NextResponse.json(
      { error: "Не удалось отправить заявку. Напишите нам напрямую в Telegram: @yenwayceo" },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
