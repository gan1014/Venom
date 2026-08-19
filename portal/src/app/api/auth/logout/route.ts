import { NextResponse } from "next/server";
import { applyLogout } from "@/lib/auth";

export async function POST(req: Request) {
  return applyLogout(NextResponse.json({ ok: true }), req);
}
