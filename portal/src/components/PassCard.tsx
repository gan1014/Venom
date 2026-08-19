"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export type Pass = {
  participantCode: string;
  teamCode: string;
  teamName: string;
  name: string;
  college: string;
  role: string;
  challengeId: string;
  checkinToken: string;
};

async function qrUrl(token: string) {
  return QRCode.toDataURL(token, {
    margin: 1,
    width: 640,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#f4f5f7" },
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

async function renderPass(pass: Pass, qr: string) {
  try {
    await document.fonts.ready;
  } catch {
    /* continue */
  }
  const w = 900;
  const h = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  ctx.fillStyle = "#050607";
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(450, 180, 20, 450, 220, 520);
  glow.addColorStop(0, "rgba(180,35,28,0.35)");
  glow.addColorStop(1, "rgba(5,6,7,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(200,230,255,0.16)";
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, w - 56, h - 56);
  ctx.strokeStyle = "#b42318";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 28);
  ctx.lineTo(220, 28);
  ctx.stroke();

  ctx.fillStyle = "#8a919a";
  ctx.font = "22px \"Share Tech Mono\", monospace";
  ctx.fillText("LEVIATHON ACCESS PASS", 64, 90);
  ctx.fillStyle = "#eceef2";
  ctx.font = "700 72px \"Bebas Neue\", Impact, sans-serif";
  ctx.fillText("LEGO LEVIATHON", 64, 168);
  ctx.fillStyle = "#c43a2a";
  ctx.font = "700 36px \"Bebas Neue\", Impact, sans-serif";
  ctx.fillText("AI HACKATHON 2026  ·  FREE ENTRY", 64, 214);

  ctx.fillStyle = "#eceef2";
  ctx.font = "700 64px \"Bebas Neue\", Impact, sans-serif";
  const name = (pass.name || "SYMBIOTE").toUpperCase();
  ctx.fillText(name.slice(0, 22), 64, 320);

  ctx.fillStyle = "#c43a2a";
  ctx.font = "28px \"Share Tech Mono\", monospace";
  ctx.fillText(pass.participantCode, 64, 368);

  ctx.fillStyle = "#b7bec6";
  ctx.font = "22px Inter, sans-serif";
  ctx.fillText(`TEAM ${pass.teamCode}  ·  ${pass.teamName}`, 64, 416);
  ctx.fillText(pass.college || "", 64, 450);
  ctx.fillText(`ROLE  ${String(pass.role || "").toUpperCase()}   ·   STATUS  REGISTERED`, 64, 484);

  const qrImg = await loadImage(qr);
  ctx.fillStyle = "#f4f5f7";
  ctx.fillRect(250, 540, 400, 400);
  ctx.drawImage(qrImg, 266, 556, 368, 368);

  ctx.fillStyle = "#8a919a";
  ctx.font = "18px \"Share Tech Mono\", monospace";
  ctx.textAlign = "center";
  ctx.fillText("SCAN AT CHECK-IN GATE  ·  DO NOT SHARE THIS CODE", 450, 980);
  ctx.fillStyle = "#eceef2";
  ctx.font = "700 28px \"Bebas Neue\", Impact, sans-serif";
  ctx.fillText(pass.teamCode + "  /  " + pass.participantCode, 450, 1024);
  ctx.fillStyle = "#8a919a";
  ctx.font = "16px \"Share Tech Mono\", monospace";
  ctx.fillText("ENTRY AUTHORIZED  ·  NO PAYMENT  ·  KEEP THIS PASS", 450, 1070);
  ctx.textAlign = "left";

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png");
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return url;
}

export function PassCard({ pass }: { pass: Pass }) {
  const [src, setSrc] = useState("");
  const [file, setFile] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");
  const [open, setOpen] = useState(false);
  const filename = `${pass.participantCode || "leviathon-pass"}.png`;

  useEffect(() => {
    let dead = false;
    (async () => {
      const qr = await qrUrl(pass.checkinToken);
      if (dead) return;
      setSrc(qr);
      try {
        const blob = await renderPass(pass, qr);
        if (dead) return;
        setFile(URL.createObjectURL(blob));
      } catch {
        setFile(qr);
      }
    })();
    return () => {
      dead = true;
    };
  }, [pass]);

  async function downloadPass() {
    setBusy(true);
    setHint("");
    try {
      const qr = src || (await qrUrl(pass.checkinToken));
      let blob: Blob;
      try {
        blob = await renderPass(pass, qr);
      } catch {
        blob = await (await fetch(qr)).blob();
      }
      const url = triggerDownload(blob, filename);
      const iframe = (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();
      if (iframe) {
        setFile(url);
        setOpen(true);
        setHint("If the file did not save, hold the pass image → Save image. Or tap OPEN PASS.");
      } else {
        setHint("PASS SAVED TO DOWNLOADS");
      }
    } catch {
      setOpen(true);
      setHint("OPEN THE PASS, then hold the image and choose Save.");
    }
    setBusy(false);
  }

  function printPass() {
    const img = file || src;
    if (!img) return;
    const w = window.open("", "_blank");
    if (!w) {
      setOpen(true);
      setHint("Popup blocked — use DOWNLOAD PASS or hold the image to save.");
      return;
    }
    w.document.write(
      `<title>${pass.participantCode}</title><body style="margin:0;background:#000;display:grid;place-items:center"><img src="${img}" style="max-width:100%;height:auto"/></body>`
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  }

  return (
    <article className="slab pass-card">
      <div>
        <p className="hud">LEVIATHON ACCESS PASS · AI HACKATHON 2026</p>
        <h3 className="display" style={{ fontSize: "clamp(26px, 8vw, 32px)", marginTop: 6 }}>
          {pass.name}
        </h3>
        <p className="hud" style={{ color: "#c43a2a" }}>
          {pass.participantCode}
        </p>
        <p style={{ marginTop: 10, fontSize: 14, color: "#c5c8ce" }}>
          TEAM {pass.teamCode} · {pass.teamName}
          <br />
          {pass.college}
          <br />
          ROLE: {String(pass.role || "").toUpperCase()} · STATUS: REGISTERED · ENTRY: AUTHORIZED
        </p>
        <div className="pass-actions">
          <button type="button" className="btn btn-hot" onClick={downloadPass} disabled={busy || !src}>
            {busy ? "FORGING PASS..." : "DOWNLOAD PASS"}
          </button>
          <a className="btn" href={file || `/api/pass/file?token=${encodeURIComponent(pass.checkinToken)}`} download={filename} target="_blank" rel="noreferrer">
            OPEN PASS
          </a>
          <button type="button" className="btn" onClick={printPass} disabled={!src}>
            PRINT PASS
          </button>
        </div>
        {hint ? <p className="hud" style={{ marginTop: 10, color: "#f0d27a" }}>{hint}</p> : null}
      </div>
      {src && <img className="pass-qr" src={file || src} alt="QR entry token" />}
      {open && (file || src) ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            background: "rgba(0,0,0,0.92)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
            <p className="hud">HOLD IMAGE → SAVE PHOTO</p>
            <img src={file || src} alt={pass.participantCode} style={{ width: "100%", margin: "14px 0", background: "#000" }} />
            <a className="btn btn-hot" href={file || src} download={filename}>
              SAVE PNG
            </a>
            <button type="button" className="btn" style={{ marginLeft: 8 }} onClick={() => setOpen(false)}>
              CLOSE
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
