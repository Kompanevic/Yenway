import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "yenway_admin";

export function isAuthed(req: NextRequest): boolean {
  const val = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return !!process.env.ADMIN_PASSWORD && val === process.env.ADMIN_PASSWORD;
}
