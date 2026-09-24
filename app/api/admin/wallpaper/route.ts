import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";

// Обои админки лежат вне /public и отдаются только после входа —
// журнальное фото не должно быть доступно посетителям сайта.
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return new NextResponse(null, { status: 401 });
  const file = await readFile(path.join(process.cwd(), "private", "admin-wallpaper.jpg"));
  return new NextResponse(file, {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400" }
  });
}
