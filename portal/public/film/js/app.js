(() => {
  "use strict";

  const FRAME_FILES = [
    "assets/frames/00a-foundry.jpg",
    "assets/frames/00b-silhouette.jpg",
    "assets/frames/00-darkness.jpg",
    "assets/frames/01-breathing.jpg",
    "assets/frames/02-one-eye.jpg",
    "assets/frames/03-both-eyes.jpg",
    "assets/frames/04-look.jpg",
    "assets/frames/05-reveal.jpg",
    "assets/frames/06-jaw.jpg",
    "assets/frames/07-tongue.jpg",
    "assets/frames/08-lunge.jpg",
    "assets/frames/09-blackout.jpg",
    "assets/frames/10-title.jpg",
    "assets/frames/11-lockup.jpg",
  ];

  const KEYS = [
    { t: 0.00, frame: 0, scale: 1.12, shake: 0, fade: 0.12, push: 0 },
    { t: 0.07, frame: 0, scale: 1.08, shake: 0, fade: 0.02, push: 0 },
    { t: 0.12, frame: 1, scale: 1.07, shake: 0, fade: 0, push: 0 },
    { t: 0.16, frame: 1, scale: 1.05, shake: 0, fade: 0, push: 0 },
    { t: 0.20, frame: 2, scale: 1.10, shake: 0, fade: 0.04, push: 0 },
    { t: 0.26, frame: 3, scale: 1.08, shake: 0, fade: 0, push: 0 },
    { t: 0.30, frame: 4, scale: 1.10, shake: 0, fade: 0, push: 0 },
    { t: 0.36, frame: 4, scale: 1.07, shake: 0, fade: 0, push: 0 },
    { t: 0.40, frame: 5, scale: 1.06, shake: 0, fade: 0, push: 0 },
    { t: 0.46, frame: 6, scale: 1.05, shake: 0, fade: 0, push: 0.05 },
    { t: 0.52, frame: 7, scale: 1.04, shake: 0, fade: 0, push: 0.1 },
    { t: 0.58, frame: 8, scale: 1.08, shake: 0, fade: 0, push: 0.16 },
    { t: 0.64, frame: 9, scale: 1.12, shake: 0.06, fade: 0, push: 0.28 },
    { t: 0.70, frame: 10, scale: 1.18, shake: 1.0, fade: 0, push: 0.7 },
    { t: 0.76, frame: 10, scale: 1.22, shake: 0.28, fade: 0.04, push: 0.85 },
    { t: 0.80, frame: 11, scale: 1.08, shake: 0.08, fade: 0.06, push: 0.2 },
    { t: 0.86, frame: 11, scale: 1.04, shake: 0, fade: 0.1, push: 0 },
    { t: 0.90, frame: 12, scale: 0.9, shake: 0, fade: 0, push: 0 },
    { t: 0.95, frame: 12, scale: 0.92, shake: 0, fade: 0, push: 0 },
    { t: 1.00, frame: 12, scale: 0.93, shake: 0, fade: 0, push: 0 },
  ];

  const CHAPTERS = [
    { t: 0.00, num: "00", title: "The Foundry", meta: "00 — THE FOUNDRY", line: "A drowned cathedral of steel" },
    { t: 0.18, num: "01", title: "The Dark", meta: "01 — THE DARK", line: "It waits without a name" },
    { t: 0.30, num: "02", title: "Awakening", meta: "02 — AWAKENING", line: "One eye. Then the other." },
    { t: 0.44, num: "03", title: "The Leviathan", meta: "03 — THE LEVIATHAN", line: "It looks back" },
    { t: 0.56, num: "04", title: "Hunger", meta: "04 — HUNGER", line: "The jaw learns the air" },
    { t: 0.68, num: "05", title: "Impact", meta: "05 — IMPACT", line: "Weight. Inertia. Now." },
    { t: 0.78, num: "06", title: "Rupture", meta: "06 — RUPTURE", line: "It builds itself from the wreck" },
    { t: 0.88, num: "07", title: "The Name", meta: "07 — THE NAME", line: "LEGO LEVIATHAN" },
  ];

  const $ = (id) => document.getElementById(id);

  const stage = $("stage");
  const canvas = $("frames");
  const fxCanvas = $("fx");
  if (!canvas || !fxCanvas) {
    console.error("Leviathan stage missing");
    return;
  }
  const ctx = canvas.getContext("2d", { alpha: false });
  const fx = fxCanvas.getContext("2d");
  const boot = $("boot");
  const bootFill = $("boot-fill");
  const bootStatus = $("boot-status");
  const enterBtn = $("enter");
  const progressFill = $("progress-fill");
  const capKicker = $("cap-kicker");
  const capTitle = $("cap-title");
  const capLine = $("cap-line");
  const chromeMeta = $("chrome-meta");
  const ticksRoot = $("ticks");
  const flashEl = $("flash");
  const audioBtn = $("audio-btn");
  const titleRoot = $("title");
  const legoCells = [...document.querySelectorAll("#word-lego .cell")];
  const wordLeviathan = $("word-leviathan");
  const tagline = $("tagline");

  const images = new Array(FRAME_FILES.length);
  let w = 0;
  let h = 0;
  let dpr = 1;
  let target = 0;
  let current = 0;
  let lastFlash = 0;
  let live = false;
  let audioOn = false;
  let audio = null;
  let lastChapter = "";
  let lastTime = performance.now();

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (ticksRoot) {
    CHAPTERS.forEach((ch) => {
      const b = document.createElement("button");
      b.type = "button";
      b.title = ch.title;
      b.innerHTML = "<span>" + ch.num + "</span>";
      b.addEventListener("click", () => {
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        scrollTo({ top: ch.t * max, behavior: reduced ? "auto" : "smooth" });
      });
      ticksRoot.appendChild(b);
    });
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(e0, e1, x) {
    const t = clamp((x - e0) / (e1 - e0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function sampleKeys(t) {
    if (t <= KEYS[0].t) return { ...KEYS[0], mix: 0, next: KEYS[0] };
    if (t >= KEYS[KEYS.length - 1].t) {
      const k = KEYS[KEYS.length - 1];
      return { ...k, mix: 0, next: k };
    }
    let i = 0;
    while (i < KEYS.length - 1 && KEYS[i + 1].t < t) i += 1;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const mix = smoothstep(a.t, b.t, t);
    return {
      frame: a.frame,
      nextFrame: b.frame,
      mix,
      scale: lerp(a.scale, b.scale, mix),
      shake: lerp(a.shake, b.shake, mix),
      fade: lerp(a.fade, b.fade, mix),
      push: lerp(a.push, b.push, mix),
      lift: lerp(a.lift || 0, b.lift || 0, mix),
      next: b,
    };
  }

  function chapterAt(t) {
    let c = CHAPTERS[0];
    for (const ch of CHAPTERS) if (t >= ch.t) c = ch;
    return c;
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

  function drawCover(context, img, scale, ox, oy) {
    if (!img || !img.width) return;
    const ir = img.width / img.height;
    const cr = w / h;
    let dw;
    let dh;
    if (ir > cr) {
      dh = h * scale;
      dw = dh * ir;
    } else {
      dw = w * scale;
      dh = dw / ir;
    }
    context.drawImage(img, (w - dw) * 0.5 + ox, (h - dh) * 0.5 + oy, dw, dh);
  }

  function drawContain(context, img, scale, ox, oy) {
    if (!img || !img.width) return;
    const ir = img.width / img.height;
    const cr = w / h;
    let dw;
    let dh;
    if (ir > cr) {
      dw = w * scale;
      dh = dw / ir;
    } else {
      dh = h * scale;
      dw = dh * ir;
    }
    context.drawImage(img, (w - dw) * 0.5 + ox, (h - dh) * 0.5 + oy, dw, dh);
  }

  function drawPlate(context, img, frame, scale, ox, oy) {
    if (frame >= 12) drawContain(context, img, scale, ox, oy);
    else drawCover(context, img, scale, ox, oy);
  }

  /* ---------- rain / bricks ---------- */
  const rains = [];
  const splashes = [];
  const bricks = [];

  function seedWeather() {
    rains.length = 0;
    const count = w < 720 ? 90 : 160;
    for (let i = 0; i < count; i += 1) {
      rains.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 10 + Math.random() * 18,
        spd: 14 + Math.random() * 22,
        w: Math.random() < 0.15 ? 1.4 : 0.7,
        a: 0.12 + Math.random() * 0.28,
      });
    }
  }

  function spawnSplash(x, y) {
    if (splashes.length > 80) return;
    splashes.push({
      x,
      y,
      r: 1,
      a: 0.35,
      vr: 1.4 + Math.random(),
    });
  }

  function seedBricks() {
    bricks.length = 0;
    const n = w < 720 ? 46 : 78;
    for (let i = 0; i < n; i += 1) {
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.2;
      const rad = 80 + Math.random() * Math.min(w, h) * 0.42;
      bricks.push({
        ox: Math.cos(ang) * rad,
        oy: Math.sin(ang) * rad * 0.62,
        z: Math.random(),
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.04,
        bw: 6 + Math.random() * 16,
        bh: 4 + Math.random() * 8,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawWeather(dt, t, shake) {
    fx.clearRect(0, 0, w, h);
    const rainAmt = 1 - smoothstep(0.88, 0.96, t);
    const wind = 1.6 + shake * 8;

    fx.save();
    fx.translate(shake * (Math.random() - 0.5) * 10, shake * (Math.random() - 0.5) * 8);

    if (rainAmt > 0.02) {
      fx.lineCap = "round";
      for (const d of rains) {
        d.y += d.spd * dt * 60 * (0.7 + rainAmt);
        d.x += wind * dt * 40;
        if (d.y > h * 0.92) {
          if (Math.random() < 0.18 * rainAmt) spawnSplash(d.x, h * 0.9 + Math.random() * h * 0.06);
          d.y = -20;
          d.x = Math.random() * w;
        }
        if (d.x > w + 20) d.x = -10;
        fx.strokeStyle = `rgba(210,220,230,${d.a * rainAmt})`;
        fx.lineWidth = d.w;
        fx.beginPath();
        fx.moveTo(d.x, d.y);
        fx.lineTo(d.x + wind * 0.35, d.y + d.len);
        fx.stroke();
      }

      for (let i = splashes.length - 1; i >= 0; i -= 1) {
        const s = splashes[i];
        s.r += s.vr;
        s.a *= 0.9;
        fx.beginPath();
        fx.strokeStyle = `rgba(200,210,220,${s.a * rainAmt})`;
        fx.lineWidth = 0.8;
        fx.ellipse(s.x, s.y, s.r, s.r * 0.35, 0, 0, Math.PI * 2);
        fx.stroke();
        if (s.a < 0.02) splashes.splice(i, 1);
      }
    }

    const brickT = smoothstep(0.875, 0.98, t);
    if (brickT > 0) {
      const assemble = smoothstep(0.92, 0.995, t);
      const cx = w * 0.5;
      const cy = h * 0.46;
      for (const b of bricks) {
        b.rot += b.vr;
        const orbit = 1 - assemble * 0.82;
        const jitter = Math.sin(performance.now() * 0.0012 + b.phase) * 6 * (1 - assemble);
        const x = cx + b.ox * orbit + jitter;
        const y = cy + b.oy * orbit + Math.cos(performance.now() * 0.001 + b.phase) * 4 * (1 - assemble);
        const s = lerp(0.7, 1.25, b.z) * lerp(1, 0.35, assemble);
        const a = brickT * lerp(0.25, 0.85, b.z) * (1 - assemble * 0.55);
        fx.save();
        fx.translate(x, y);
        fx.rotate(b.rot);
        fx.fillStyle = `rgba(${20 + b.z * 40},${22 + b.z * 40},${26 + b.z * 44},${a})`;
        fx.strokeStyle = `rgba(180,185,195,${a * 0.45})`;
        fx.lineWidth = 0.6;
        fx.fillRect(-b.bw * s, -b.bh * s, b.bw * 2 * s, b.bh * 2 * s);
        fx.strokeRect(-b.bw * s, -b.bh * s, b.bw * 2 * s, b.bh * 2 * s);
        fx.fillStyle = `rgba(210,214,220,${a * 0.35})`;
        fx.beginPath();
        fx.arc(-b.bw * s * 0.35, -b.bh * s * 0.15, Math.max(1.2, b.bh * s * 0.28), 0, Math.PI * 2);
        fx.arc(b.bw * s * 0.35, -b.bh * s * 0.15, Math.max(1.2, b.bh * s * 0.28), 0, Math.PI * 2);
        fx.fill();
        fx.restore();
      }
    }

    fx.restore();
  }

  function applyTitle(t) {
    if (!titleRoot) return;
    document.body.classList.toggle("is-title", t > 0.88);
    document.body.classList.toggle("is-lock", t > 0.95);
    titleRoot.style.opacity = String(smoothstep(0.94, 0.975, t));

    legoCells.forEach((cell) => {
      cell.style.opacity = "0";
    });
    if (wordLeviathan) wordLeviathan.style.opacity = "0";

    const tag = smoothstep(0.955, 0.99, t);
    if (tagline) {
      tagline.style.opacity = String(tag);
      tagline.style.transform = `translateY(${lerp(18, 0, tag)}px)`;
    }
  }

  function render(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    const ease = reduced ? 1 : 0.075;
    current += (target - current) * ease;
    if (Math.abs(target - current) < 0.00015) current = target;

    const t = clamp(current, 0, 1);
    const k = sampleKeys(t);

    const breathe = live && t < 0.2 ? Math.sin(now * 0.0016) * 0.006 : 0;
    const scale = k.scale + breathe;
    const shakeAmp = k.shake;
    const ox = shakeAmp ? (Math.random() - 0.5) * 18 * shakeAmp : 0;
    const oy = shakeAmp ? (Math.random() - 0.5) * 12 * shakeAmp : 0;
    const pushX = 0;
    const pushY = k.push * 10 + (k.lift || 0) * h;

    ctx.fillStyle = "#030305";
    ctx.fillRect(0, 0, w, h);

    const aImg = images[k.frame];
    const bImg = images[k.nextFrame ?? k.frame];
    const mix = k.mix || 0;

    ctx.save();
    ctx.globalAlpha = 1;
    drawPlate(ctx, aImg, k.frame, scale, ox + pushX, oy + pushY);
    if (bImg && bImg !== aImg && mix > 0.01) {
      ctx.globalAlpha = mix;
      drawPlate(ctx, bImg, k.nextFrame ?? k.frame, scale, ox + pushX, oy + pushY);
    }
    ctx.restore();

    if (k.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${k.fade})`;
      ctx.fillRect(0, 0, w, h);
    }

    drawWeather(dt, t, shakeAmp);
    applyTitle(t);

    progressFill.style.width = `${t * 100}%`;

    const ch = chapterAt(t);
    if (ch.meta !== lastChapter) {
      lastChapter = ch.meta;
      capKicker.textContent = ch.num;
      capTitle.textContent = ch.title;
      if (capLine) capLine.textContent = ch.line || "";
      chromeMeta.textContent = ch.meta;
    }
    if (ticksRoot) {
      [...ticksRoot.children].forEach((el, i) => {
        el.classList.toggle("is-on", CHAPTERS[i] === ch);
      });
    }

    if (shakeAmp > 0.7 && now - lastFlash > 420) {
      lastFlash = now;
      flashEl.style.transition = "none";
      flashEl.style.opacity = "0.55";
      requestAnimationFrame(() => {
        flashEl.style.transition = "opacity 280ms ease";
        flashEl.style.opacity = "0";
      });
    }

    document.body.classList.toggle("is-scrolled", t > 0.03);

    if (audio) audio.tick(t, shakeAmp);

    requestAnimationFrame(render);
  }

  /* ---------- audio ---------- */
  function createAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ac = new AC();

    const master = ac.createGain();
    master.gain.value = 0.0001;
    master.connect(ac.destination);

    const rainGain = ac.createGain();
    rainGain.gain.value = 0.22;
    rainGain.connect(master);

    const rumbleGain = ac.createGain();
    rumbleGain.gain.value = 0.0;
    rumbleGain.connect(master);

    // Filtered noise = rain
    const bufSize = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i += 1) data[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 900;
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4200;
    noise.connect(hp);
    hp.connect(lp);
    lp.connect(rainGain);
    noise.start();

    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 38;
    const osc2 = ac.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = 52;
    const oscG = ac.createGain();
    oscG.gain.value = 0.35;
    osc.connect(oscG);
    osc2.connect(oscG);
    oscG.connect(rumbleGain);
    osc.start();
    osc2.start();

    return {
      ac,
      setOn(on) {
        const now = ac.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.linearRampToValueAtTime(on ? 0.55 : 0.0001, now + 0.35);
      },
      tick(t, shake) {
        const now = ac.currentTime;
        const rain = lerp(0.28, 0.08, smoothstep(0.86, 0.97, t));
        rainGain.gain.setTargetAtTime(rain, now, 0.12);
        const rumble = 0.04 + t * 0.12 + shake * 0.45 + smoothstep(0.7, 0.84, t) * 0.2;
        rumbleGain.gain.setTargetAtTime(rumble, now, 0.08);
        osc.frequency.setTargetAtTime(34 + t * 10 + shake * 8, now, 0.1);
      },
      resume() {
        if (ac.state === "suspended") ac.resume();
      },
    };
  }

  function setAudio(on) {
    audioOn = on;
    audioBtn.setAttribute("aria-pressed", on ? "true" : "false");
    if (audio) {
      audio.resume();
      audio.setOn(on);
    }
  }

  /* ---------- loading ---------- */
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
    const total = FRAME_FILES.length;
    await Promise.all(
      FRAME_FILES.map((src, i) =>
        loadImage(src).then((img) => {
          images[i] = img;
          done += 1;
          const p = done / total;
          bootFill.style.width = `${Math.round(p * 100)}%`;
          boot.querySelector(".boot-bar").setAttribute("aria-valuenow", String(Math.round(p * 100)));
          bootStatus.textContent = `Plate ${done} / ${total}`;
        })
      )
    );
    bootStatus.textContent = "Sequence locked";
    boot.classList.add("is-ready");
    enterBtn.hidden = false;
    enterBtn.disabled = false;
  }

  function readScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    target = clamp(window.scrollY / max, 0, 1);
  }

  function enter() {
    if (live || enterBtn.disabled) return;
    live = true;
    audio = createAudio();
    setAudio(true);
    boot.classList.add("is-gone");
    document.documentElement.classList.add("is-live");
    document.body.classList.add("is-live");
    audioBtn.hidden = false;
    window.scrollTo(0, 0);
    target = 0;
    current = 0;
  }

  audioBtn.addEventListener("click", () => {
    if (!audio) audio = createAudio();
    setAudio(!audioOn);
  });

  enterBtn.addEventListener("click", enter);

  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", () => {
    resize();
    seedWeather();
    seedBricks();
  });

  window.addEventListener("keydown", (e) => {
    if (!live && (e.code === "Enter" || e.code === "Space")) {
      e.preventDefault();
      enter();
    }
  });

  resize();
  seedWeather();
  seedBricks();
  requestAnimationFrame(render);

  preload().catch(() => {
    bootStatus.textContent = "Sequence locked";
    boot.classList.add("is-ready");
    enterBtn.hidden = false;
    enterBtn.disabled = false;
  });
})();
