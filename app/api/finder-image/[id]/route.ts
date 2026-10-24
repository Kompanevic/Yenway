import { NextRequest, NextResponse } from "next/server";
import { getStashedImage } from "@/lib/finder";

// Временная картинка для Google Lens (живёт 15 минут).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const img = await getStashedImage(params.id.replace(/\.\w+$/, ""));
  if (!img) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(Buffer.from(img.data, "base64"), {
    headers: { "Content-Type": img.type, "Cache-Control": "private, no-store" }
  });
}
