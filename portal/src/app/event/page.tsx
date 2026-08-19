import Link from "next/link";
import { SmokeTitle } from "../../components/SmokeTitle";

export default function EventPage() {
  return (
    <div className="site">
      <section className="scene-hero">
        <div>
          <p className="hud kicker">THE HOST PROTOCOL</p>
          <SmokeTitle src="/brand/title-leviathon.png" alt="LEGO LEVIATHON" />
          <SmokeTitle src="/brand/title-protocol.png" alt="PROTOCOL" />
          <p className="lede">
            Free AI carnage. Teams become one organism and force a real-world problem into a living system.
          </p>
        </div>
      </section>
      <section className="scene">
        <div className="wrap">
          <div className="mono-grid">
            {["FREE ENTRY", "2–4 CORE", "AI ALLOWED", "QR GATE"].map((t) => (
              <article key={t}>
                <h2 className="display" style={{ fontSize: 36 }}>{t}</h2>
              </article>
            ))}
          </div>
          <p className="display" style={{ fontSize: "clamp(40px, 7vw, 88px)", marginTop: 64 }}>
            BUILD.
            <br />
            BREAK THE HOST.
            <br />
            CREATE THE IMPOSSIBLE.
          </p>
          <Link href="/register" className="btn btn-hot" style={{ marginTop: 28 }}>REGISTER FOR FREE</Link>
        </div>
      </section>
    </div>
  );
}
