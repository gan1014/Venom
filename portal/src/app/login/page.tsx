"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [admin, setAdmin] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, admin }),
    });
    const data = await res.json();
    setBusy(false);
    if (!data.ok) {
      setErr(data.error || "IDENTITY VERIFICATION FAILED");
      return;
    }
    router.push(data.role === "admin" ? "/admin" : "/dashboard");
    router.refresh();
  }

  return (
    <div className="site page-shell">
      <form onSubmit={submit} className="slab" style={{ maxWidth: 440, margin: "0 auto", display: "grid", gap: 14 }}>
        <p className="hud">SECURE CHANNEL</p>
        <h1 className="display" style={{ fontSize: "clamp(48px, 16vw, 64px)" }}>LOGIN</h1>
        {err && <p className="err">{err}</p>}
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Access key</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#8b909a" }}>
          <input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} />
          Organizer / admin channel
        </label>
        <button className="btn btn-hot" disabled={busy}>
          {busy ? "SCANNING IDENTITY..." : "AUTHENTICATE"}
        </button>
        <Link href="/register" className="hud">
          NO IDENTITY? REGISTER FOR FREE
        </Link>
      </form>
    </div>
  );
}
