import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";

const MAX_BYTES = 15 * 1024 * 1024;

// Картинки площадок нельзя обработать в браузере напрямую (CORS) —
// отдаём их с нашего домена. Только для админа, чтобы не быть открытым прокси.
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return new NextResponse(null, { status: 401 });

  let url: URL;
  try {
    url = new URL(req.nextUrl.searchParams.get("url") ?? "");
    if (!/^https?:$/.test(url.protocol)) throw new Error();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Referer: url.origin + "/"
      }
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return new NextResponse(null, { status: 502 });
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return new NextResponse(null, { status: 413 });
    return new NextResponse(buf, { headers: { "Content-Type": type, "Cache-Control": "private, no-store" } });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
