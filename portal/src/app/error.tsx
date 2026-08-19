"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="site" style={{ minHeight: "100dvh", padding: 80, textAlign: "center" }}>
      <p className="hud">SYS</p>
      <h1 className="display" style={{ fontSize: 56 }}>
        CONNECTION INTERRUPTED
      </h1>
      <button className="btn btn-hot" onClick={reset}>
        RETRY
      </button>
    </div>
  );
}
