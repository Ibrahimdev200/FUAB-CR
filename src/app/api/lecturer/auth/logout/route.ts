import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  await clearSessionCookie("lecturer");
  return NextResponse.json({ success: true });
}
