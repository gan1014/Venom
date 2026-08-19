import { NextResponse } from "next/server";
import { requireAdminFrom } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { fail } from "@/lib/validate";
import { limited } from "@/lib/ratelimit";
import { parseQrToken, participantPayload } from "@/lib/checkin";

export async function POST(req: Request) {
  const admin = requireAdminFrom(req);
  if (!admin) return NextResponse.json(fail("ACCESS DENIED"), { status: 401 });
  if (limited("lookup:" + admin.uid, 40, 20_000)) {
    return NextResponse.json(fail("SCANNER THROTTLED"), { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const token = parseQrToken(String(body.token || ""));
  if (!token) return NextResponse.json({ ok: false, status: "denied" }, { status: 400 });
  const db = await readDb();
  const hit = participantPayload(db, token);
  if (!hit) return NextResponse.json({ ok: true, status: "unknown" });
  return NextResponse.json({
    ok: true,
    status: hit.already ? "already" : "found",
    ...hit,
  });
}
