import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Session, UserRole } from "./types";

const COOKIE = "lv_session";

function secret() {
  return process.env.AUTH_SECRET || "leviathan-local-dev-secret-change-me-32b";
}

function sign(data: string) {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

export function hashPassword(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

export function verifyPassword(pw: string, hash: string) {
  return bcrypt.compareSync(pw, hash);
}

export function makeSession(uid: string, role: UserRole): string {
  const payload: Session = { uid, role, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function parseSession(raw?: string | null): Session | null {
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig || sign(body) !== sig) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    if (!s.exp || s.exp < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

function cookieOpts(req?: Request) {
  const proto = (req?.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
  const https = proto === "https";
  return {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: (https ? "none" : "lax") as "none" | "lax",
    secure: https,
  };
}

export function applySession(res: NextResponse, uid: string, role: UserRole, req?: Request) {
  res.cookies.set(COOKIE, makeSession(uid, role), cookieOpts(req));
  return res;
}

export function applyLogout(res: NextResponse, req?: Request) {
  res.cookies.set(COOKIE, "", { ...cookieOpts(req), maxAge: 0 });
  return res;
}

export function setSessionCookie(uid: string, role: UserRole) {
  cookies().set(COOKIE, makeSession(uid, role), cookieOpts());
}

export function clearSession() {
  cookies().delete(COOKIE);
}

function cookieFromHeader(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return rest.join("=");
      }
    }
  }
  return null;
}

export function getSession(): Session | null {
  try {
    return parseSession(cookies().get(COOKIE)?.value);
  } catch {
    return null;
  }
}

export function sessionFromRequest(req: Request): Session | null {
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const s = parseSession(auth.slice(7).trim());
    if (s) return s;
  }
  const custom = parseSession(req.headers.get("x-lv-token"));
  if (custom) return custom;
  try {
    const q = parseSession(new URL(req.url).searchParams.get("access"));
    if (q) return q;
  } catch {
    /* ignore */
  }
  const fromReq = parseSession(cookieFromHeader(req, COOKIE));
  if (fromReq) return fromReq;
  return getSession();
}

export function requireAdminFrom(req?: Request) {
  const s = req ? sessionFromRequest(req) : getSession();
  if (!s || s.role !== "admin") return null;
  return s;
}

export function requireUser() {
  const s = getSession();
  if (!s || s.role !== "participant") return null;
  return s;
}

export function requireAdmin() {
  const s = getSession();
  if (!s || s.role !== "admin") return null;
  return s;
}

export function adminCreds() {
  return {
    email: (process.env.ADMIN_EMAIL || "admin@leviathan.local").toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "LEVIATHAN-ADMIN-2026",
  };
}
