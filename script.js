/* ═══════════════════════════════════════════════════
   A LITTLE UNIVERSE FOR WIAM · script.js
   ───────────────────────────────────────────────────
   ▼▼▼  EDIT ZONE — ganti bagian di bawah ini  ▼▼▼
   ═══════════════════════════════════════════════════ */

// ✏️ CHANGE NAME HERE (kalau perlu)
const BIRTHDAY_NAME = "Wiam";

// ✏️ EDIT YOUR LETTER HERE
const LETTER_MESSAGE = `Some people make the world feel softer just by being in it.
You are one of them.

Thank you for every little moment —
the ones we planned, and the ones that simply happened.

I hope this year treats you gently,
and gives you back even a fraction of the warmth
you give to everyone around you.`;

// ✏️ EDIT YOUR PHOTOS HERE — ganti src & caption
const MEMORIES = [
  { src: "assets/photo1.jpg", caption: "one of the little moments worth remembering." },
  { src: "assets/photo2.jpg", caption: "this one still makes me smile." },
  { src: "assets/photo3.jpg", caption: "we looked good that day." },
  { src: "assets/photo4.jpg", caption: "let's make more of these." },
];

// ✏️ CHANGE SECRET MESSAGE HERE
const SECRET_MESSAGE = `Okay...

This one is really just for you.

[SECRET MESSAGE HERE]

No audience. No occasion.
Just the truth:

you matter more than you know. 🤍`;

// ✏️ EDIT FINAL MESSAGE HERE
const FINAL_MESSAGE = `Happy Birthday, Wiam.

I hope this little corner of the internet
made your day a little more special.

Whatever comes next,
I hope there will be many more moments
worth remembering.

Take care,
and enjoy your day. 🤍`;

/* ═══════════════════════════════════════════════════
   ▲▲▲  END OF EDIT ZONE  ▲▲▲
   Di bawah ini mesin websitenya — tidak perlu diubah.
   ═══════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);
const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ══════════════ SOUND ENGINE ══════════════ */

const Sound = (() => {
  let on = false;
  let ctx = null;
  let pad = null;
  const btn = $("audio-toggle");

  function mk(src, vol, loop) {
    const a = new Audio();
    a.preload = "auto";
    a.src = src;
    a.volume = vol;
    a.loop = loop;
    a._ok = false;
    a.addEventListener("canplaythrough", () => { a._ok = true; }, { once: true });
    a.addEventListener("error", () => { a._ok = false; }, { once: true });
    return a;
  }

  const music = mk("assets/music.mp3", 0.3, true);
  const chimeFile = mk("assets/chime.mp3", 0.5, false);
  const candleFile = mk("assets/candle.mp3", 0.85, false);

  function ensureCtx() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === "suspended") ctx.resume();
    } catch (e) { /* audio tidak didukung — web tetap jalan */ }
  }

  function startPad() {
    if (!ctx || pad) return;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(ctx.destination);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = 420;
    f.connect(g);
    const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = 174.61;
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = 261.63;
    const o3 = ctx.createOscillator(); o3.type = "triangle"; o3.frequency.value = 349.23;
    const g3 = ctx.createGain(); g3.gain.value = 0.3; o3.connect(g3); g3.connect(f);
    o1.connect(f); o2.connect(f);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.012;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    [o1, o2, o3, lfo].forEach((o) => o.start());
    g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 3);
    pad = { g, oscs: [o1, o2, o3, lfo] };
  }

  function stopPad() {
    if (!pad) return;
    try { pad.g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1); } catch (e) {}
    const old = pad; pad = null;
    setTimeout(() => old.oscs.forEach((o) => { try { o.stop(); } catch (e) {} }), 1300);
  }

  function blip(freq, dur = 0.6, type = "sine", vol = 0.1) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type; o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function chime(high = false) {
    if (!on) return;
    if (chimeFile._ok) { try { chimeFile.currentTime = 0; chimeFile.play(); } catch (e) {} }
    else {
      ensureCtx();
      blip(high ? 1568 : 1046, 0.7, "sine", 0.08);
      setTimeout(() => blip(high ? 2093 : 1568, 0.9, "sine", 0.05), 90);
    }
  }

  function candleBlow() {
    if (!on) return;
    if (candleFile._ok) { try { candleFile.currentTime = 0; candleFile.play(); } catch (e) {} }
    else if (ctx) {
      const len = Math.floor(ctx.sampleRate * 0.7);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900;
      const g = ctx.createGain(); g.gain.value = 0.35;
      src.connect(f); f.connect(g); g.connect(ctx.destination);
      src.start();
    }
  }

  function fanfare() {
    if (!on || !ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((fq, i) =>
      setTimeout(() => blip(fq, 0.8, "triangle", 0.08), i * 110));
  }

  // kalau music.mp3 baru selesai dimuat setelah suara dinyalakan
  music.addEventListener("canplaythrough", () => {
    if (on) {
      stopPad();
      music.play().catch(() => {});
    }
  });

  function toggle() {
    on = !on;
    btn.textContent = on ? "🔊" : "🔇";
    if (on) {
      ensureCtx();
      if (music._ok) music.play().catch(() => {});
      else startPad();
    } else {
      music.pause();
      stopPad();
    }
  }

  btn.addEventListener("click", toggle);
  return { get on() { return on; }, chime, candleBlow, fanfare, ensureCtx };
})();

