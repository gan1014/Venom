const RULES = [
  "2–4 members. No lone hosts.",
  "Bring your own machine.",
  "AI tools live. Own the output.",
  "Explain every assisted strike.",
  "Original work only.",
  "Plagiarism is excision.",
  "Valid college / school ID.",
  "Judges lock the score.",
];

export default function RulesPage() {
  return (
    <div className="site">
      <section className="scene-hero">
        <div>
          <p className="hud kicker">THE BOND</p>
          <h1 className="display" style={{ fontSize: "clamp(64px, 12vw, 148px)" }}>PROTOCOL</h1>
        </div>
      </section>
      <section className="scene">
        <div className="wrap" style={{ maxWidth: 760 }}>
          {RULES.map((r, i) => (
            <div key={r} className="slab" style={{ marginBottom: 10 }}>
              <p className="hud">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="display" style={{ fontSize: 32, marginTop: 6 }}>{r}</h2>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
