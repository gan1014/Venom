"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PassCard, type Pass } from "../../components/PassCard";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      if (!r.ok) {
        router.push("/login");
        return;
      }
      setData(await r.json());
    });
  }, [router]);

  if (!data) {
    return (
      <div className="site page-shell" style={{ textAlign: "center" }}>
        <p className="hud">INITIALIZING LEVIATHON...</p>
      </div>
    );
  }

  const passes: Pass[] = (data.members || []).map((m: any) => ({
    participantCode: m.participantCode,
    teamCode: data.team.teamCode,
    teamName: data.team.teamName,
    name: m.name,
    college: m.college,
    role: m.role,
    challengeId: data.team.challengeId,
    checkinToken: m.checkinToken,
  }));

  return (
    <div className="site page-shell">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p className="hud">ACCESS LEVEL: PARTICIPANT · CORE STATUS: STABLE</p>
        <h1 className="display" style={{ fontSize: "clamp(36px, 12vw, 80px)" }}>
          SYMBIOTE CONTROL
        </h1>
        <div className="stat-grid" style={{ marginTop: 20 }}>
          <article className="panel" style={{ padding: 18 }}>
            <p className="hud">PROFILE</p>
            <h2 className="display" style={{ fontSize: 32 }}>{data.user.name}</h2>
            <p>{data.me.participantCode}</p>
            <p className="hud">{data.user.email}</p>
          </article>
          <article className="panel" style={{ padding: 18 }}>
            <p className="hud">TEAM CORE</p>
            <h2 className="display" style={{ fontSize: 32 }}>{data.team.teamCode}</h2>
            <p>{data.team.teamName}</p>
            <p className="hud">{data.team.college}</p>
          </article>
          <article className="panel" style={{ padding: 18 }}>
            <p className="hud">MISSION</p>
            <h2 className="display" style={{ fontSize: 28 }}>{data.mission?.short}</h2>
            <p className="hud">MISSION LOCKED</p>
          </article>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "28px 0" }}>
          {["IDENTITY VERIFIED", "TEAM BOUND", "MISSION LOCKED", "ACCESS GRANTED"].map((s) => (
            <span key={s} className="hud" style={{ border: "1px solid rgba(196,58,42,0.4)", padding: "8px 10px" }}>
              {s}
            </span>
          ))}
        </div>

        <h3 className="display" style={{ fontSize: 32 }}>SYMBIOTES</h3>
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {data.members.map((m: any) => (
            <div key={m.participantCode} className="panel" style={{ padding: 16 }}>
              <p className="hud">{m.participantCode}</p>
              <strong>{m.name}</strong> · {m.role.toUpperCase()} · STATUS: BOUND
            </div>
          ))}
        </div>

        <h3 className="display" style={{ fontSize: 32, marginTop: 28 }}>
          DIGITAL ENTRY PASS
        </h3>
        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          {passes.filter((p) => p.participantCode === data.me.participantCode).map((p) => (
            <PassCard key={p.participantCode} pass={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
