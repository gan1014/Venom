const ITEMS = [
  ["01", "Registration", "QR. Team lock. In."],
  ["02", "Welcome", "The pit opens."],
  ["03", "Brief", "Rules. Problem. Teeth."],
  ["04", "Round 1", "UI/UX. Present the skin."],
  ["05", "Cut", "Weak cores leave."],
  ["06", "Round 2", "Prototype. Demo. Defend."],
  ["07", "Judgment", "Scores lock."],
  ["08", "Crown", "Winners. Silence."],
];

export default function FlowPage() {
  return (
    <div className="site">
      <section className="scene-hero">
        <div>
          <p className="hud kicker">THE DAY HAS A SPINE</p>
          <h1 className="display" style={{ fontSize: "clamp(72px, 14vw, 168px)" }}>FLOW</h1>
        </div>
      </section>
      <section className="scene">
        <div className="wrap" style={{ maxWidth: 720 }}>
          <div className="spine">
            {ITEMS.map(([n, t, d]) => (
              <div key={n} className="beat">
                <p className="hud">{n}</p>
                <h2 className="display" style={{ fontSize: 36 }}>{t}</h2>
                <p style={{ color: "#8a919a" }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
