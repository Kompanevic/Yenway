import { NextRequest, NextResponse } from "next/server";
import { sendTelegramPhoto, sendTelegramMessage, escapeHtml } from "@/lib/telegram";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const SEARCH_FEE_RUB = 450;

export async function POST(req: NextRequest) {
  const allowed = await checkRateLimit(req, "search", 5, 600);
  if (!allowed) {
    return NextResponse.json({ error: "Слишком много заявок. Попробуйте через несколько минут." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Некорректные данные формы" }, { status: 400 });
  }

  const usernameRaw = form.get("username");
  const itemNameRaw = form.get("itemName");
  const descriptionRaw = form.get("description");
  const photo = form.get("photo");

  if (typeof usernameRaw !== "string" || typeof itemNameRaw !== "string" || !(photo instanceof Blob)) {
    return NextResponse.json({ error: "Заполните фото, ник и название вещи" }, { status: 400 });
  }

  const username = usernameRaw.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9_]{4,32}$/.test(username)) {
    return NextResponse.json({ error: "Некорректный ник в Telegram (например: ivan_petrov)" }, { status: 400 });
  }

  const itemName = itemNameRaw.trim().slice(0, 200);
  if (itemName.length < 2) {
    return NextResponse.json({ error: "Укажите название вещи" }, { status: 400 });
  }

  if (photo.size === 0 || !photo.type.startsWith("image/")) {
    return NextResponse.json({ error: "Приложите фото вещи" }, { status: 400 });
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Фото слишком большое (макс. 4 МБ)" }, { status: 400 });
  }

  const description = typeof descriptionRaw === "string" ? descriptionRaw.trim().slice(0, 500) : "";

  const lines = [
    `🔍 <b>Заявка на поиск/выкуп — YenWay</b>`,
    ``,
    `Вещь: ${escapeHtml(itemName)}`,
    description ? `Описание/размер: ${escapeHtml(description)}` : null,
    `Покупатель: @${username}`,
    ``,
    `Услуга поиска платная — ${SEARCH_FEE_RUB} ₽ (обсудить с клиентом).`
  ]
    .filter(Boolean)
    .join("\n");

  const photoName = photo instanceof File ? photo.name : "item.jpg";
  let sent = await sendTelegramPhoto(photo, photoName, lines);
  if (!sent) {
    sent = await sendTelegramMessage(`${lines}\n\n⚠️ Фото отправить не удалось.`);
  }

  return NextResponse.json({ notified: sent, fee: SEARCH_FEE_RUB });
}
