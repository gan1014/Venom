import { NextResponse } from "next/server";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { MISSIONS } from "@/lib/challenges";
import { addParticipant, addTeam, addUser, nextTeamCode, token, uid, withDb } from "@/lib/db";
import { clean, fail, isEmail, isPhone } from "@/lib/validate";
import { passesForTeam } from "@/lib/db";

type MemberIn = {
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  studentId: string;
  password: string;
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json(fail("CONNECTION INTERRUPTED"), { status: 400 });

  const teamName = clean(body.teamName);
  const college = clean(body.college);
  const department = clean(body.department);
  const teamSize = Number(body.teamSize);
  const challengeId = clean(body.challengeId);
  const leader = body.leader as MemberIn;
  const members = (body.members || []) as MemberIn[];

  if (!teamName || !college || !department) return NextResponse.json(fail("IDENTITY VERIFICATION FAILED — TEAM CORE INCOMPLETE"), { status: 400 });
  if (![2, 3, 4].includes(teamSize)) return NextResponse.json(fail("TEAM SIZE MUST BE 2–4"), { status: 400 });
  if (!MISSIONS.some((m) => m.id === challengeId)) return NextResponse.json(fail("MISSION NOT RECOGNIZED"), { status: 400 });
  if (!body.confirm) return NextResponse.json(fail("CONFIRMATION REQUIRED"), { status: 400 });

  const people = [leader, ...members];
  if (people.length !== teamSize) return NextResponse.json(fail("SYMBIOTE COUNT DOES NOT MATCH TEAM SIZE"), { status: 400 });

  for (const p of people) {
    if (!clean(p?.name) || !isEmail(clean(p?.email)) || !isPhone(clean(p?.phone))) {
      return NextResponse.json(fail("IDENTITY VERIFICATION FAILED — INVALID SYMBIOTE RECORD"), { status: 400 });
    }
    if (!clean(p.college) || !clean(p.department) || !clean(p.year) || !clean(p.studentId)) {
      return NextResponse.json(fail("IDENTITY VERIFICATION FAILED — INCOMPLETE RECORD"), { status: 400 });
    }
    if (!p.password || String(p.password).length < 8) {
      return NextResponse.json(fail("ACCESS KEY MUST BE AT LEAST 8 CHARACTERS"), { status: 400 });
    }
  }

  const emails = people.map((p) => clean(p.email).toLowerCase());
  const sids = people.map((p) => clean(p.studentId).toLowerCase());
  if (new Set(emails).size !== emails.length) return NextResponse.json(fail("DUPLICATE EMAIL DETECTED"), { status: 400 });
  if (new Set(sids).size !== sids.length) return NextResponse.json(fail("DUPLICATE STUDENT ID DETECTED"), { status: 400 });

  try {
    const result = await withDb((db) => {
      for (const e of emails) {
        if (db.users.some((u) => u.email.toLowerCase() === e)) throw new Error("EMAIL ALREADY BOUND");
      }
      for (const s of sids) {
        if (db.users.some((u) => u.studentId.toLowerCase() === s)) throw new Error("STUDENT ID ALREADY BOUND");
      }

      const teamCode = nextTeamCode(db);
      const createdAt = new Date().toISOString();
      const userIds: string[] = [];

      people.forEach((p) => {
        const id = uid("usr");
        userIds.push(id);
        addUser(db, {
          id,
          email: clean(p.email).toLowerCase(),
          passwordHash: hashPassword(String(p.password)),
          name: clean(p.name),
          phone: clean(p.phone),
          college: clean(p.college),
          department: clean(p.department),
          year: clean(p.year),
          studentId: clean(p.studentId),
          createdAt,
        });
      });

      const teamId = uid("tm");
      addTeam(db, {
        id: teamId,
        teamCode,
        teamName,
        college,
        department,
        leaderUserId: userIds[0],
        teamSize: teamSize as 2 | 3 | 4,
        challengeId,
        status: "registered",
        createdAt,
      });

      const num = teamCode.replace("LV-", "");
      userIds.forEach((userId, i) => {
        addParticipant(db, {
          id: uid("pt"),
          participantCode: `SYMBIOTE-LV${num}-${String(i + 1).padStart(2, "0")}`,
          teamId,
          userId,
          role: i === 0 ? "leader" : "member",
          checkinToken: token(),
          createdAt,
        });
      });

      const team = db.teams.find((t) => t.id === teamId)!;
      setSessionCookie(userIds[0], "participant");
      return { team, passes: passesForTeam(db, team) };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "CONNECTION INTERRUPTED";
    return NextResponse.json(fail(msg), { status: 409 });
  }
}
