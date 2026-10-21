import { NextRequest, NextResponse } from "next/server";
import { addView } from "@/lib/listing-stats";
import { getListing } from "@/lib/listings-store";
import { checkRateLimit } from "@/lib/rate-limit";

// Просмотр вещи (браузер присылает один раз за сессию).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await checkRateLimit(req, `view:${params.id}`, 3, 3600))) return NextResponse.json({ ok: true });
  if (await getListing(params.id)) await addView(params.id);
  return NextResponse.json({ ok: true });
}
