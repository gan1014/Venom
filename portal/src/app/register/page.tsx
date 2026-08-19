"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MISSIONS } from "../../lib/challenges";
import { PassCard, type Pass } from "../../components/PassCard";

type Person = {
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  studentId: string;
  password: string;
};

const blank = (): Person => ({
  name: "",
  email: "",
  phone: "",
  college: "",
  department: "",
  year: "",
  studentId: "",
  password: "",
});

const STEPS = ["TEAM CORE", "SYMBIOTES", "MISSION", "CONFIRM", "ACCESS PASS"];

const FIELDS: { k: keyof Person; label: string; type?: string }[] = [
  { k: "name", label: "Full name" },
  { k: "email", label: "Email", type: "email" },
          { k: "phone", label: "Phone", type: "tel" },
  { k: "college", label: "College / School" },
  { k: "department", label: "Department" },
  { k: "year", label: "Year of study" },
  { k: "studentId", label: "Student ID / Roll" },
  { k: "password", label: "Access key", type: "password" },
];

function PersonFields({ value, onChange, title }: { value: Person; onChange: (p: Person) => void; title: string }) {
  return (
    <div className="panel" style={{ padding: 18, display: "grid", gap: 12 }}>
      <p className="hud">{title}</p>
      {FIELDS.map(({ k, label, type }) => (
        <label className="field" key={k}>
          <span>{label}</span>
          <input
            type={type || "text"}
            value={value[k]}
            onChange={(e) => onChange({ ...value, [k]: e.target.value })}
            autoComplete={k === "password" ? "new-password" : "off"}
          />
        </label>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [teamSize, setTeamSize] = useState<2 | 3 | 4>(2);
  const [leader, setLeader] = useState<Person>(blank());
  const [members, setMembers] = useState<Person[]>([blank()]);
  const [challengeId, setChallengeId] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [seq, setSeq] = useState<string | null>(null);
  const [result, setResult] = useState<{ team: { teamCode: string; teamName: string }; passes: Pass[] } | null>(null);
  const [skip, setSkip] = useState(false);

  const peopleNeed = teamSize - 1;
  const extra = useMemo(() => {
    const next = members.slice(0, peopleNeed);
    while (next.length < peopleNeed) next.push(blank());
    return next;
  }, [members, peopleNeed]);

  function setMember(i: number, p: Person) {
    const n = extra.slice();
    n[i] = p;
    setMembers(n);
  }

  

  async function activate() {
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          college,
          department,
          teamSize,
          challengeId,
          confirm,
          leader: { ...leader, college: leader.college || college, department: leader.department || department },
          members: extra.map((m) => ({
            ...m,
            college: m.college || college,
            department: m.department || department,
          })),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErr(data.error || "CONNECTION INTERRUPTED");
        setBusy(false);
        return;
      }
      setResult(data);
      if (skip) {
        setStep(4);
        setBusy(false);
        return;
      }
      const beats = ["SYMBIOTE DETECTED", "TEAM CORE VERIFIED", "MISSION LOCKED", "IDENTITY CONFIRMED", "ACCESS GRANTED"];
      for (const b of beats) {
        setSeq(b);
        await new Promise((r) => setTimeout(r, 420));
      }
      setSeq("WELCOME TO LEVIATHON");
      await new Promise((r) => setTimeout(r, 500));
      setStep(4);
    } catch {
      setErr("CONNECTION INTERRUPTED");
    } finally {
      setBusy(false);
    }
  }

  const mission = MISSIONS.find((m) => m.id === challengeId);

  return (
    <div className="site page-shell">
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <p className="hud">ACCESS LEVEL: PARTICIPANT · BINDING RITE</p>
        <img src="/brand/title-leviathon-wide.png" alt="LEGO LEVIATHON" className="smoke-title" />
        <h1 className="display" style={{ fontSize: "clamp(28px, 8vw, 48px)", color: "#c43a2a" }}>
          ENTER THE HOST
        </h1>
        <div className="step-rail">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className="hud"
              style={{
                padding: "6px 10px",
                border: "1px solid rgba(255,255,255,0.1)",
                color: i === step ? "#fff" : "#8b909a",
                boxShadow: i === step ? "0 0 16px rgba(196,58,42,0.35)" : "none",
              }}
            >
              0{i + 1} {s}
            </span>
          ))}
        </div>

        {err && <p className="err">{err}</p>}

        {step === 0 && (
          <div style={{ display: "grid", gap: 14 }}>
            <h2 className="display" style={{ fontSize: 36 }}>
              INITIALIZE YOUR TEAM
            </h2>
            <label className="field">
              <span>Team Name</span>
              <input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
            </label>
            <label className="field">
              <span>College / School</span>
              <input value={college} onChange={(e) => setCollege(e.target.value)} />
            </label>
            <label className="field">
              <span>Department</span>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} />
            </label>
            <label className="field">
              <span>Team Size</span>
              <select value={teamSize} onChange={(e) => setTeamSize(Number(e.target.value) as 2 | 3 | 4)}>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </label>
            <PersonFields title="TEAM LEADER — SYMBIOTE-01" value={leader} onChange={setLeader} />
            <div className="actions-row">
              <button className="btn btn-hot" onClick={() => setStep(1)}>
                CONTINUE
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "grid", gap: 14 }}>
            <h2 className="display" style={{ fontSize: 36 }}>
              BIND YOUR SYMBIOTES
            </h2>
            {extra.map((m, i) => (
              <PersonFields key={i} title={`SYMBIOTE-0${i + 2}`} value={m} onChange={(p) => setMember(i, p)} />
            ))}
            <div className="actions-row">
              <button className="btn" onClick={() => setStep(0)}>
                BACK
              </button>
              <button className="btn btn-hot" onClick={() => setStep(2)}>
                CONTINUE
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="display" style={{ fontSize: 36 }}>
              SELECT YOUR MISSION
            </h2>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {MISSIONS.map((m) => (
                <button
                  key={m.id}
                  className="panel"
                  onClick={() => setChallengeId(m.id)}
                  style={{
                    textAlign: "left",
                    padding: 18,
                    borderColor: challengeId === m.id ? "rgba(196,58,42,0.8)" : undefined,
                    boxShadow: challengeId === m.id ? "0 0 24px rgba(154,31,31,0.35)" : undefined,
                  }}
                >
                  <p className="hud">MISSION {m.code}</p>
                  <h3 className="display" style={{ fontSize: 28 }}>
                    {m.title}
                  </h3>
                  <p style={{ color: "#8b909a", fontSize: 14, marginTop: 6 }}>{m.description}</p>
                  {challengeId === m.id && <p className="hud" style={{ color: "#c43a2a", marginTop: 8 }}>MISSION LOCKED</p>}
                </button>
              ))}
            </div>
            <div className="actions-row" style={{ marginTop: 16 }}>
              <button className="btn" onClick={() => setStep(1)}>
                BACK
              </button>
              <button className="btn btn-hot" disabled={!challengeId} onClick={() => setStep(3)}>
                CONTINUE
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="panel" style={{ padding: 22, display: "grid", gap: 12 }}>
            <h2 className="display" style={{ fontSize: 36 }}>
              CONFIRM
            </h2>
            <p className="hud">FREE ENTRY · NO PAYMENT REQUIRED</p>
            <p>
              <strong>{teamName}</strong> · {college} · {teamSize} symbionts
            </p>
            <p>Leader: {leader.name} / {leader.email}</p>
            {extra.map((m, i) => (
              <p key={i}>
                Member {i + 2}: {m.name} / {m.email}
              </p>
            ))}
            <p>Mission: {mission?.title}</p>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
              <span>I confirm the information is correct and I agree to the event rules.</span>
            </label>
            {busy && <p className="hud">{seq || "BINDING SYMBIOTES..."}</p>}
            {seq && <h3 className="display" style={{ fontSize: 42, color: "#c43a2a" }}>{seq}</h3>}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => setStep(2)} disabled={busy}>
                BACK
              </button>
              <button className="btn btn-hot" onClick={activate} disabled={!confirm || busy}>
                ACTIVATE REGISTRATION
              </button>
              <button className="btn" onClick={() => setSkip(true)}>
                SKIP ANIMATION
              </button>
            </div>
          </div>
        )}

        {step === 4 && result && (
          <div>
            <h2 className="display" style={{ fontSize: "clamp(36px, 10vw, 48px)", color: "#c43a2a" }}>
              WELCOME TO LEVIATHON
            </h2>
            <p className="hud">TEAM CORE INITIALIZED · {result.team.teamCode}</p>
            <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
              {result.passes.map((p) => (
                <PassCard key={p.participantCode} pass={p} />
              ))}
            </div>
            <button className="btn btn-hot" style={{ marginTop: 20 }} onClick={() => router.push("/dashboard")}>
              SYMBIOTE CONTROL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
