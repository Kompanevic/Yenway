import { NextResponse } from "next/server";
import { getVerdict, getVerdictPhoto } from "@/lib/legit-store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string; n: string } }) {
  const verdict = await getVerdict(params.id);
  const n = Number(params.n);
  if (!verdict || !Number.isInteger(n) || n < 0 || n >= verdict.photoCount) {
    return new NextResponse(null, { status: 404 });
  }
  const photo = await getVerdictPhoto(params.id, n);
  if (!photo) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(photo.data, "base64"), {
    headers: { "Content-Type": photo.type, "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable" }
  });
}
