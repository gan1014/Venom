"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminFetch, clearAdminToken, saveAdminToken } from "@/lib/adminClient";

type View = "overview" | "scan" | "people" | "teams" | "activity";
type Stats = {
  ok?: boolean;
  totals: { teams: number; participants: number; checkedIn: number; pending: number };
  teams: any[];
  participants: any[];
  recent: any[];
};
type Hit = {
  status: string;
  token?: string;
  name?: string;
  participantCode?: string;
  teamCode?: string;
  teamName?: string;
  college?: string;
  mission?: string;
  checkedInAt?: string | null;
  teamStatus?: string;
  members?: { participantCode: string; name: string; checkedIn: boolean }[];
};

const EMPTY: Stats = {
  totals: { teams: 0, participants: 0, checkedIn: 0, pending: 0 },
  teams: [],
  participants: [],
  recent: [],
};

const NAV: [View, string][] = [
  ["overview", "OVERVIEW"],
  ["scan", "SCAN SYMBIOTE"],
  ["people", "PARTICIPANTS"],
  ["teams", "TEAMS"],
  ["activity", "CHECK-INS"],
];

export default function CommandPage() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [syncErr, setSyncErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Stats>(EMPTY);
  const [q, setQ] = useState("");
  const hold = useRef(false);
  const tokenRef = useRef("");

  useEffect(() => {
    const applyHash = () => {
      if (location.hash === "#scan") setView("scan");
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  async function loadStats(explicit?: string) {
    const tok = explicit || tokenRef.current;
    try {
      const r = await adminFetch("/api/admin/stats", {}, tok);
      if (!r.ok) {
        setSyncErr(r.status === 401 ? "CHANNEL REJECTED — tap RETRY SYNC" : "SYNC FAILED " + r.status);
        return;
      }
      const d = await r.json().catch(() => null);
      if (d?.ok) {
        setData(d);
        setSyncErr("");
      } else {
        setSyncErr("SYNC FAILED");
      }
    } catch {
      setSyncErr("SYNC FAILED");
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const stored = (await import("@/lib/adminClient")).readAdminToken();
        if (stored) tokenRef.current = stored;
        const r = await adminFetch("/api/auth/me", {}, tokenRef.current);
        const d = await r.json().catch(() => ({}));
        if (!alive) return;
        if (hold.current) {
          setReady(true);
          return;
        }
        const ok = !!(d.ok && d.role === "admin");
        setAuthed(ok);
        if (ok) loadStats();
      } catch {
        if (!alive || hold.current) {
          setReady(true);
          return;
        }
        setAuthed(false);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!d.ok) {
        setErr(d.error || "ACCESS DENIED");
        setBusy(false);
        return;
      }
      hold.current = true;
      if (d.token) {
        tokenRef.current = d.token;
        saveAdminToken(d.token);
      }
      setData(EMPTY);
      setAuthed(true);
      setReady(true);
      setView("overview");
      setBusy(false);
      await loadStats(d.token || tokenRef.current);
    } catch {
      setErr("CHANNEL DOWN");
      setBusy(false);
    }
  }

  async function logout() {
    if (!confirm("Terminate the admin session?")) return;
    hold.current = false;
    await adminFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    clearAdminToken();
    setAuthed(false);
    setData(EMPTY);
    setPassword("");
    setSyncErr("");
  }

  useEffect(() => {
    if (!authed) return;
    loadStats();
    const id = setInterval(loadStats, 8000);
    return () => clearInterval(id);
  }, [authed]);

  async function exportCsv() {
    const r = await adminFetch("/api/admin/export");
    if (!r.ok) {
      setSyncErr("EXPORT FAILED");
      return;
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leviathon-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!ready) {
    return (
      <div className="cmd-login">
        <p className="hud">OPENING COMMAND CHANNEL...</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="cmd-login">
        <div className="cmd-scan" />
        <form onSubmit={login} className="slab cmd-card">
          <p className="hud">AUTHORIZED PERSONNEL ONLY</p>
          <h1 className="display" style={{ fontSize: "clamp(52px, 10vw, 88px)", margin: "8px 0 6px" }}>
            LEVIATHON
          </h1>
          <p className="display" style={{ fontSize: 28, color: "#c43a2a", marginBottom: 18 }}>
            COMMAND CENTER
          </p>
          {err && <p className="err">{err}</p>}
          <label className="field">
            <span>Admin Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="btn btn-hot" disabled={busy} style={{ marginTop: 8 }}>
            {busy ? "AUTHENTICATING..." : "AUTHENTICATE"}
          </button>
          <div className="cmd-meta">
            <p className="hud">SYSTEM STATUS · ONLINE</p>
            <p className="hud">ACCESS LEVEL · ADMIN ONLY</p>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="cmd">
      <aside className="cmd-side">
        <p className="hud">COMMAND CENTER</p>
        <h1 className="display" style={{ fontSize: 28, margin: "8px 0 22px" }}>
          LEVIATHON
        </h1>
        <nav>
          {NAV.map(([id, label]) => (
            <button key={id} type="button" className={view === id ? "is-on" : ""} onClick={() => setView(id)}>
              {label}
            </button>
          ))}
          <button type="button" onClick={exportCsv}>
            EXPORT
          </button>
        </nav>
        <div className="cmd-side-foot">
          <p className="hud">ACCESS LEVEL · ADMIN</p>
          <button type="button" className="btn" onClick={logout}>
            TERMINATE SESSION
          </button>
        </div>
      </aside>
      <div className="cmd-main">
        <div className="cmd-bar">
          <p className="hud" style={{ marginRight: 8 }}>
            LEVIATHON
          </p>
          {NAV.map(([id, label]) => (
            <button key={id} type="button" className={view === id ? "is-on" : ""} onClick={() => setView(id)}>
              {label}
            </button>
          ))}
          <button type="button" onClick={exportCsv}>
            EXPORT
          </button>
          <button type="button" onClick={logout}>
            END
          </button>
        </div>
        {syncErr ? <p className="hud cmd-pad cmd-sync">{syncErr}</p> : null}
        {view === "overview" && <Overview data={data} goScan={() => setView("scan")} />}
        {view === "scan" && <Scanner onDone={loadStats} />}
        {view === "people" && <People data={data} q={q} setQ={setQ} />}
        {view === "teams" && <Teams data={data} />}
        {view === "activity" && <Activity data={data} />}
      </div>
    </div>
  );
}

function Overview({ data, goScan }: { data: Stats; goScan: () => void }) {
  const totals = data?.totals || EMPTY.totals;
  return (
    <div className="cmd-pad">
      <p className="hud">LEVIATHON COMMAND CENTER</p>
      <h1 className="display" style={{ fontSize: "clamp(48px, 8vw, 84px)", margin: "8px 0 22px" }}>
        OVERVIEW
      </h1>
      <div className="cmd-stats">
        {[
          ["TOTAL TEAMS", totals.teams],
          ["TOTAL SYMBIOTES", totals.participants],
          ["CHECKED IN", totals.checkedIn],
          ["NOT ARRIVED", totals.pending],
        ].map(([k, v]) => (
          <article key={String(k)} className="slab">
            <p className="hud">{k}</p>
            <p className="display" style={{ fontSize: 56, marginTop: 10 }}>
              {v}
            </p>
          </article>
        ))}
      </div>
      <button type="button" className="btn btn-hot" style={{ margin: "22px 0" }} onClick={goScan}>
        SCAN SYMBIOTE
      </button>
      <p className="hud">RECENT SYMBIOTE ACTIVITY</p>
      <Table
        cols={["SYMBIOTE ID", "NAME", "TEAM", "TIME"]}
        rows={(data.recent || []).map((r: any) => [
          r.participantCode,
          r.name,
          r.teamCode,
          r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString() : "—",
        ])}
      />
    </div>
  );
}

function People({ data, q, setQ }: { data: Stats; q: string; setQ: (v: string) => void }) {
  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return (data.participants || []).filter((p: any) =>
      [p.name, p.email, p.participantCode, p.teamCode, p.teamName].join(" ").toLowerCase().includes(s)
    );
  }, [data, q]);
  return (
    <div className="cmd-pad">
      <p className="hud">PARTICIPANTS</p>
      <h1 className="display" style={{ fontSize: 56, margin: "6px 0 16px" }}>
        SYMBIOTES
      </h1>
      <input className="cmd-search" placeholder="Search name / email / team / ID" value={q} onChange={(e) => setQ(e.target.value)} />
      <Table
        cols={["SYMBIOTE ID", "NAME", "TEAM", "STATUS"]}
        rows={rows.map((p: any) => [p.participantCode, p.name, p.teamCode, p.checkedIn ? "CHECKED IN" : "REGISTERED"])}
      />
    </div>
  );
}

function Teams({ data }: { data: Stats }) {
  return (
    <div className="cmd-pad">
      <p className="hud">LEVIATHON CORE</p>
      <h1 className="display" style={{ fontSize: 56, margin: "6px 0 16px" }}>
        TEAMS
      </h1>
      <div className="cmd-stats">
        {(data.teams || []).map((t: any) => (
          <article key={t.id} className="slab">
            <p className="hud">{t.teamCode}</p>
            <h2 className="display" style={{ fontSize: 32, margin: "8px 0" }}>
              {t.teamName}
            </h2>
            <p>
              {t.arrived}/{t.size} · {t.teamStatus}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Activity({ data }: { data: Stats }) {
  return (
    <div className="cmd-pad">
      <p className="hud">CHECK-INS</p>
      <h1 className="display" style={{ fontSize: 56, margin: "6px 0 16px" }}>
        ACTIVITY
      </h1>
      <Table
        cols={["SYMBIOTE ID", "NAME", "TEAM", "TIME"]}
        rows={(data.recent || []).map((r: any) => [
          r.participantCode,
          r.name,
          r.teamCode,
          r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : "—",
        ])}
      />
    </div>
  );
}

function Table({ cols, rows }: { cols: string[]; rows: any[][] }) {
  return (
    <div className="cmd-table-wrap">
      <table className="cmd-table">
        <thead>
          <tr>
            {cols.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length}>NO ROWS</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function framed(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function camError(err: unknown) {
  const e = err as { name?: string; message?: string };
  if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
    return framed()
      ? "CAMERA BLOCKED IN THIS FRAME — open the full camera gate"
      : "CAMERA PERMISSION DENIED — allow camera for this site and tap ENABLE CAMERA";
  }
  if (e?.name === "NotFoundError" || e?.name === "OverconstrainedError") return "NO CAMERA FOUND ON THIS DEVICE";
  if (e?.name === "NotReadableError") return "CAMERA IS BUSY IN ANOTHER APP";
  return e?.message || "CAMERA FAILED";
}

function Scanner({ onDone }: { onDone: () => void }) {
  const [cam, setCam] = useState("TAP ENABLE CAMERA TO ARM THE GATE");
  const [live, setLive] = useState(false);
  const [rear, setRear] = useState(true);
  const [hit, setHit] = useState<Hit | null>(null);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState("");
  const [cams, setCams] = useState<{ id: string; label: string }[]>([]);
  const [camId, setCamId] = useState("");
  const lock = useRef(false);
  const liveRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number>(0);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
  };

  const pauseDecode = () => {
    liveRef.current = false;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = 0;
  };

  const resume = () => {
    lock.current = false;
    setHit(null);
    if (streamRef.current) {
      liveRef.current = true;
      setLive(true);
      setCam("SCANNER ONLINE — hold the QR inside the frame");
      tick();
    }
  };

  const lookup = useCallback(async (raw: string) => {
    if (lock.current || !raw) return;
    lock.current = true;
    pauseDecode();
    setBusy(true);
    try {
      const res = await adminFetch("/api/admin/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: raw }),
      });
      const data = await res.json();
      setHit(data.status ? data : { status: "denied" });
    } catch {
      setHit({ status: "denied" });
    }
    setBusy(false);
  }, []);

  async function decodeFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const max = 640;
    const scale = Math.min(1, max / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, cw, ch);

    const Detector = (window as any).BarcodeDetector;
    if (Detector) {
      try {
        const det = new Detector({ formats: ["qr_code"] });
        const codes = await det.detect(canvas);
        if (codes?.[0]?.rawValue) {
          lookup(String(codes[0].rawValue));
          return;
        }
      } catch {
        /* fall through to jsqr */
      }
    }

    const jsQR = (await import("jsqr")).default;
    const img = ctx.getImageData(0, 0, cw, ch);
    const code = jsQR(img.data, cw, ch, { inversionAttempts: "attemptBoth" });
    if (code?.data) lookup(code.data);
  }

  function tick() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      if (!liveRef.current || lock.current) return;
      try {
        await decodeFrame();
      } catch {
        /* keep scanning */
      }
      if (liveRef.current && !lock.current) tick();
    }, 180);
  }

  async function startCamera(nextId?: string) {
    setCam("REQUESTING CAMERA...");
    pauseDecode();
    stopStream();
    const id = nextId ?? camId;
    const tries: MediaStreamConstraints[] = [];
    if (id) tries.push({ audio: false, video: { deviceId: { exact: id }, width: { ideal: 1280 }, height: { ideal: 720 } } });
    tries.push({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } });
    tries.push({ audio: false, video: true });

    let stream: MediaStream | null = null;
    let last: unknown = null;
    for (const spec of tries) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(spec);
        break;
      } catch (err) {
        last = err;
      }
    }
    if (!stream) {
      setLive(false);
      setCam(camError(last));
      return;
    }

    streamRef.current = stream;
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings?.() || {};
    setRear(settings.facingMode === "environment" || !settings.facingMode);
    if (settings.deviceId) setCamId(String(settings.deviceId));

    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    video.muted = true;
    await video.play();

    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setCams(
        all
          .filter((d) => d.kind === "videoinput")
          .map((d, i) => ({ id: d.deviceId, label: d.label || "CAMERA " + (i + 1) }))
      );
    } catch {
      /* ignore */
    }

    liveRef.current = true;
    lock.current = false;
    setHit(null);
    setLive(true);
    setCam("SCANNER ONLINE — hold the QR inside the frame");
    tick();
  }

  useEffect(() => {
    return () => {
      pauseDecode();
      stopStream();
    };
  }, []);

  async function onPhoto(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const bmp = await createImageBitmap(file);
      const canvas = canvasRef.current || document.createElement("canvas");
      const max = 900;
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      canvas.width = Math.max(1, Math.round(bmp.width * scale));
      canvas.height = Math.max(1, Math.round(bmp.height * scale));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("no canvas");
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const Detector = (window as any).BarcodeDetector;
      if (Detector) {
        try {
          const det = new Detector({ formats: ["qr_code"] });
          const codes = await det.detect(canvas);
          if (codes?.[0]?.rawValue) {
            await lookup(String(codes[0].rawValue));
            setBusy(false);
            return;
          }
        } catch {
          /* jsqr */
        }
      }
      const jsQR = (await import("jsqr")).default;
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, canvas.width, canvas.height, { inversionAttempts: "attemptBoth" });
      if (code?.data) await lookup(code.data);
      else setHit({ status: "unknown" });
    } catch {
      setHit({ status: "denied" });
    }
    setBusy(false);
  }

  async function confirm() {
    setBusy(true);
    try {
      const res = await adminFetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: hit?.token || manual }),
      });
      const data = await res.json();
      setHit(data);
      onDone();
    } catch {
      setHit({ status: "denied" });
    }
    setBusy(false);
  }

  return (
    <div className="cmd-pad">
      <p className="hud">SCAN SYMBIOTE ACCESS PASS</p>
      <h1 className="display" style={{ fontSize: "clamp(40px, 7vw, 72px)", margin: "6px 0 18px" }}>
        CHECK-IN GATE
      </h1>
      <div className="cmd-scan-grid">
        <section className="cmd-scan-box">
          <div className={"cmd-cam-stage" + (live ? " is-on" : "") + (rear ? " is-rear" : "")}>
            <video ref={videoRef} autoPlay muted playsInline />
            {live ? <div className="cmd-reticle" /> : null}
            {!live ? (
              <div className="cmd-cam-idle">
                <div>
                  <p className="hud">LIVE LENS</p>
                  <p className="display" style={{ fontSize: 42, margin: "10px 0 16px" }}>
                    CAMERA GATE
                  </p>
                  <button type="button" className="btn btn-hot" onClick={() => startCamera()}>
                    ENABLE CAMERA
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <canvas ref={canvasRef} hidden />
          <p className="hud" style={{ marginTop: 10 }}>
            {cam}
          </p>
          <div className="cmd-cam-tools">
            <button type="button" className="btn btn-hot" onClick={() => startCamera()}>
              {live ? "RESTART CAMERA" : "ENABLE CAMERA"}
            </button>
            {cams.length > 1 ? (
              <select
                value={camId}
                onChange={(e) => {
                  setCamId(e.target.value);
                  startCamera(e.target.value);
                }}
              >
                {cams.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            ) : null}
            <label className="btn">
              SCAN PHOTO
              <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => onPhoto(e.target.files?.[0])}
              />
            </label>
            <button type="button" className="btn" onClick={() => window.open("/admin#scan", "_blank", "noopener")}>
              OPEN FULL CAMERA GATE
            </button>
          </div>
          <label className="field" style={{ marginTop: 12 }}>
            <span>Manual token</span>
            <input value={manual} onChange={(e) => setManual(e.target.value)} />
          </label>
          <button className="btn" style={{ marginTop: 10 }} onClick={() => lookup(manual)}>
            VERIFY TOKEN
          </button>
        </section>
        <section className="slab cmd-result">
          {busy && !hit && <h2 className="display cmd-state">SCANNING FOR SYMBIOTE...</h2>}
          {!hit && <p className="hud">Tap ENABLE CAMERA, allow the lens, then hold the pass QR in the red frame.</p>}
          {hit?.status === "found" && (
            <>
              <h2 className="display cmd-state ok">SYMBIOTE DETECTED</h2>
              <p className="display" style={{ fontSize: 36 }}>
                {hit.name}
              </p>
              <p>{hit.participantCode}</p>
              <p>
                {hit.teamCode} · {hit.teamName}
              </p>
              <p>{hit.mission}</p>
              <p className="hud">{hit.teamStatus}</p>
              <div className="cmd-actions">
                <button className="btn btn-hot" disabled={busy} onClick={confirm}>
                  CONFIRM CHECK-IN
                </button>
                <button className="btn" onClick={resume}>
                  SCAN AGAIN
                </button>
              </div>
            </>
          )}
          {hit?.status === "granted" && (
            <>
              <h2 className="display cmd-state ok">ACCESS GRANTED</h2>
              <p>{hit.participantCode}</p>
              <p className="hud">{hit.checkedInAt ? new Date(hit.checkedInAt).toLocaleTimeString() : ""}</p>
              <button className="btn btn-hot" onClick={resume}>
                SCAN NEXT SYMBIOTE
              </button>
            </>
          )}
          {hit?.status === "already" && (
            <>
              <h2 className="display cmd-state warn">ALREADY VERIFIED</h2>
              <p>
                {hit.name} · {hit.participantCode}
              </p>
              <button className="btn" onClick={resume}>
                SCAN NEXT
              </button>
            </>
          )}
          {hit?.status === "unknown" && (
            <>
              <h2 className="display cmd-state bad">UNKNOWN SYMBIOTE</h2>
              <button className="btn" onClick={resume}>
                SCAN AGAIN
              </button>
            </>
          )}
          {hit?.status === "denied" && (
            <>
              <h2 className="display cmd-state bad">ACCESS DENIED</h2>
              <button className="btn" onClick={resume}>
                SCAN AGAIN
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
