import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { getAll, addPublished } from "@/lib/reviews-store";
import { parseReviewForm } from "@/lib/review-input";

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const reviews = await getAll();
  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Некорректные данные формы" }, { status: 400 });

  const parsed = await parseReviewForm(form, 2);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const review = await addPublished(parsed.value);
    return NextResponse.json({ review });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка хранилища" }, { status: 500 });
  }
}
