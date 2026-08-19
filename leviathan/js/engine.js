import * as THREE from "three";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / Math.max(1e-6, e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

const KEYS = [
  { t: 0.00, frame: 0, camZ: 17.4, camY: 0.16, fov: 31.6, fade: 0.20, bloom: 0.08, shake: 0, grade: 0.15 },
  { t: 0.10, frame: 0, camZ: 16.8, camY: 0.13, fov: 31.3, fade: 0.06, bloom: 0.10, shake: 0, grade: 0.2 },
  { t: 0.18, frame: 1, camZ: 16.1, camY: 0.10, fov: 31.0, fade: 0.00, bloom: 0.14, shake: 0, grade: 0.35 },
  { t: 0.22, frame: 2, camZ: 15.6, camY: 0.08, fov: 30.7, fade: 0.00, bloom: 0.28, shake: 0, grade: 0.4 },
  { t: 0.34, frame: 2, camZ: 15.0, camY: 0.06, fov: 30.4, fade: 0.00, bloom: 0.32, shake: 0, grade: 0.45 },
  { t: 0.38, frame: 3, camZ: 14.5, camY: 0.04, fov: 30.1, fade: 0.00, bloom: 0.38, shake: 0, grade: 0.5 },
  { t: 0.46, frame: 4, camZ: 13.8, camY: 0.02, fov: 29.8, fade: 0.00, bloom: 0.42, shake: 0, grade: 0.55 },
  { t: 0.56, frame: 5, camZ: 13.1, camY: 0.00, fov: 29.5, fade: 0.00, bloom: 0.36, shake: 0, grade: 0.6 },
  { t: 0.64, frame: 6, camZ: 12.4, camY: -0.02,fov: 29.1, fade: 0.00, bloom: 0.50, shake: 0.04, grade: 0.7 },
  { t: 0.72, frame: 7, camZ: 11.6, camY: -0.04,fov: 28.6, fade: 0.00, bloom: 0.62, shake: 0.12, grade: 0.8 },
  { t: 0.78, frame: 8, camZ: 10.5, camY: -0.06,fov: 27.8, fade: 0.00, bloom: 0.78, shake: 1.00, grade: 0.9 },
  { t: 0.86, frame: 8, camZ: 10.1, camY: -0.07,fov: 27.4, fade: 0.06, bloom: 0.55, shake: 0.26, grade: 0.85 },
  { t: 0.90, frame: 9, camZ: 13.2, camY: 0.28, fov: 30.4, fade: 0.16, bloom: 0.22, shake: 0, grade: 0.45 },
  { t: 0.95, frame: 9, camZ: 14.2, camY: 0.42, fov: 31.0, fade: 0.34, bloom: 0.18, shake: 0, grade: 0.25 },
  { t: 1.00, frame: 9, camZ: 14.6, camY: 0.48, fov: 31.2, fade: 0.42, bloom: 0.16, shake: 0, grade: 0.2 },
];

function sampleKeys(t) {
  if (t <= KEYS[0].t) return { a: KEYS[0], b: KEYS[0], mix: 0 };
  if (t >= KEYS[KEYS.length - 1].t) {
    const k = KEYS[KEYS.length - 1];
    return { a: k, b: k, mix: 0 };
  }
  let i = 0;
  while (i < KEYS.length - 1 && KEYS[i + 1].t < t) i += 1;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  return { a, b, mix: smoothstep(a.t, b.t, t) };
}

function mixKeys(t) {
  const { a, b, mix } = sampleKeys(t);
  const out = { mix, frame: a.frame, nextFrame: b.frame };
  for (const k of ["camZ", "camY", "fov", "fade", "bloom", "shake", "grade"]) {
    out[k] = lerp(a[k], b[k], mix);
  }
  return out;
}

const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001"],
  E: ["11111", "10000", "11110", "10000", "11111"],
  G: ["01111", "10000", "10111", "10001", "01110"],
  H: ["10001", "10001", "11111", "10001", "10001"],
  I: ["111", "010", "010", "010", "111"],
  L: ["1000", "1000", "1000", "1000", "1111"],
  N: ["10001", "11001", "10101", "10011", "10001"],
  O: ["01110", "10001", "10001", "10001", "01110"],
  T: ["11111", "00100", "00100", "00100", "00100"],
  V: ["10001", "10001", "10001", "01010", "00100"],
};

