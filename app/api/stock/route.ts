import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { addListing } from "@/lib/listings-store";
import { notifyListing, parseListingForm } from "@/lib/listing-input";
import { SITE_URL } from "@/lib/site";

export async function POST(req: NextRequest) {
  const allowed = await checkRateLimit(req, "listing", 3, 600);
  if (!allowed) {
    return NextResponse.json({ error: "Слишком много объявлений. Попробуйте через несколько минут." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Некорректные данные формы" }, { status: 400 });

  const parsed = await parseListingForm(form, false);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const listing = await addListing(parsed.value, parsed.photos, "pending");
    await notifyListing(listing, parsed.blobs, SITE_URL);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка хранилища" }, { status: 500 });
  }
}