/* ══════════════ TYPEWRITER ══════════════ */

function typeWriter(el, text, speed, done) {
  el.textContent = "";
  let i = 0;
  (function step() {
    if (i >= text.length) { if (done) done(); return; }
    const ch = text[i++];
    el.textContent += ch;
    let d = speed;
    if (ch === "\n") d = speed * 5;
    else if (",;".includes(ch)) d = speed * 5;
    else if (".!?".includes(ch)) d = speed * 9;
    setTimeout(step, d);
  })();
}

/* ══════════════ SKY · STARS & DUST ══════════════ */

function buildStars(el, n, minS, maxS) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    s.className = "star";
    const size = minS + Math.random() * (maxS - minS);
    s.style.width = s.style.height = size.toFixed(1) + "px";
    s.style.left = (Math.random() * 100).toFixed(2) + "%";
    s.style.top = (Math.random() * 100).toFixed(2) + "%";
    s.style.setProperty("--o", (0.3 + Math.random() * 0.7).toFixed(2));
    s.style.setProperty("--tw", (1.8 + Math.random() * 2.8).toFixed(2) + "s");
    s.style.setProperty("--twd", (Math.random() * 3).toFixed(2) + "s");
    el.appendChild(s);
  }
}
buildStars($("stars-back"), 90, 1, 2);
buildStars($("stars-front"), 34, 1.5, 3);

(function buildDust() {
  const dust = $("dust");
  for (let i = 0; i < 14; i++) {
    const m = document.createElement("i");
    m.className = "mote";
    m.style.left = (Math.random() * 100).toFixed(1) + "%";
    m.style.top = (20 + Math.random() * 80).toFixed(1) + "%";
    m.style.setProperty("--md", (11 + Math.random() * 9).toFixed(1) + "s");
    m.style.setProperty("--mdel", (Math.random() * 12).toFixed(1) + "s");
    dust.appendChild(m);
  }
})();

/* ══════════════ PARALLAX ══════════════ */

(function parallax() {
  if (RM) return;
  const front = $("stars-front");
  const moonEl = $("moon");
  let px = 0, py = 0, tx = 0, ty = 0;

  function loop() {
    px += (tx - px) * 0.055;
    py += (ty - py) * 0.055;
    front.style.transform = `translate3d(${(px * 15).toFixed(2)}px, ${(py * 10).toFixed(2)}px, 0)`;
    moonEl.style.transform = `translate3d(${(px * 24).toFixed(2)}px, ${(py * 16).toFixed(2)}px, 0)`;
    requestAnimationFrame(loop);
  }

  function fromPoint(cx, cy) {
    tx = (cx / window.innerWidth - 0.5) * 2;
    ty = (cy / window.innerHeight - 0.5) * 2;
  }
  window.addEventListener("pointermove", (e) => fromPoint(e.clientX, e.clientY), { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (e.touches[0]) fromPoint(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null) return;
    tx = Math.max(-1, Math.min(1, e.gamma / 40));
    ty = Math.max(-1, Math.min(1, (e.beta - 45) / 40));
  }, { passive: true });

  requestAnimationFrame(loop);
})();

/* ══════════════ SCENE MANAGER ══════════════ */