const PLATE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLATE_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D tA;
  uniform sampler2D tB;
  uniform vec2 uAspectA;
  uniform vec2 uAspectB;
  uniform float uMix;
  uniform float uZoom;
  uniform vec2 uOffset;
  uniform float uAberr;
  uniform float uVignette;
  uniform float uGrain;
  uniform float uTime;
  uniform float uFade;
  uniform float uBloom;
  uniform float uGrade;
  uniform float uBlur;
  uniform vec2 uVel;

  vec2 cover(vec2 uv, vec2 aspect) {
    vec2 r = aspect;
    vec2 s = vec2(1.0);
    if (r.x > r.y) s = vec2(r.y / r.x, 1.0);
    else s = vec2(1.0, r.x / r.y);
    return (uv - 0.5) * s + 0.5;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  vec3 samplePlate(sampler2D tex, vec2 uv, vec2 aspect, float aberr) {
    vec2 cuv = cover(uv, aspect);
    cuv = (cuv - 0.5) / uZoom + 0.5 + uOffset;
    cuv += uVel * 0.012;
    if (cuv.x < -0.02 || cuv.x > 1.02 || cuv.y < -0.02 || cuv.y > 1.02) {
      return vec3(0.01, 0.012, 0.016);
    }
    vec2 dir = (cuv - 0.5);
    vec3 col;
    col.r = texture2D(tex, cuv + dir * aberr).r;
    col.g = texture2D(tex, cuv).g;
    col.b = texture2D(tex, cuv - dir * aberr).b;
    if (uBlur > 0.001) {
      vec3 acc = col;
      for (int i = 1; i <= 4; i++) {
        float f = float(i) / 4.0;
        acc += texture2D(tex, cuv + dir * uBlur * f).rgb;
        acc += texture2D(tex, cuv - dir * uBlur * f).rgb;
      }
      col = acc / 9.0;
    }
    return col;
  }

  void main() {
    vec2 uv = vUv;
    vec3 a = samplePlate(tA, uv, uAspectA, uAberr);
    vec3 b = samplePlate(tB, uv, uAspectB, uAberr);
    vec3 col = mix(a, b, uMix);

    float lum = max(col.r, max(col.g, col.b));
    vec3 streak = vec3(0.0);
    for (int i = -7; i <= 7; i++) {
      if (i == 0) continue;
      vec2 suv = cover(uv + vec2(float(i) * 0.0028, 0.0), uAspectA);
      suv = (suv - 0.5) / uZoom + 0.5 + uOffset;
      streak += texture2D(tA, suv).rgb;
    }
    streak /= 14.0;
    col += streak * smoothstep(0.62, 0.95, lum) * uBloom * 0.42;

    col = mix(col, col * vec3(1.06, 1.02, 0.96) + vec3(0.03, 0.0, 0.0) * uGrade, uGrade * 0.35);
    col = (col - 0.5) * (1.0 + uGrade * 0.18) + 0.5;

    float n = hash(gl_FragCoord.xy + vec2(uTime * 60.0, uTime * 17.0));
    col += (n - 0.5) * uGrain;

    float vig = distance(uv, vec2(0.5, 0.48));
    col *= 1.0 - smoothstep(0.35, 0.92, vig) * uVignette;
    col *= 1.0 - uFade;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function makeAbsMaterial(color, roughness = 0.46) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.12,
    envMapIntensity: 0.6,
  });
}

function makeStuddedBrick(w, h, d, color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), makeAbsMaterial(color));
  body.castShadow = false;
  group.add(body);

  const studR = Math.min(w, d) * 0.13;
  const studH = h * 0.16;
  const studGeo = new THREE.CylinderGeometry(studR, studR, studH, 14);
  const studMat = makeAbsMaterial(new THREE.Color(color).offsetHSL(0, 0, 0.07), 0.38);
  const nx = w > 0.7 ? 2 : 1;
  const nz = d > 0.7 ? 2 : 1;
  const gapX = w / (nx + 1);
  const gapZ = d / (nz + 1);
  for (let ix = 0; ix < nx; ix += 1) {
    for (let iz = 0; iz < nz; iz += 1) {
      const stud = new THREE.Mesh(studGeo, studMat);
      stud.position.set(-w / 2 + gapX * (ix + 1), h / 2 + studH / 2, -d / 2 + gapZ * (iz + 1));
      group.add(stud);
    }
  }
  return group;
}

