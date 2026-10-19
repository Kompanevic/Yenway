import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { editListing, removeListing, setListingKind, setListingStatus } from "@/lib/listings-store";
import { parseListingEdit } from "@/lib/listing-input";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const body = await req.json().catch(() => null);
  // Правка полей объявления
  if (body?.edit) {
    const parsed = parseListingEdit(body.edit);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    try {
      return NextResponse.json({ listing: await editListing(params.id, parsed.value) });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка" }, { status: 400 });
    }
  }
  // Перенос между «Под заказ» и «Выкупленные»
  if (body?.kind === "bought" || body?.kind === "preorder") {
    try {
      await setListingKind(params.id, body.kind);
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка" }, { status: 400 });
    }
  }
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
