import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { getAll, addPublished } from "@/lib/reviews-store";

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const reviews = await getAll();
  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const usernameRaw: string | undefined = body?.username;
  const rating: number | undefined = body?.rating;
  const textRaw: string | undefined = body?.text;

  if (!usernameRaw || !rating || !textRaw) {
    return NextResponse.json({ error: "Заполните ник, оценку и текст" }, { status: 400 });
  }
  const username = usernameRaw.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9_]{4,32}$/.test(username)) {
    return NextResponse.json({ error: "Некорректный ник в Telegram" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Оценка должна быть от 1 до 5" }, { status: 400 });
  }
  const text = textRaw.trim().slice(0, 1000);
  if (text.length < 2) {
    return NextResponse.json({ error: "Текст отзыва слишком короткий" }, { status: 400 });
  }

  try {
    const review = await addPublished({ username, rating, text });
    return NextResponse.json({ review });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка хранилища" }, { status: 500 });
  }
}
