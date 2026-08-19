export type Role = "leader" | "member";
export type UserRole = "participant" | "admin";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  studentId: string;
  createdAt: string;
};

export type Team = {
  id: string;
  teamCode: string;
  teamName: string;
  college: string;
  department: string;
  leaderUserId: string;
  teamSize: 2 | 3 | 4;
  challengeId: string;
  status: "registered";
  createdAt: string;
};

export type Participant = {
  id: string;
  participantCode: string;
  teamId: string;
  userId: string;
  role: Role;
  checkinToken: string;
  createdAt: string;
};

export type Checkin = {
  id: string;
  participantId: string;
  teamId: string;
  registrationId: string;
  checkedInAt: string;
  checkedInBy: string;
};

export type DB = {
  teamSeq: number;
  users: User[];
  teams: Team[];
  participants: Participant[];
  checkins: Checkin[];
};

export type Session = {
  uid: string;
  role: UserRole;
  exp: number;
};
