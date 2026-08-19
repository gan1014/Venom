import Link from "next/link";
import { MISSIONS } from "../../lib/challenges";
import { SmokeTitle } from "../../components/SmokeTitle";

export default function ChallengesPage() {
  return (
    <div className="site">
      <section className="scene-hero">
        <div>
          <p className="hud kicker">PICK YOUR INFECTION</p>
          <SmokeTitle src="/brand/title-missions.png" alt="MISSIONS" />
        </div>
      </section>
      <section className="scene">
        <div className="wrap poster-row">
          {MISSIONS.map((m) => (
            <article key={m.id} className="poster">
              <p className="n">{m.code}</p>
              <h2 className="display" style={{ fontSize: 32, margin: "16px 0 10px" }}>{m.title}</h2>
              <p style={{ color: "#9aa3ab", lineHeight: 1.65 }}>{m.description}</p>
            </article>
          ))}
        </div>
        <div className="wrap" style={{ marginTop: 36 }}>
          <Link href="/register" className="btn btn-hot">LOCK A MISSION</Link>
        </div>
      </section>
    </div>
  );
}
