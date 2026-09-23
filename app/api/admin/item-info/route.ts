import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { fetchItemInfo } from "@/lib/item-info";

// Страница + запасной запрос к API площадки могут не уложиться в дефолтные 10 с.
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const body = await req.json().catch(() => null);
  let url: URL;
  try {
    url = new URL(String(body?.url ?? ""));
    if (!/^https?:$/.test(url.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Некорректная ссылка" }, { status: 400 });
  }

  return NextResponse.json(await fetchItemInfo(url.toString()));
}