let current = "scene-arrival";
let transitioning = false;

function goTo(id) {
  if (transitioning || id === current) return;
  transitioning = true;
  Sound.chime();
  document.body.classList.add("cine");
  setTimeout(() => {
    $(current).classList.remove("active");
    $(id).classList.add("active");
    current = id;
    onEnter(id);
    setTimeout(() => {
      document.body.classList.remove("cine");
      transitioning = false;
    }, 140);
  }, 780);
}

function staggerCalmLines(sceneId, base = 400, gap = 1300) {
  document.querySelectorAll(`#${sceneId} .calm-line`).forEach((el, i) =>
    setTimeout(() => el.classList.add("in"), base + i * gap));
}

/* ══════════════ SCENE 1 · ARRIVAL ══════════════ */

setTimeout(() => $("arr-1").classList.add("in"), 900);
setTimeout(() => $("arr-2").classList.add("in"), 3400);
setTimeout(() => $("enter-btn").classList.add("ready"), 5900);

$("enter-btn").addEventListener("click", () => goTo("scene-universe"));

/* ══════════════ SCENE 2 · THE WANDERING LIGHT ══════════════ */

const wisp = $("wisp");
let wispRAF = null;
let wispDone = false;

function wispStart() {
  if (RM) {
    wisp.style.transform = `translate3d(${window.innerWidth * 0.5 - 11}px, ${window.innerHeight * 0.4 - 11}px, 0)`;
    wisp.classList.add("on");
    return;
  }
  const t0 = performance.now();
  const loop = (now) => {
    const t = (now - t0) / 1000;
    const x = window.innerWidth * (0.5 + 0.31 * Math.sin(t * 0.42));
    const y = window.innerHeight * (0.42 + 0.2 * Math.sin(t * 0.71 + 1.3));
    wisp.style.transform = `translate3d(${(x - 11).toFixed(1)}px, ${(y - 11).toFixed(1)}px, 0)`;
    wispRAF = requestAnimationFrame(loop);
  };
  wispRAF = requestAnimationFrame(loop);
  wisp.classList.add("on");
}

function wispTap(e) {
  if (wispDone) return;
  wispDone = true;
  if (e) e.stopPropagation();
  const r = wisp.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 16);
  Sound.chime(true);
  wisp.classList.add("gone");
  $("universe-hint").textContent = "the light knows the way ✨";
  setTimeout(() => cancelAnimationFrame(wispRAF), 1500); // hentikan loop setelah memudar
  setTimeout(() => goTo("scene-cake"), 1100);
}
wisp.addEventListener("click", wispTap);
wisp.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); wispTap(); }
});

/* ══════════════ FX · CONFETTI / FLASH / BURST ══════════════ */

function confetti(n = 130) {
  const layer = $("confetti-layer");
  const colors = ["#ffd9a0", "#b9c6ff", "#f6c1d9", "#c9f0d8", "#ffffff", "#e8d5ff"];
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i");
    p.className = "confetti-piece";
    const s = 5 + Math.random() * 8;
    p.style.width = s.toFixed(1) + "px";
    p.style.height = (s * (0.5 + Math.random() * 0.9)).toFixed(1) + "px";
    p.style.left = (Math.random() * 100).toFixed(2) + "vw";
    p.style.background = colors[(Math.random() * colors.length) | 0];
    p.style.setProperty("--cf-x", (Math.random() * 26 - 13).toFixed(1) + "vw");
    p.style.setProperty("--cf-r", (360 + ((Math.random() * 720) | 0)) + "deg");
    p.style.setProperty("--cf-dur", (2.6 + Math.random() * 1.8).toFixed(2) + "s");
    p.style.setProperty("--cf-del", (Math.random() * 0.5).toFixed(2) + "s");
    layer.appendChild(p);
    setTimeout(() => p.remove(), 5400);
  }
}

function flash() {
  const f = $("flash");
  f.classList.remove("boom");
  void f.offsetWidth;
  f.classList.add("boom");
}

function burst(x, y, n = 12) {
  for (let i = 0; i < n; i++) {
    const d = document.createElement("i");
    d.className = "burst-dot";
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const dist = 50 + Math.random() * 80;
    d.style.left = x + "px";
    d.style.top = y + "px";
    d.style.setProperty("--bx", (Math.cos(a) * dist).toFixed(0) + "px");
    d.style.setProperty("--by", (Math.sin(a) * dist).toFixed(0) + "px");
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 950);
  }
}

