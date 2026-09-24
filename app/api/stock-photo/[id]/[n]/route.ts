import { NextRequest, NextResponse } from "next/server";
import { getListing, getListingPhoto } from "@/lib/listings-store";
import { isAuthed } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string; n: string } }) {
  const listing = await getListing(params.id);
  const n = Number(params.n);
  // Фото объявлений на модерации видит только админ.
  if (!listing || !Number.isInteger(n) || n < 0 || n >= listing.photoCount) {
    return new NextResponse(null, { status: 404 });
  }
  const isPublic = listing.status !== "pending";
  if (!isPublic && !isAuthed(req)) return new NextResponse(null, { status: 404 });

  const photo = await getListingPhoto(params.id, n);
  if (!photo) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(photo.data, "base64"), {
    headers: {
      "Content-Type": photo.type,
      "Cache-Control": isPublic ? "public, max-age=31536000, s-maxage=31536000, immutable" : "private, no-store"
    }
  });
}
