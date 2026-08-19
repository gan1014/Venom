import { promises as fs } from "fs";
import path from "path";
import type { Checkin, DB, Participant, Team, User } from "./types";

const FILE = path.join(process.cwd(), "data", "db.json");

const empty = (): DB => ({
  teamSeq: 1,
  users: [],
  teams: [],
  participants: [],
  checkins: [],
});

let lock: Promise<unknown> = Promise.resolve();

async function read(): Promise<DB> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as DB;
  } catch {
    return empty();
  }
}

async function write(db: DB) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

export function withDb<T>(fn: (db: DB) => Promise<T> | T): Promise<T> {
  const run = lock.then(async () => {
    const db = await read();
    const out = await fn(db);
    await write(db);
    return out;
  });
  lock = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export async function readDb(): Promise<DB> {
  return structuredClone(await read());
}

export function uid(prefix = "id"): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function nextTeamCode(db: DB): string {
  const used = new Set(db.teams.map((t) => t.teamCode));
  let n = db.teamSeq;
  let code = `LV-${String(n).padStart(4, "0")}`;
  while (used.has(code)) {
    n += 1;
    code = `LV-${String(n).padStart(4, "0")}`;
  }
  db.teamSeq = n + 1;
  return code;
}

export function token(): string {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type PublicPass = {
  participantCode: string;
  teamCode: string;
  teamName: string;
  name: string;
  college: string;
  role: string;
  challengeId: string;
  checkinToken: string;
};

export function passesForTeam(db: DB, team: Team): PublicPass[] {
  return db.participants
    .filter((p) => p.teamId === team.id)
    .map((p) => {
      const u = db.users.find((x) => x.id === p.userId);
      return {
        participantCode: p.participantCode,
        teamCode: team.teamCode,
        teamName: team.teamName,
        name: u?.name || "UNKNOWN",
        college: u?.college || team.college,
        role: p.role,
        challengeId: team.challengeId,
        checkinToken: p.checkinToken,
      };
    });
}

export function findUserByEmail(db: DB, email: string): User | undefined {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function teamByUser(db: DB, userId: string): { team: Team; me: Participant } | null {
  const me = db.participants.find((p) => p.userId === userId);
  if (!me) return null;
  const team = db.teams.find((t) => t.id === me.teamId);
  if (!team) return null;
  return { team, me };
}

export function addUser(db: DB, user: User) {
  db.users.push(user);
}
export function addTeam(db: DB, team: Team) {
  db.teams.push(team);
}
export function addParticipant(db: DB, p: Participant) {
  db.participants.push(p);
}
export function addCheckin(db: DB, c: Checkin) {
  db.checkins.push(c);
}