/* ══════════════ SCENE 3 · HOLD TO BLOW ══════════════ */

const cake = $("cake");
const cakeGlow = $("cake-glow");
const ring = $("ring-fg");
const blowBtn = $("blow-btn");
const blowHint = $("blow-hint");
const RING_C = 176;
const HOLD_MS = 1500;

let blowing = false;
let blown = false;
let blowRAF = null;
let blowStart = 0;

function blowTick(now) {
  if (!blowing) return;
  const p = Math.min((now - blowStart) / HOLD_MS, 1);
  ring.style.strokeDashoffset = (RING_C * (1 - p)).toFixed(1);
  cake.classList.toggle("struggling", p > 0.1);
  cakeGlow.style.opacity = (1 - p * 0.65).toFixed(2);
  if (p >= 1) { blowOut(); return; }
  blowRAF = requestAnimationFrame(blowTick);
}

function startBlowing(e) {
  if (e) e.preventDefault();
  if (blown || blowing) return;
  blowing = true;
  blowStart = performance.now();
  blowHint.textContent = "keep holding...";
  blowRAF = requestAnimationFrame(blowTick);
}

function stopBlowing() {
  if (!blowing || blown) return;
  blowing = false;
  cancelAnimationFrame(blowRAF);
  ring.style.strokeDashoffset = RING_C;
  cake.classList.remove("struggling");
  cakeGlow.style.opacity = 1;
  blowHint.textContent = "hold to blow 💨";
}

function blowOut() {
  blown = true;
  blowing = false;
  cancelAnimationFrame(blowRAF);
  ring.style.strokeDashoffset = 0;
  cake.classList.remove("struggling");
  cake.classList.add("blown");
  cakeGlow.style.opacity = 0;
  Sound.candleBlow();
  blowHint.textContent = "make a wish... ✨";
  blowBtn.style.transition = "opacity .6s";
  blowBtn.style.opacity = "0";
  blowBtn.style.pointerEvents = "none";

  setTimeout(() => {
    flash();
    confetti();
    Sound.fanfare();
  }, 900);
  setTimeout(() => goTo("scene-message"), 3400);
}

blowBtn.addEventListener("pointerdown", startBlowing);
blowBtn.addEventListener("pointerup", stopBlowing);
blowBtn.addEventListener("pointercancel", stopBlowing);
blowBtn.addEventListener("pointerleave", stopBlowing);
blowBtn.addEventListener("contextmenu", (e) => e.preventDefault());

/* ══════════════ EASTER EGGS · 3 SYMBOLS ══════════════ */

const foundSymbols = new Set();

function collectSymbol(el) {
  const s = el.dataset.symbol;
  if (foundSymbols.has(s)) return;
  foundSymbols.add(s);
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 14);
  Sound.chime(true);
  el.classList.add("found");
  const dot = document.querySelector(`.hud-dot[data-symbol="${s}"]`);
  if (dot) dot.classList.add("lit");
  if (foundSymbols.size === 3) unlockOrb();
}

function unlockOrb() {
  const door = $("door-secret");
  door.classList.remove("locked");
  door.classList.add("unlocked");
  $("orb-lock").textContent = "the seal is broken ✦";
}

document.querySelectorAll(".hidden-symbol").forEach((el) => {
  el.addEventListener("click", (e) => { e.stopPropagation(); collectSymbol(el); });
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); collectSymbol(el); }
  });
});

/* ══════════════ SCENE 5 · DOORS ══════════════ */

$("door-letter").addEventListener("click", () => goTo("scene-letter"));
$("door-memory").addEventListener("click", () => goTo("scene-memories"));

$("door-secret").addEventListener("click", function () {
  if (this.classList.contains("locked")) {
    this.classList.remove("deny");
    void this.offsetWidth;
    this.classList.add("deny");
    $("orb-lock").textContent = "sealed — find ☾ ✦ ♡";
    return;
  }
  goTo("scene-hidden");
});

$("to-doors").addEventListener("click", () => goTo("scene-doors"));

/* ══════════════ SCENE 6 · LETTER ══════════════ */

const envelope = $("envelope");
let letterOpened = false;