function letterTexture(ch) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 20, 0, 236);
  grd.addColorStop(0, "#f4f5f8");
  grd.addColorStop(0.45, "#8c9098");
  grd.addColorStop(0.52, "#eceef2");
  grd.addColorStop(1, "#5c6068");
  g.fillStyle = "#111216";
  g.fillRect(0, 0, 256, 256);
  g.font = "700 176px Bebas Neue, Impact, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = grd;
  g.fillText(ch, 128, 148);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildGlyphWord(word, cell = 0.16, gap = 0.045) {
  const voxels = [];
  let cursor = 0;
  const letterWidths = [];
  for (const ch of word) {
    const g = GLYPHS[ch];
    if (!g) {
      cursor += cell * 1.4;
      continue;
    }
    letterWidths.push({ ch, x: cursor, rows: g });
    cursor += (g[0].length + 1) * (cell + gap * 0.15);
  }
  const total = cursor - cell;
  for (const L of letterWidths) {
    L.rows.forEach((row, y) => {
      [...row].forEach((bit, x) => {
        if (bit !== "1") return;
        voxels.push({
          x: L.x + x * (cell + gap * 0.15) - total / 2,
          y: (L.rows.length - y) * (cell + gap * 0.12),
          ch: L.ch,
        });
      });
    });
  }
  return { voxels, cell, height: 6 * (cell + gap * 0.12) };
}

