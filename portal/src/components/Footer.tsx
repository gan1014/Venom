export function Footer() {
  return (
    <footer className="site site-foot" style={{ padding: "56px 24px 28px", borderTop: "1px solid rgba(200,230,255,0.06)" }}>
      <div className="wrap">
        <p className="hud">AI HACKATHON 2026</p>
        <img src="/brand/title-leviathon-wide.png" alt="LEGO LEVIATHON" className="smoke-title" style={{ marginLeft: 0, width: "min(720px, 92vw)" }} />
        <p style={{ letterSpacing: "0.4em", textTransform: "uppercase", fontSize: 11, color: "#b42318" }}>
          Build Beyond Limits
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 22 }}>
          {[
            ["/event", "Event"],
            ["/challenges", "Missions"],
            ["/flow", "Flow"],
            ["/rules", "Protocol"],
            ["/register", "Register"],
            ["/admin", "Command Center"],
          ].map(([h, l]) => (
            <a key={h} href={h} className="hud">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
