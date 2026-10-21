import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { REQUEST_STATUS_LABEL, removeRequest, setRequestStatus, type RequestStatus } from "@/lib/requests-store";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  const status = (await req.json().catch(() => null))?.status as RequestStatus;
  if (!Object.prototype.hasOwnProperty.call(REQUEST_STATUS_LABEL, status)) {
    return NextResponse.json({ error: "Неизвестный статус" }, { status: 400 });
  }
  try {
    return NextResponse.json({ request: await setRequestStatus(params.id, status) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  await removeRequest(params.id);
  return NextResponse.json({ ok: true });
}
