import { MISSIONS } from "./challenges";
import type { DB } from "./types";

export function parseQrToken(raw: string) {
  let t = String(raw || "").trim();
  if (t.startsWith("LEVIATHAN:")) t = t.slice("LEVIATHAN:".length);
  if (t.startsWith("LEGO-LEVIATHON:")) t = t.slice("LEGO-LEVIATHON:".length);
  return t.trim();
}

export function participantPayload(db: DB, token: string) {
  const p = db.participants.find((x) => x.checkinToken === token);
  if (!p) return null;
  const user = db.users.find((u) => u.id === p.userId);
  const team = db.teams.find((t) => t.id === p.teamId);
  const mission = MISSIONS.find((m) => m.id === team?.challengeId);
  const existing = db.checkins.find((c) => c.participantId === p.id);
  const members = db.participants
    .filter((x) => x.teamId === p.teamId)
    .map((x) => {
      const u = db.users.find((uu) => uu.id === x.userId);
      const ck = db.checkins.find((c) => c.participantId === x.id);
      return {
        participantCode: x.participantCode,
        name: u?.name || "UNKNOWN",
        role: x.role,
        checkedIn: !!ck,
        checkedInAt: ck?.checkedInAt || null,
      };
    });
  const inCount = members.filter((m) => m.checkedIn).length;
  const teamStatus =
    inCount === 0 ? "NOT ARRIVED" : inCount === members.length ? "FULL TEAM ARRIVED" : "PARTIALLY ARRIVED";
  return {
    token,
    participantId: p.id,
    name: user?.name || "UNKNOWN",
    email: user?.email || "",
    phone: user?.phone || "",
    college: user?.college || team?.college || "",
    department: user?.department || team?.department || "",
    participantCode: p.participantCode,
    role: p.role,
    teamId: team?.id || "",
    teamCode: team?.teamCode || "",
    teamName: team?.teamName || "",
    mission: mission?.title || team?.challengeId || "",
    missionShort: mission?.short || "",
    registrationStatus: existing ? "CHECKED IN" : "REGISTERED",
    already: !!existing,
    checkedInAt: existing?.checkedInAt || null,
    checkedInBy: existing?.checkedInBy || null,
    members,
    teamStatus,
  };
}