export function createEngine(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    alpha: false,
  });
  renderer.setClearColor(0x030305, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.028);

  const camera = new THREE.PerspectiveCamera(31, 1, 0.05, 80);
  camera.position.set(0, 0.15, 11.2);

  scene.add(new THREE.AmbientLight(0x1a1e26, 0.55));
  const hemi = new THREE.HemisphereLight(0x8aa0b8, 0x080604, 0.45);
  scene.add(hemi);
  const rim = new THREE.DirectionalLight(0xc5d4e6, 1.15);
  rim.position.set(-4.5, 6.5, -6);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x2a3340, 0.35);
  fill.position.set(5, 1.5, 6);
  scene.add(fill);
  const throat = new THREE.PointLight(0xff2a18, 0.0, 14, 2);
  throat.position.set(0.15, -0.2, 1.4);
  scene.add(throat);

  const plateUniforms = {
    tA: { value: null },
    tB: { value: null },
    uAspectA: { value: new THREE.Vector2(1, 1) },
    uAspectB: { value: new THREE.Vector2(1, 1) },
    uMix: { value: 0 },
    uZoom: { value: 1.08 },
    uOffset: { value: new THREE.Vector2(0, 0) },
    uAberr: { value: 0.0015 },
    uVignette: { value: 0.72 },
    uGrain: { value: 0.045 },
    uTime: { value: 0 },
    uFade: { value: 0.15 },
    uBloom: { value: 0.2 },
    uGrade: { value: 0.3 },
    uBlur: { value: 0 },
    uVel: { value: new THREE.Vector2(0, 0) },
  };

  const plateMat = new THREE.ShaderMaterial({
    uniforms: plateUniforms,
    vertexShader: PLATE_VERT,
    fragmentShader: PLATE_FRAG,
    depthWrite: true,
    toneMapped: false,
  });
  plateMat.toneMapped = false;

  const plate = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), plateMat);
  plate.position.set(0, 0.15, 0);
  scene.add(plate);

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0c10,
    roughness: 0.18,
    metalness: 0.55,
    transparent: true,
    opacity: 0.42,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 18), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -4.55, 2.2);
  scene.add(floor);

  const reflection = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), plateMat);
  reflection.scale.y = -1;
  reflection.position.set(0, -4.85, 0.15);
  reflection.renderOrder = -1;
  scene.add(reflection);

  const steamTex = makeSteamTexture();
  const steams = [];
  for (let i = 0; i < 4; i += 1) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(7.5, 5.2),
      new THREE.MeshBasicMaterial({
        map: steamTex,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    m.position.set((i - 1.5) * 2.4, -0.4 + (i % 2) * 0.8, 1.2 + i * 0.35);
    m.userData.phase = i * 1.7;
    scene.add(m);
    steams.push(m);
  }

  const rain = createRain(520);
  scene.add(rain.mesh);

  const motes = createMotes(160);
  scene.add(motes.mesh);

  const debris = createDebris(110);
  scene.add(debris.mesh);

  const title = createTitleRig();
  scene.add(title.group);

  const textures = [];
  let w = 1;
  let h = 1;
  let pointer = { x: 0, y: 0 };
  const shake = { x: 0, y: 0, vx: 0, vy: 0 };
  let lastImpulseT = -1;
  let lastVel = 0;

  function setTextures(images) {
    textures.length = 0;
    for (const img of images) {
      if (!img) {
        textures.push(null);
        continue;
      }
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      textures.push(tex);
    }
    if (textures[0]) {
      plateUniforms.tA.value = textures[0];
      plateUniforms.tB.value = textures[0];
      plateUniforms.uAspectA.value.set(images[0].width / images[0].height, 16 / 9);
      plateUniforms.uAspectB.value.set(images[0].width / images[0].height, 16 / 9);
    }
  }

  function resize() {
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function impulse(mag) {
    shake.vx += (Math.random() - 0.5) * mag;
    shake.vy += (Math.random() - 0.5) * mag * 0.7;
  }

  function update(t, dt, velocity, live) {
    const k = mixKeys(t);
    const now = performance.now() * 0.001;
    plateUniforms.uTime.value = now;

    const imgA = textures[k.frame];
    const imgB = textures[k.nextFrame] || imgA;
    if (imgA) plateUniforms.tA.value = imgA;
    if (imgB) plateUniforms.tB.value = imgB;

    const srcA = imgA && imgA.image;
    const srcB = imgB && imgB.image;
    if (srcA) plateUniforms.uAspectA.value.set(srcA.width / srcA.height, 16 / 9);
    if (srcB) plateUniforms.uAspectB.value.set(srcB.width / srcB.height, 16 / 9);

    plateUniforms.uMix.value = k.frame === k.nextFrame ? 0 : k.mix;
    const breathe = live && t < 0.22 ? Math.sin(now * 1.55) * 0.012 : 0;
    plateUniforms.uZoom.value = 1.02 + (1 - t) * 0.03 + breathe;
    plateUniforms.uFade.value = k.fade;
    plateUniforms.uBloom.value = k.bloom;
    plateUniforms.uGrade.value = k.grade;
    plateUniforms.uAberr.value = 0.0012 + Math.abs(velocity) * 0.08 + k.shake * 0.006;
    plateUniforms.uBlur.value = Math.min(0.045, Math.abs(velocity) * 0.55 + k.shake * 0.012);
    plateUniforms.uGrain.value = 0.04 + k.shake * 0.02;
    plateUniforms.uVel.value.set(pointer.x * 0.01 + velocity * 0.4, -pointer.y * 0.008);

    if (k.shake > 0.65 && t - lastImpulseT > 0.045) {
      impulse(k.shake * 1.8);
      lastImpulseT = t;
    }
    const spring = 70;
    const damp = 8.5;
    shake.vx += -shake.x * spring * dt;
    shake.vy += -shake.y * spring * dt;
    shake.vx *= Math.exp(-damp * dt);
    shake.vy *= Math.exp(-damp * dt);
    shake.x += shake.vx * dt;
    shake.y += shake.vy * dt;

    const lookY = k.camY + pointer.y * 0.12;
    const camX = pointer.x * 0.22 + shake.x * 0.085;
    const camY = k.camY * 0.35 + 0.12 + pointer.y * 0.1 + shake.y * 0.06 + (live && t < 0.2 ? Math.sin(now * 1.4) * 0.03 : 0);
    camera.position.set(camX, camY, k.camZ);
    camera.fov = k.fov + Math.sin(now * 0.7) * 0.08 + k.shake * 0.35;
    camera.lookAt(pointer.x * 0.15, lookY * 0.4, 0);
    camera.updateProjectionMatrix();

    plate.position.x = pointer.x * 0.08;
    plate.position.y = 0.15 + pointer.y * 0.05;
    reflection.position.x = plate.position.x;
    reflection.scale.y = -1;
    floor.material.opacity = lerp(0.5, 0.18, smoothstep(0.86, 0.98, t));

    throat.intensity = smoothstep(0.58, 0.78, t) * 3.4 * (1 - smoothstep(0.86, 0.94, t));

    const wind = 0.35 + k.shake * 2.4 + Math.abs(velocity) * 8;
    rain.update(dt, now, t, wind);
    motes.update(now, t);
    debris.update(now, t, k.shake);
    title.update(t, now);

    for (const s of steams) {
      s.rotation.z = Math.sin(now * 0.12 + s.userData.phase) * 0.12;
      s.position.y += Math.sin(now * 0.18 + s.userData.phase) * 0.0008;
      s.material.opacity = 0.07 + (1 - smoothstep(0.88, 0.97, t)) * 0.08;
    }

    lastVel = velocity;
    renderer.render(scene, camera);
    return k;
  }

  function setPointer(nx, ny) {
    pointer.x = nx;
    pointer.y = ny;
  }

  function dispose() {
    renderer.dispose();
  }

  resize();

  return { resize, setTextures, update, setPointer, dispose, impulse };
}

function makeSteamTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  const img = g.createImageData(256, 256);
  for (let y = 0; y < 256; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      const n =
        Math.sin(x * 0.04) * Math.cos(y * 0.035) * 0.5 +
        Math.sin(x * 0.11 + y * 0.07) * 0.25 +
        Math.random() * 0.25;
      const v = Math.max(0, n);
      const fall = 1 - Math.abs(y - 128) / 128;
      const a = Math.pow(v * fall, 1.6) * 180;
      const i = (y * 256 + x) * 4;
      img.data[i] = 190;
      img.data[i + 1] = 205;
      img.data[i + 2] = 220;
      img.data[i + 3] = a;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

function createRain(count) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 6);
  const seeds = [];
  for (let i = 0; i < count; i += 1) {
    seeds.push({
      x: (Math.random() - 0.5) * 22,
      z: (Math.random() - 0.5) * 16,
      y: (Math.random() - 0.5) * 16,
      spd: 7 + Math.random() * 11,
      len: 0.22 + Math.random() * 0.45,
    });
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0xb7c2cc,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const mesh = new THREE.LineSegments(geo, mat);

  function update(dt, now, t, wind) {
    const amt = 1 - smoothstep(0.88, 0.97, t);
    mat.opacity = 0.08 + amt * 0.2;
    const pos = geo.attributes.position.array;
    for (let i = 0; i < count; i += 1) {
      const s = seeds[i];
      s.y -= s.spd * dt * (0.85 + amt);
      s.x += wind * dt * 0.35;
      if (s.y < -8) {
        s.y = 8;
        s.x = (Math.random() - 0.5) * 22;
      }
      if (s.x > 12) s.x = -12;
      const o = i * 6;
      pos[o] = s.x;
      pos[o + 1] = s.y;
      pos[o + 2] = s.z;
      pos[o + 3] = s.x + wind * 0.05;
      pos[o + 4] = s.y - s.len;
      pos[o + 5] = s.z;
    }
    geo.attributes.position.needsUpdate = true;
  }

  return { mesh, update };
}

function createMotes(count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seeds = [];
  for (let i = 0; i < count; i += 1) {
    seeds.push({
      x: (Math.random() - 0.5) * 16,
      y: (Math.random() - 0.5) * 8,
      z: (Math.random() - 0.5) * 10,
      p: Math.random() * Math.PI * 2,
    });
    pos[i * 3] = seeds[i].x;
    pos[i * 3 + 1] = seeds[i].y;
    pos[i * 3 + 2] = seeds[i].z;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xcfd6de,
    size: 0.028,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const mesh = new THREE.Points(geo, mat);
  function update(now, t) {
    const arr = geo.attributes.position.array;
    for (let i = 0; i < count; i += 1) {
      const s = seeds[i];
      arr[i * 3] = s.x + Math.sin(now * 0.15 + s.p) * 0.25;
      arr[i * 3 + 1] = s.y + Math.sin(now * 0.12 + s.p * 1.7) * 0.2;
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = 0.1 + (1 - smoothstep(0.9, 1, t)) * 0.16;
  }
  return { mesh, update };
}

function createDebris(count) {
  const geo = new THREE.BoxGeometry(0.16, 0.08, 0.08);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a1c22,
    roughness: 0.48,
    metalness: 0.18,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const ang = (i / count) * Math.PI * 2;
    const rad = 1.4 + Math.random() * 3.6;
    items.push({
      ox: Math.cos(ang) * rad,
      oy: Math.sin(ang * 1.7) * rad * 0.45,
      oz: (Math.random() - 0.5) * 1.8,
      rx: Math.random() * Math.PI,
      ry: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 1.4,
      s: 0.55 + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2,
    });
  }
  function update(now, t, shake) {
    const appear = smoothstep(0.865, 0.92, t);
    const assemble = smoothstep(0.92, 0.995, t);
    mesh.visible = appear > 0.01;
    if (!mesh.visible) return;
    for (let i = 0; i < count; i += 1) {
      const b = items[i];
      const orbit = 1 - assemble * 0.88;
      dummy.position.set(
        b.ox * orbit + Math.sin(now * 0.7 + b.phase) * 0.08 * (1 - assemble),
        b.oy * orbit + 0.35 + Math.cos(now * 0.55 + b.phase) * 0.06 * (1 - assemble),
        2.1 + b.oz * orbit
      );
      dummy.rotation.set(b.rx + now * b.vr * (1 - assemble), b.ry + now * 0.4 * (1 - assemble), 0);
      const sc = b.s * appear * (1 - assemble * 0.7);
      dummy.scale.setScalar(Math.max(0.001, sc));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mat.opacity = 1;
    mat.transparent = assemble > 0.4;
    mat.opacity = 1 - assemble * 0.55;
  }
  return { mesh, update };
}

function createTitleRig() {
  const group = new THREE.Group();
  group.position.set(0, 0.42, 6.35);

  const letters = ["L", "E", "G", "O"];
  const cells = [];
  letters.forEach((ch, i) => {
    const brick = makeStuddedBrick(1.05, 1.05, 1.05, 0x16181e);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.82, 0.82),
      new THREE.MeshBasicMaterial({ map: letterTexture(ch), transparent: true })
    );
    face.position.z = 0.47;
    brick.add(face);
    brick.userData.index = i;
    brick.userData.home = new THREE.Vector3((i - 1.5) * 1.22, 0.82, 0);
    brick.position.copy(brick.userData.home);
    group.add(brick);
    cells.push(brick);
  });

  const word = buildGlyphWord("LEVIATHAN", 0.145, 0.04);
  const voxelGeo = new THREE.BoxGeometry(word.cell * 0.92, word.cell * 0.78, word.cell * 0.7);
  const dark = makeAbsMaterial(0x17191f, 0.44);
  const red = makeAbsMaterial(0x6e1414, 0.4);
  const voxels = [];
  word.voxels.forEach((v, i) => {
    const mesh = new THREE.Mesh(voxelGeo, i % 11 === 0 ? red : dark);
    mesh.userData.home = new THREE.Vector3(v.x, v.y - 0.55, 0.05);
    mesh.position.copy(mesh.userData.home);
    group.add(mesh);
    voxels.push(mesh);
  });

  function update(t, now) {
    const show = smoothstep(0.9, 0.96, t);
    group.visible = show > 0.02;
    if (!group.visible) return;
    group.rotation.y = Math.sin(now * 0.18) * 0.028;
    group.position.y = 0.4 + Math.sin(now * 0.35) * 0.03;
    group.position.z = 6.35;

    cells.forEach((c, i) => {
      const local = smoothstep(0.912 + i * 0.008, 0.954 + i * 0.008, t);
      const scatter = new THREE.Vector3((i - 1.5) * 2.4, 1.6 + (i % 2 ? 0.8 : -0.5), 2.4);
      c.position.lerpVectors(scatter, c.userData.home, local);
      c.rotation.set(
        lerp(0.6, 0.08, local),
        lerp((i - 1.5) * 0.5, 0, local),
        lerp(0.3, 0, local)
      );
      c.scale.setScalar(lerp(0.2, 1, local));
      c.traverse((o) => {
        if (o.material && o.material.opacity !== undefined) {
          o.material.transparent = local < 0.98;
          o.material.opacity = local;
        }
      });
    });

    voxels.forEach((v, i) => {
      const local = smoothstep(0.94 + (i % 12) * 0.002, 0.99, t);
      const scatter = new THREE.Vector3(
        (Math.sin(i * 1.7) ) * 4.2,
        (Math.cos(i * 0.9)) * 2.2,
        1.6 + (i % 5) * 0.2
      );
      v.position.lerpVectors(scatter, v.userData.home, local);
      v.rotation.y = lerp(1.2, 0, local);
      v.scale.setScalar(Math.max(0.001, local));
    });
  }

  return { group, update };
}
