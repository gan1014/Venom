import { NextResponse } from "next/server";
import { requireAdminFrom } from "@/lib/auth";
import { addCheckin, uid, withDb } from "@/lib/db";
import { fail } from "@/lib/validate";
import { limited } from "@/lib/ratelimit";
import { parseQrToken, participantPayload } from "@/lib/checkin";

export async function POST(req: Request) {
  const admin = requireAdminFrom(req);
  if (!admin) return NextResponse.json(fail("ACCESS DENIED"), { status: 401 });
  if (limited("checkin:" + admin.uid, 30, 20_000)) {
    return NextResponse.json(fail("SCANNER THROTTLED"), { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const token = parseQrToken(String(body.token || ""));
  if (!token) return NextResponse.json({ ok: false, status: "denied" }, { status: 400 });

  const result = await withDb((db) => {
    const before = participantPayload(db, token);
    if (!before) return { status: "unknown" as const };
    if (before.already) return { status: "already" as const, ...before };
    const rec = {
      id: uid("ck"),
      participantId: before.participantId,
      teamId: before.teamId,
      registrationId: before.participantId,
      checkedInAt: new Date().toISOString(),
      checkedInBy: admin.uid,
    };
    addCheckin(db, rec);
    const after = participantPayload(db, token);
    return { status: "granted" as const, ...after };
  });

  return NextResponse.json({ ok: true, ...result });
}