envelope.addEventListener("click", () => {
  if (letterOpened) return;
  letterOpened = true;
  envelope.classList.add("open");
  Sound.chime();
  $("letter-hint").textContent = "read slowly ✦";
  setTimeout(() => typeWriter($("letter-text"), LETTER_MESSAGE, 26), 1200);
});
envelope.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); envelope.click(); }
});
$("letter-back").addEventListener("click", () => goTo("scene-doors"));

/* ══════════════ SCENE 7 · MEMORIES ══════════════ */

function makePhoto(m) {
  const img = document.createElement("img");
  img.src = m.src;
  img.alt = m.caption;
  img.addEventListener("error", () => {
    const fb = document.createElement("div");
    fb.className = "photo-fallback";
    fb.textContent = "✦";
    img.replaceWith(fb);
  }, { once: true });
  return img;
}

(function buildPolaroids() {
  const sea = $("polaroid-sea");
  MEMORIES.forEach((m) => {
    const fig = document.createElement("figure");
    fig.className = "polaroid";
    const cap = document.createElement("figcaption");
    cap.textContent = m.caption;
    fig.append(makePhoto(m), cap);
    fig.addEventListener("click", () => openLightbox(m));
    sea.appendChild(fig);
  });
})();

function openLightbox(m) {
  const lb = $("lightbox");
  const fig = lb.querySelector("figure");
  fig.innerHTML = "";
  const cap = document.createElement("figcaption");
  cap.textContent = m.caption;
  fig.append(makePhoto(m), cap);
  lb.hidden = false;
  Sound.chime();
}

$("lightbox-close").addEventListener("click", () => { $("lightbox").hidden = true; });
$("lightbox").addEventListener("click", (e) => {
  if (e.target === $("lightbox")) $("lightbox").hidden = true;
});
$("memories-back").addEventListener("click", () => goTo("scene-doors"));

/* ══════════════ SCENE 8 · HIDDEN ONE ══════════════ */

$("to-secret").addEventListener("click", () => goTo("scene-secret"));
$("hidden-back").addEventListener("click", () => goTo("scene-doors"));

/* ══════════════ SCENE 9 · SECRET ROOM ══════════════ */

const secretBox = $("secret-box");
let secretOpened = false;

secretBox.addEventListener("click", () => {
  if (secretOpened) return;
  secretOpened = true;
  secretBox.classList.add("open");
  Sound.chime();
  setTimeout(() => {
    typeWriter($("secret-message"), SECRET_MESSAGE, 30, () => {
      $("to-final").hidden = false;
    });
  }, 900);
});

$("to-final").addEventListener("click", () => goTo("scene-final"));

/* ══════════════ SCENE 10 · FINAL ══════════════ */

function runFinal() {
  setTimeout(() => $("fin-1").classList.add("in"), 500);
  setTimeout(() => $("fin-2").classList.add("in"), 2500);
  setTimeout(() => {
    typeWriter($("final-text"), FINAL_MESSAGE, 34, () => {
      $("final-sign").classList.add("show");
      setTimeout(() => goTo("scene-outro"), 4800);
    });
  }, 4100);
}

/* ══════════════ OUTRO ══════════════ */

function runOutro() {
  document.body.classList.add("outro");
  setTimeout(() => $("shooting-star").classList.add("go"), 900);
  setTimeout(() => $("outro-text").classList.add("in"), 1800);
  setTimeout(() => { $("replay-btn").hidden = false; }, 6400);
}

$("replay-btn").addEventListener("click", () => location.reload());

/* ══════════════ ON ENTER HOOKS ══════════════ */

function onEnter(id) {
  switch (id) {
    case "scene-universe":
      wispStart();
      break;
    case "scene-message":
      staggerCalmLines(id, 500, 1500);
      break;
    case "scene-memories":
      document.querySelectorAll(".polaroid").forEach((p, i) =>
        setTimeout(() => p.classList.add("shown"), 350 + i * 420));
      break;
    case "scene-hidden":
      staggerCalmLines(id, 500, 1500);
      break;
    case "scene-secret":
      setTimeout(() => $("secret-line").classList.add("in"), 600);
      break;
    case "scene-final":
      runFinal();
      break;
    case "scene-outro":
      runOutro();
      break;
  }
}
