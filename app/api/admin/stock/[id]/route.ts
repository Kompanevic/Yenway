import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { removeListing, setListingStatus } from "@/lib/listings-store";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (status !== "published" && status !== "sold") {
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
  try {
    await setListingStatus(params.id, status);
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
