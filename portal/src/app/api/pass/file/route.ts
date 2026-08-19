import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { readDb } from "@/lib/db";
import { parseQrToken } from "@/lib/checkin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = parseQrToken(url.searchParams.get("token") || "");
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });
  const db = await readDb();
  const p = db.participants.find((x) => x.checkinToken === token);
  if (!p) return NextResponse.json({ ok: false }, { status: 404 });
  const png = await QRCode.toBuffer(token, { margin: 1, width: 640, errorCorrectionLevel: "M" });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${p.participantCode}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
