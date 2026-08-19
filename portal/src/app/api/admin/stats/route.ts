import { NextResponse } from "next/server";
import { requireAdminFrom } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { MISSIONS } from "@/lib/challenges";

export async function GET(req: Request) {
  if (!requireAdminFrom(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const db = await readDb();
  const dist = MISSIONS.map((m) => ({
    id: m.id,
    title: m.short,
    count: db.teams.filter((t) => t.challengeId === m.id).length,
  }));
  const participants = db.participants.map((p) => {
    const u = db.users.find((x) => x.id === p.userId);
    const team = db.teams.find((t) => t.id === p.teamId);
    const ck = db.checkins.find((c) => c.participantId === p.id);
    const mission = MISSIONS.find((m) => m.id === team?.challengeId);
    return {
      id: p.id,
      participantCode: p.participantCode,
      name: u?.name,
      email: u?.email,
      phone: u?.phone,
      college: u?.college,
      studentId: u?.studentId,
      role: p.role,
      teamCode: team?.teamCode,
      teamName: team?.teamName,
      challengeId: team?.challengeId,
      mission: mission?.short,
      checkedIn: !!ck,
      checkedInAt: ck?.checkedInAt || null,
    };
  });
  const recent = [...db.checkins]
    .sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt))
    .slice(0, 12)
    .map((c) => {
      const row = participants.find((p) => p.id === c.participantId);
      return {
        ...c,
        name: row?.name,
        participantCode: row?.participantCode,
        teamCode: row?.teamCode,
        mission: row?.mission,
      };
    });
  return NextResponse.json({
    ok: true,
    totals: {
      teams: db.teams.length,
      participants: db.participants.length,
      checkedIn: db.checkins.length,
      pending: Math.max(0, db.participants.length - db.checkins.length),
    },
    dist,
    teams: db.teams.map((t) => {
      const members = participants.filter((p) => p.teamCode === t.teamCode);
      const inCount = members.filter((m) => m.checkedIn).length;
      return {
        ...t,
        mission: MISSIONS.find((m) => m.id === t.challengeId)?.short,
        arrived: inCount,
        size: members.length,
        teamStatus: inCount === 0 ? "NOT ARRIVED" : inCount === members.length ? "FULL TEAM ARRIVED" : "PARTIALLY ARRIVED",
      };
    }),
    participants,
    recent,
  });
}
