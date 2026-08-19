(() => {
  "use strict";

  const FRAME_FILES = [
    "assets/frames/v0-eyes.jpg",
    "assets/frames/v1-snarl.jpg",
    "assets/frames/v2-smash.jpg",
    "assets/frames/v3-run.jpg",
    "assets/frames/v4-roar.jpg",
    "assets/frames/v5-claws.jpg",
    "assets/frames/v6-lunge.jpg",
    "assets/frames/v7-beast.jpg",
    "assets/frames/v8-rage.jpg",
    "assets/frames/v10-final.jpg",
    "assets/frames/v11-black.jpg",
  ];

  const KEYS = [
    { t: 0.00, frame: 0, scale: 0.96, shake: 0.18, fade: 0.28, cut: 1 },
    { t: 0.08, frame: 0, scale: 1.00, shake: 0.10, fade: 0.04, cut: 0 },
    { t: 0.14, frame: 1, scale: 0.97, shake: 0.14, fade: 0, cut: 1 },
    { t: 0.22, frame: 2, scale: 0.97, shake: 0.20, fade: 0.02, cut: 1 },
    { t: 0.32, frame: 3, scale: 1.00, shake: 0.16, fade: 0, cut: 0 },
    { t: 0.42, frame: 4, scale: 0.98, shake: 0.22, fade: 0, cut: 1 },
    { t: 0.52, frame: 5, scale: 0.98, shake: 0.24, fade: 0, cut: 1 },
    { t: 0.62, frame: 6, scale: 0.99, shake: 0.28, fade: 0.02, cut: 1 },
    { t: 0.72, frame: 7, scale: 1.00, shake: 0.16, fade: 0, cut: 0 },
    { t: 0.80, frame: 8, scale: 0.98, shake: 0.22, fade: 0.04, cut: 1 },
    { t: 0.86, frame: 9, scale: 0.98, shake: 0.38, fade: 0.02, cut: 1 },
    { t: 0.905, frame: 10, scale: 1.00, shake: 0.08, fade: 0.55, cut: 1 },
    { t: 1.00, frame: 10, scale: 1.00, shake: 0, fade: 0.82, cut: 0 },
  ];

  const $ = (id) => document.getElementById(id);
  const canvas = $("frames");
  const fxCanvas = $("fx");
  if (!canvas || !fxCanvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  const fx = fxCanvas.getContext("2d");
  const boot = $("boot");
  const bootFill = $("boot-fill");
  const bootStatus = $("boot-status");
  const enterBtn = $("enter");
  const progressFill = $("progress-fill");
  const titleWord = $("title-word");
  const soon = $("soon");
  const warn = $("warn");
  const blood = $("blood");
  const flashEl = $("flash");
  const ca = $("ca");
  const flare = $("flare");
  const stage = $("stage");

  const images = new Array(FRAME_FILES.length);
  let w = 0;
  let h = 0;
  let dpr = 1;
  let target = 0;
  let current = 0;
  let live = false;
  let lastTime = performance.now();
  let playing = false;
  let playStart = 0;
  let userScrub = false;
  let lastHit = -1;
  let lastTitle = false;
  const TRAILER_MS = 17500;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rains = [];
  let audio = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(e0, e1, x) {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function sampleKeys(t) {
    if (t <= KEYS[0].t) return { ...KEYS[0], mix: 0, nextFrame: KEYS[0].frame };
    if (t >= KEYS[KEYS.length - 1].t) {
      const k = KEYS[KEYS.length - 1];
      return { ...k, mix: 0, nextFrame: k.frame };
    }
    let i = 0;
    while (i < KEYS.length - 1 && KEYS[i + 1].t < t) i += 1;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const raw = clamp((t - a.t) / Math.max(0.0001, b.t - a.t), 0, 1);
    const smash = b.cut === 1;
    const mix = smash ? (raw < 0.82 ? 0 : smoothstep(0.82, 1, raw)) : smoothstep(0, 1, raw);
    return {
      frame: a.frame,
      nextFrame: b.frame,
      mix,
      scale: lerp(a.scale, b.scale, smash ? mix : smoothstep(0, 1, raw)),
      shake: lerp(a.shake, b.shake, mix),
      fade: lerp(a.fade, b.fade, mix),
      smash,
      smashGate: smash ? 1 - Math.abs(raw - 0.82) * 4 : 0,
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    for (const c of [canvas, fxCanvas]) {
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      c.style.width = w + "px";
      c.style.height = h + "px";
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawFit(context, img, scale, ox, oy) {
    if (!img || !img.width) return;
    const padY = h * 0.09;
    const vw = w * 0.98;
    const vh = h - padY * 2;
    const ir = img.width / img.height;
    const cr = vw / vh;
    let dw;
    let dh;
    if (ir > cr) {
      dw = vw * scale;
      dh = dw / ir;
    } else {
      dh = vh * scale;
      dw = dh * ir;
    }
    const x = (w - dw) * 0.5 + ox;
    const y = padY + (vh - dh) * 0.5 + oy;
    context.drawImage(img, x, y, dw, dh);
  }

  function seedWeather() {
    rains.length = 0;
    const count = w < 720 ? 90 : 170;
    for (let i = 0; i < count; i += 1) {
      rains.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 12 + Math.random() * 22,
        spd: 16 + Math.random() * 26,
        wt: Math.random() < 0.15 ? 1.5 : 0.7,
        a: 0.1 + Math.random() * 0.28,
      });
    }
  }

  function drawWeather(dt, t, shake) {
    fx.clearRect(0, 0, w, h);
    const rainAmt = 1 - smoothstep(0.86, 0.92, t);
    if (rainAmt < 0.02) return;
    const wind = 1.8 + shake * 10;
    fx.save();
    fx.translate(shake * (Math.random() - 0.5) * 12, shake * (Math.random() - 0.5) * 10);
    fx.lineCap = "round";
    for (const d of rains) {
      d.y += d.spd * dt * 60 * (0.75 + rainAmt);
      d.x += wind * dt * 46;
      if (d.y > h) { d.y = -24; d.x = Math.random() * w; }
      if (d.x > w + 20) d.x = -10;
      fx.strokeStyle = `rgba(210,220,230,${d.a * rainAmt})`;
      fx.lineWidth = d.wt;
      fx.beginPath();
      fx.moveTo(d.x, d.y);
      fx.lineTo(d.x + wind * 0.4, d.y + d.len);
      fx.stroke();
    }
    fx.restore();
  }

  function applyWarn(t, now) {
    const hold = 1 - smoothstep(0.00, 0.08, t);
    document.body.classList.toggle("is-warn", hold > 0.2);
    if (warn) warn.style.opacity = String(hold);
    if (blood) {
      const ramp = t * 0.22;
      const slam = (t > 0.12 && t < 0.9) ? 0.08 + t * 0.18 : 0;
      blood.style.opacity = String(Math.max(hold * 0.4, slam, ramp));
    }
  }

  function trailerMap(u) {
    u = clamp(u, 0, 1);
    if (u < 0.08) return lerp(0.00, 0.10, u / 0.08);
    if (u < 0.22) return lerp(0.10, 0.28, (u - 0.08) / 0.14);
    if (u < 0.40) return lerp(0.28, 0.50, (u - 0.22) / 0.18);
    if (u < 0.62) return lerp(0.50, 0.72, (u - 0.40) / 0.22);
    if (u < 0.82) return lerp(0.72, 0.86, (u - 0.62) / 0.20);
    return lerp(0.86, 1.00, (u - 0.82) / 0.18);
  }

  function setPlayhead(t) {
    target = clamp(t, 0, 1);
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, target * max);
  }

  function applyEnd(t) {
    const black = smoothstep(0.88, 0.92, t);
    const title = smoothstep(0.91, 0.945, t);
    const coming = smoothstep(0.95, 0.985, t);
    document.body.classList.toggle("is-end", t > 0.88);
    if (titleWord) {
      titleWord.style.opacity = String(title);
      titleWord.style.transform = `scale(${lerp(1.45, 1, title)})`;
      titleWord.style.filter = `blur(${lerp(14, 0, title)}px) drop-shadow(0 0 48px rgba(226,74,56,0.55)) drop-shadow(0 0 28px rgba(140,210,255,0.45))`;
    }
    if (soon) {
      soon.style.opacity = String(coming);
      soon.style.transform = `translateY(${lerp(28, 0, coming)}px) scale(${lerp(1.2, 1, coming)})`;
      soon.style.letterSpacing = `${lerp(1.1, 0.55, coming)}em`;
    }
    if (t > 0.91 && !lastTitle) {
      lastTitle = true;
      punch("title");
    }
  }

  function punch(kind) {
    if (!flashEl) return;
    flashEl.className = "flash is-on " + (kind || "");
    requestAnimationFrame(() => {
      flashEl.classList.remove("is-on");
    });
    if (stage) {
      stage.style.transform = "scale(1.012)";
      setTimeout(() => { stage.style.transform = "scale(1)"; }, 140);
    }
    if (audio) audio.hit(kind);
  }

  function createAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ac = new AC();
    const master = ac.createGain();
    master.gain.value = 0.0001;
    master.connect(ac.destination);

    const rumble = ac.createGain();
    rumble.gain.value = 0.2;
    rumble.connect(master);
    const o1 = ac.createOscillator();
    o1.type = "sine";
    o1.frequency.value = 36;
    const o2 = ac.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = 52;
    o1.connect(rumble);
    o2.connect(rumble);
    o1.start();
    o2.start();

    const noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const rainSrc = ac.createBufferSource();
    rainSrc.buffer = noiseBuf;
    rainSrc.loop = true;
    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 900;
    const rainGain = ac.createGain();
    rainGain.gain.value = 0.12;
    rainSrc.connect(hp);
    hp.connect(rainGain);
    rainGain.connect(master);
    rainSrc.start();

    return {
      ac,
      start() {
        if (ac.state === "suspended") ac.resume();
        const now = ac.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.linearRampToValueAtTime(0.62, now + 0.4);
      },
      tick(t, shake) {
        const now = ac.currentTime;
        rumble.gain.setTargetAtTime(0.12 + t * 0.18 + shake * 0.45, now, 0.08);
        o1.frequency.setTargetAtTime(32 + t * 14 + shake * 10, now, 0.1);
        rainGain.gain.setTargetAtTime(lerp(0.14, 0.03, smoothstep(0.92, 0.99, t)), now, 0.12);
      },
      hit(kind) {
        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = kind === "eye" ? "square" : "sawtooth";
        osc.frequency.value = kind === "eye" ? 90 : 48;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(kind === "title" ? 0.5 : 0.32, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "title" ? 0.9 : 0.28));
        osc.connect(g);
        g.connect(master);
        osc.start(now);
        osc.stop(now + 1);
      },
    };
  }

  function render(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (playing && !userScrub) {
      const u = clamp((now - playStart) / TRAILER_MS, 0, 1);
      target = trailerMap(u);
      if (u >= 1) {
        playing = false;
        setPlayhead(1);
      }
    }

    const ease = reduced ? 1 : (playing ? 0.11 : 0.065);
    current += (target - current) * ease;
    if (Math.abs(target - current) < 0.00012) current = target;

    const t = clamp(current, 0, 1);
    const k = sampleKeys(t);
    const breathe = Math.sin(now * 0.001) * 0.003;
    const scale = Math.min(1.0, k.scale + breathe);
    const ox = k.shake ? (Math.random() - 0.5) * 8 * k.shake : 0;
    const oy = k.shake ? (Math.random() - 0.5) * 5 * k.shake : 0;

    ctx.fillStyle = "#020203";
    ctx.fillRect(0, 0, w, h);
    const aImg = images[k.frame];
    const bImg = images[k.nextFrame ?? k.frame];
    ctx.save();
    ctx.globalAlpha = 1;
    drawFit(ctx, aImg, scale, ox, oy);
    if (bImg && bImg !== aImg && k.mix > 0.01) {
      ctx.globalAlpha = k.mix;
      drawFit(ctx, bImg, scale, ox, oy);
    }
    ctx.restore();

    if (k.smash && k.smashGate > 0.55) {
      ctx.fillStyle = `rgba(0,0,0,${(k.smashGate - 0.55) * 1.6})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (k.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${k.fade})`;
      ctx.fillRect(0, 0, w, h);
    }

    const hitId = k.smash && k.mix > 0.2 ? k.nextFrame : -2;
    if (hitId >= 0 && hitId !== lastHit) {
      lastHit = hitId;
      const kind = hitId === 3 ? "eye" : hitId === 19 ? "title" : "hit";
      punch(kind);
    }

    drawWeather(dt, t, k.shake);
    applyWarn(t, now);
    applyEnd(t);
    if (ca) ca.style.opacity = String(0.25 + k.shake * 0.55);
    if (flare) flare.style.opacity = String(t > 0.94 ? 0.35 * (1 - t) * 8 : k.shake * 0.2);
    progressFill.style.width = `${t * 100}%`;
    document.body.classList.toggle("is-scrolled", t > 0.02);
    if (audio) audio.tick(t, k.shake);
    requestAnimationFrame(render);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(src));
      img.src = src;
    });
  }

  async function preload() {
    let done = 0;
    await Promise.all(FRAME_FILES.map((src, i) =>
      loadImage(src).then((img) => {
        images[i] = img;
        done += 1;
        if (bootFill) bootFill.style.width = `${Math.round((done / FRAME_FILES.length) * 100)}%`;
        if (bootStatus) bootStatus.textContent = `Plate ${done} / ${FRAME_FILES.length}`;
      })
    ));
    if (bootStatus) bootStatus.textContent = "Sequence locked";
    if (enterBtn) enterBtn.disabled = false;
  }

  function readScroll() {
    if (playing && !userScrub) return;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    target = clamp(window.scrollY / max, 0, 1);
  }

  function enter() {
    if (live) return;
    live = true;
    boot.classList.add("is-gone");
    document.documentElement.classList.add("is-live");
    document.body.classList.add("is-live");
    window.scrollTo(0, 0);
    target = 0;
    current = 0;
    userScrub = false;
    playing = true;
    playStart = performance.now();
    audio = createAudio();
    if (audio) audio.start();
  }

  enterBtn.addEventListener("click", enter);
  window.addEventListener("wheel", () => { if (live) userScrub = true; }, { passive: true });
  window.addEventListener("touchmove", () => { if (live) userScrub = true; }, { passive: true });
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", () => { resize(); seedWeather(); });
  window.addEventListener("keydown", (e) => {
    if (!live && (e.code === "Enter" || e.code === "Space")) {
      e.preventDefault();
      enter();
    }
  });

  resize();
  seedWeather();
  requestAnimationFrame(render);
  preload().catch(() => {
    if (bootStatus) bootStatus.textContent = "Sequence locked";
    if (enterBtn) enterBtn.disabled = false;
  });
})();
