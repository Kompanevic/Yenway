import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { setListingsCategory } from "@/lib/listings-store";
import { LISTING_CATEGORIES } from "@/lib/listing-constants";

// Массовая разметка типов: { ids: string[], category: string } (пустая строка — снять тип).
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x: unknown): x is string => typeof x === "string").slice(0, 500) : [];
  const category = typeof body?.category === "string" ? body.category : "";
  if (ids.length === 0) return NextResponse.json({ error: "Не выбрано ни одной вещи" }, { status: 400 });
  if (category && !LISTING_CATEGORIES.includes(category)) return NextResponse.json({ error: "Неизвестный тип вещи" }, { status: 400 });
  const updated = await setListingsCategory(ids, category || undefined);
  return NextResponse.json({ updated });
}
