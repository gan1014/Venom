"use client";

import { useEffect } from "react";

export function Hero() {
  useEffect(() => {
    if (document.getElementById("lv-hero-script")) return;
    const a = document.createElement("script");
    a.src = "/js/app.js";
    a.id = "lv-hero-script";
    document.body.appendChild(a);
    a.onload = () => {
      if (document.getElementById("lv-integrate-script")) return;
      const b = document.createElement("script");
      b.src = "/js/integrate.js";
      b.id = "lv-integrate-script";
      document.body.appendChild(b);
    };
  }, []);

  return (
    <div id="hero-root">
      <div id="boot" aria-live="polite">
        <div className="boot-mark">
          <span className="boot-studs" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </span>
          <p className="boot-kicker">Cinematic Symbiote Sequence</p>
          <h1 className="boot-title">LEVIATHON</h1>
        </div>
        <div className="boot-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
          <i id="boot-fill"></i>
        </div>
        <p className="boot-status" id="boot-status">
          Assembling plates…
        </p>
        <button type="button" id="enter" className="enter" hidden>
          Enter the Foundry
        </button>
      </div>

      <div id="progress" aria-hidden="true">
        <i id="progress-fill"></i>
      </div>

      <header className="chrome" aria-hidden="true">
        <span className="chrome-brand">LEGO LEVIATHON</span>
        <span className="chrome-meta" id="chrome-meta">
          00 — THE FOUNDRY
        </span>
      </header>

      <nav className="ticks" id="ticks" aria-label="Chapters"></nav>

      <div id="stage">
        <canvas id="frames"></canvas>
        <canvas id="fx"></canvas>
        <div className="fog fog-a"></div>
        <div className="fog fog-b"></div>
        <div className="grade"></div>
        <div className="vignette"></div>
        <div className="grain"></div>
        <div className="letterbox top"></div>
        <div className="letterbox bot"></div>
        <div className="flash" id="flash"></div>
        <div className="ca"></div>
        <p id="hackathon-badge">AI HACKATHON 2026</p>

        <div id="caption">
          <p className="cap-kicker" id="cap-kicker">
            00
          </p>
          <p className="cap-title" id="cap-title">
            The Foundry
          </p>
          <p className="cap-line" id="cap-line">
            A drowned cathedral of steel
          </p>
        </div>

        <div id="hint">
          <span>Scroll to enter</span>
          <b></b>
        </div>

        <section id="title" aria-hidden="true">
          <div className="title-inner">
            <div className="brick-word" id="word-lego" aria-label="LEGO">
              <span className="cell" data-char="L">
                <em></em>
                <b>L</b>
              </span>
              <span className="cell" data-char="E">
                <em></em>
                <b>E</b>
              </span>
              <span className="cell" data-char="G">
                <em></em>
                <b>G</b>
              </span>
              <span className="cell" data-char="O">
                <em></em>
                <b>O</b>
              </span>
            </div>
            <h2 className="word-leviathan" id="word-leviathan">
              LEVIATHAN
            </h2>
            <p className="tagline" id="tagline">
              <span>Build Beyond Limits</span>
            </p>
            <div className="hero-end-cta">
              <button type="button" id="carnage-btn">
                LET&apos;S BEGIN THE CARNAGE
              </button>
            </div>
          </div>
        </section>
      </div>

      <div id="scroll-track"></div>

      <button type="button" id="audio-btn" className="audio-btn" aria-pressed="false" aria-label="Toggle sound" hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path className="sp-on" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
          <path className="sp-off" d="M4 9v6h4l5 4V5L8 9H4zm11.7-3.3 1.4 1.4L15.4 9l1.7 1.9-1.4 1.4L14 10.4l-1.7 1.9-1.4-1.4L12.6 9l-1.7-1.9 1.4-1.4L14 7.6l1.7-1.9z" />
        </svg>
      </button>
    </div>
  );
}
