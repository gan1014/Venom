import Link from "next/link";
import { MISSIONS } from "../lib/challenges";
import { SmokeTitle } from "./SmokeTitle";

export function HomeAfter() {
  return (
    <div className="site">
      <section className="scene-hero" id="protocol">
        <div>
          <p className="hud kicker">AI HACKATHON 2026 · CONTAINMENT OPEN</p>
          <SmokeTitle src="/brand/title-leviathon.png" alt="LEGO LEVIATHON" />
          <p className="lede">
            A free AI event where teams fuse into one core and force an idea through two rounds of judgment.
            Not a form. A host.
          </p>
        </div>
      </section>

      <hr className="vein" />

      <section className="scene">
        <div className="wrap split">
          <div>
            <p className="hud">THE BRIEF</p>
            <SmokeTitle src="/brand/title-protocol.png" alt="PROTOCOL" />
          </div>
          <div>
            <p className="lede" style={{ margin: 0, maxWidth: "none" }}>
              2–4 people. One mission. Design it. Build it. Stand in the pit and defend it.
              AI tools are allowed. Cowardice is not. If you cannot explain the work, it is not yours.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
              <Link href="/register" className="btn btn-hot">BIND A TEAM</Link>
              <Link href="/challenges" className="btn">SEE MISSIONS</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mono-grid">
        {[
          ["01", "FREE", "No payment. Ever."],
          ["02", "2–4", "A core, not a crowd."],
          ["03", "AI LIVE", "Use the machine. Own the cut."],
          ["04", "QR GATE", "No pass, no entry."],
        ].map(([n, t, d]) => (
          <article key={n}>
            <p className="hud">{n}</p>
            <h3 className="display" style={{ fontSize: 42, marginTop: 12 }}>{t}</h3>
            <p style={{ color: "#8a919a", marginTop: 8, fontSize: 14 }}>{d}</p>
          </article>
        ))}
      </div>

      <section className="scene">
        <div className="wrap">
          <p className="hud">SIX INFECTIONS</p>
          <SmokeTitle src="/brand/title-missions.png" alt="MISSIONS" />
          <div className="poster-row" style={{ marginTop: 8 }}>
            {MISSIONS.map((m) => (
              <Link key={m.id} href="/challenges" className="poster">
                <p className="n">{m.code}</p>
                <h3 className="display" style={{ fontSize: 34, marginTop: 20 }}>{m.short}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <hr className="vein" />

      <section className="scene">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <p className="hud">THE DAY</p>
          <h2 className="display" style={{ fontSize: "clamp(48px, 8vw, 96px)", margin: "10px 0 28px" }}>
            EIGHT BEATS.
            <br />
            NO INTERMISSION.
          </h2>
          <div className="spine">
            {[
              ["01", "Registration", "QR. Team lock. In."],
              ["02", "Welcome", "The pit opens."],
              ["03", "Brief", "Rules. Problem. Teeth."],
              ["04", "Round 1", "UI/UX. Present."],
              ["05", "Cut", "Weak cores leave."],
              ["06", "Round 2", "Prototype. Demo. Defend."],
              ["07", "Judgment", "Scores lock."],
              ["08", "Crown", "Winners. Silence."],
            ].map(([n, t, d]) => (
              <div key={n} className="beat">
                <p className="hud">{n}</p>
                <h3 className="display" style={{ fontSize: 32 }}>{t}</h3>
                <p style={{ color: "#8a919a" }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="vein" />

      <section className="scene">
        <div className="wrap split">
          <article className="slab">
            <p className="hud">ROUND 1 · 50</p>
            <h3 className="display" style={{ fontSize: 40, margin: "10px 0 16px" }}>THE SKIN</h3>
            <p>Problem 10 · UI 10 · UX 10 · Craft 10 · Voice 10</p>
          </article>
          <article className="slab">
            <p className="hud">ROUND 2 · 50</p>
            <h3 className="display" style={{ fontSize: 40, margin: "10px 0 16px" }}>THE BITE</h3>
            <p>Prototype 20 · AI 10 · Invention 10 · Demo 5 · Q&A 5</p>
          </article>
        </div>
      </section>

      <section className="cta-void">
        <div>
          <p className="hud">THE DOOR IS OPEN</p>
          <SmokeTitle src="/brand/title-carnage.png" alt="CARNAGE" />
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="btn btn-hot">REGISTER FOR FREE</Link>
            <Link href="/rules" className="btn">READ THE BOND</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
