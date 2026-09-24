import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { addListing, getListings } from "@/lib/listings-store";
import { notifyListing, parseListingForm } from "@/lib/listing-input";
import { SITE_URL } from "@/lib/site";

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  return NextResponse.json({ listings: await getListings() });
}

// Своя вещь: публикуется сразу, пост уходит в бота объявлений.
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Некорректные данные формы" }, { status: 400 });

  const parsed = await parseListingForm(form, true);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const listing = await addListing(parsed.value, parsed.photos, "published");
    const notified = await notifyListing(listing, parsed.blobs, SITE_URL, parsed.calc);
    return NextResponse.json({ listing, notified });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка хранилища" }, { status: 500 });
  }
}
