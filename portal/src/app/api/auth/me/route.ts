import { NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/auth";
import { readDb, teamByUser } from "@/lib/db";
import { MISSIONS } from "@/lib/challenges";

export async function GET(req: Request) {
  const s = sessionFromRequest(req);
  if (!s) return NextResponse.json({ ok: false }, { status: 401 });
  if (s.role === "admin") return NextResponse.json({ ok: true, role: "admin" });
  const db = await readDb();
  const user = db.users.find((u) => u.id === s.uid);
  const bound = user ? teamByUser(db, user.id) : null;
  if (!user || !bound) return NextResponse.json({ ok: false }, { status: 404 });
  const members = db.participants
    .filter((p) => p.teamId === bound.team.id)
    .map((p) => {
      const u = db.users.find((x) => x.id === p.userId);
      return {
        name: u?.name,
        email: u?.email,
        participantCode: p.participantCode,
        role: p.role,
        checkinToken: p.checkinToken,
        college: u?.college,
      };
    });
  const mission = MISSIONS.find((m) => m.id === bound.team.challengeId);
  return NextResponse.json({
    ok: true,
    role: "participant",
    user: { name: user.name, email: user.email, college: user.college },
    team: bound.team,
    me: bound.me,
    members,
    mission,
    checkedIn: db.checkins.some((c) => c.participantId === bound.me.id),
  });
}
