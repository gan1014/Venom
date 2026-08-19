import { NextResponse } from "next/server";
import { adminCreds, applySession, verifyPassword } from "@/lib/auth";
import { findUserByEmail, readDb } from "@/lib/db";
import { clean, fail, isEmail } from "@/lib/validate";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = clean(body.email).toLowerCase();
  const password = String(body.password || "");
  const asAdmin = Boolean(body.admin);
  if (!isEmail(email) || password.length < 6) {
    return NextResponse.json(fail("IDENTITY VERIFICATION FAILED"), { status: 400 });
  }
  if (asAdmin) {
    const a = adminCreds();
    if (email !== a.email || password !== a.password) {
      return NextResponse.json(fail("ACCESS DENIED"), { status: 401 });
    }
    return applySession(NextResponse.json({ ok: true, role: "admin" }), "admin", "admin", req);
  }
  const db = await readDb();
  const user = findUserByEmail(db, email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(fail("IDENTITY VERIFICATION FAILED"), { status: 401 });
  }
  return applySession(NextResponse.json({ ok: true, role: "participant" }), user.id, "participant", req);
}
