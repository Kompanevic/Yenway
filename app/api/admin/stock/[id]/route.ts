import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { getListing, getListingPhoto, removeListing, setListingStatus } from "@/lib/listings-store";
import { postToChannel } from "@/lib/listing-input";
import { SITE_URL } from "@/lib/site";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (status !== "published" && status !== "sold") {
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
  try {
    const before = await getListing(params.id);
    const listing = await setListingStatus(params.id, status);
    // Прошло модерацию — пост в канал (при «Вернуть» из проданных не дублируем).
    if (before?.status === "pending" && status === "published") {
      const photo = await getListingPhoto(params.id, 0);
      if (photo) {
        const blob = new Blob([Buffer.from(photo.data, "base64")], { type: photo.type });
        await postToChannel(listing, blob, SITE_URL);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  try {
    await removeListing(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка" }, { status: 400 });
  }
}
