import { NextResponse } from "next/server";
import { adminCreds, applySession, makeSession } from "@/lib/auth";
import { clean, fail, isEmail } from "@/lib/validate";
import { limited } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (limited("admin-login:" + ip, 8, 10 * 60_000)) {
    return NextResponse.json(fail("ACCESS LOCKED"), { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const email = clean(body.email).toLowerCase();
  const password = String(body.password || "");
  if (!isEmail(email) || password.length < 6) {
    return NextResponse.json(fail("ACCESS DENIED"), { status: 400 });
  }
  const a = adminCreds();
  if (email !== a.email || password !== a.password) {
    return NextResponse.json(fail("ACCESS DENIED"), { status: 401 });
  }
  const token = makeSession("admin", "admin");
  const res = NextResponse.json({ ok: true, role: "admin", token });
  return applySession(res, "admin", "admin", req);
}
