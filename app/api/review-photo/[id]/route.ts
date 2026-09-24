import { NextRequest, NextResponse } from "next/server";
import { getReview, getPhoto } from "@/lib/reviews-store";
import { isAuthed } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const review = await getReview(params.id);
  // Фото отзыва на модерации видит только админ.
  if (!review?.hasPhoto || (review.status !== "published" && !isAuthed(req))) {
    return new NextResponse(null, { status: 404 });
  }
  const photo = await getPhoto(params.id);
  if (!photo) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(photo.data, "base64"), {
    headers: {
      "Content-Type": photo.type,
      "Cache-Control":
        review.status === "published" ? "public, max-age=31536000, s-maxage=31536000, immutable" : "private, no-store"
    }
  });
}
