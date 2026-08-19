import { NextResponse } from "next/server";
import { requireAdminFrom } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { MISSIONS } from "@/lib/challenges";

export async function GET(req: Request) {
  if (!requireAdminFrom(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const db = await readDb();
  const head = [
    "Participant ID",
    "Name",
    "Email",
    "Phone",
    "College",
    "Team ID",
    "Team Name",
    "Mission",
    "Registration Status",
    "Check-in Status",
    "Check-in Time",
  ];
  const rows = [head.join(",")];
  for (const p of db.participants) {
    const u = db.users.find((x) => x.id === p.userId);
    const t = db.teams.find((x) => x.id === p.teamId);
    const ck = db.checkins.find((c) => c.participantId === p.id);
    const mission = MISSIONS.find((m) => m.id === t?.challengeId);
    const cells = [
      p.participantCode,
      u?.name,
      u?.email,
      u?.phone,
      u?.college,
      t?.teamCode,
      t?.teamName,
      mission?.title || t?.challengeId,
      "REGISTERED",
      ck ? "CHECKED IN" : "PENDING",
      ck?.checkedInAt || "",
    ].map((v) => `"${String(v || "").replace(/"/g, '""')}"`);
    rows.push(cells.join(","));
  }
  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=leviathon-export.csv",
    },
  });
}
