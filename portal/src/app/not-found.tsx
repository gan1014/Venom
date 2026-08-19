export default function NotFound() {
  return (
    <div className="site" style={{ minHeight: "100dvh", padding: 80, textAlign: "center" }}>
      <p className="hud">404</p>
      <h1 className="display" style={{ fontSize: 56 }}>
        IDENTITY NOT FOUND
      </h1>
      <a href="/" className="btn">
        RETURN
      </a>
    </div>
  );
}
