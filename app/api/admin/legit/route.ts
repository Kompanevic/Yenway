import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { addVerdict, getVerdicts } from "@/lib/legit-store";
import { LEGIT_MAX_PHOTO_BYTES, VERDICT_MAX_PHOTOS, type VerdictKind } from "@/lib/legit";

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  return NextResponse.json({ verdicts: await getVerdicts() });
}

// Публикация вердикта: модель, LEGIT/FAKE, комментарий и фото.
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Некорректные данные формы" }, { status: 400 });

  const title = String(form.get("title") ?? "").trim().slice(0, 120);
  const verdict = String(form.get("verdict") ?? "") as VerdictKind;
  const note = String(form.get("note") ?? "").trim().slice(0, 800);
  if (title.length < 2) return NextResponse.json({ error: "Укажите модель" }, { status: 400 });
  if (verdict !== "legit" && verdict !== "fake") return NextResponse.json({ error: "Выберите вердикт" }, { status: 400 });

  const blobs = form.getAll("photos").filter((p): p is File => p instanceof Blob && p.size > 0);
  if (blobs.length === 0) return NextResponse.json({ error: "Добавьте хотя бы одно фото" }, { status: 400 });
  if (blobs.length > VERDICT_MAX_PHOTOS) return NextResponse.json({ error: `Не больше ${VERDICT_MAX_PHOTOS} фото` }, { status: 400 });
  for (const b of blobs) {
    if (!b.type.startsWith("image/") || b.size > LEGIT_MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Фото должно быть изображением до 800 КБ" }, { status: 400 });
    }
  }
  const photos = await Promise.all(
    blobs.map(async (b) => ({ type: b.type, data: Buffer.from(await b.arrayBuffer()).toString("base64") }))
  );

  try {
    return NextResponse.json({ verdict: await addVerdict({ title, verdict, note }, photos) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка хранилища" }, { status: 500 });
  }
}
