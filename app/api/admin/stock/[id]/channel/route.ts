import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { getListing, getListingPhoto, kindOf } from "@/lib/listings-store";
import { postBoughtToChannel } from "@/lib/listing-input";

// Пост «ВЫКУПЛЕНО» в канал для вещи из «Выкупленных».
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const listing = await getListing(params.id);
  if (!listing || kindOf(listing) !== "bought") {
    return NextResponse.json({ error: "Вещь не найдена в «Выкупленных»" }, { status: 404 });
  }
  const photo = await getListingPhoto(params.id, 0);
  if (!photo) return NextResponse.json({ error: "У вещи нет фото" }, { status: 400 });

  const err = await postBoughtToChannel(listing, new Blob([Buffer.from(photo.data, "base64")], { type: photo.type }));
  if (err) return NextResponse.json({ error: `Telegram: ${err}` }, { status: 502 });
  return NextResponse.json({ ok: true });
}
