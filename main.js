/* ============================================================================
   MERIDIAN — main.js  (ES module)
   ----------------------------------------------------------------------------
   Three.js is imported by relative path (no CDN, no import map).
   GSAP, ScrollTrigger, SplitText and Lenis are UMD globals loaded by the
   <script defer> tags in index.html and are guaranteed to exist by the time
   this module runs (modules are deferred and execute after classic deferred
   scripts).
============================================================================ */

import * as THREE from "../vendor/three.module.js";

/* ============================================================================
   1. CONFIG  — every adjustable value lives here.
   ----------------------------------------------------------------------------
   SWAPPING IN REAL CONTENT:
     • Copy / stats / testimonials / press → edit index.html directly.
     • Stat count-up targets         → `data-to` / `data-prefix` / `data-suffix`
                                         attributes on each [data-count] span.
     • Images → drop files in /images and point <img src> at them. Every
       visual here is CSS-drawn so there are no broken-image holes by default.
============================================================================ */
const CONFIG = {
  lenis: {
    lerp: 0.09,          // smoothing weight (lower = heavier/smoother). 0.08–0.12 = premium.
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
  },

  ease: {
    enter:  "expo.out",     // section / element entrances
    motion: "power3.out",   // most motion
    state:  "power2.inOut", // state-to-state transitions
    count:  "power2.out",   // stat count-up
  },

  particles: {
    count: 2600,            // desktop particle count
    countMobile: 500,       // mobile particle count
    color: 0x5fc9c2,        // teal
    depth: 1400,            // z spread of the field
    spread: 1600,           // x/y spread
    size: 3.2,              // base point size
    travelPerScroll: 0.00018, // forward-travel of camera per px of scroll
    drift: 0.018,           // idle self-drift speed
    pointerStrength: 70,    // mouse attraction radius influence
  },

  nebula: {
    colorA: [0.10, 0.40, 0.42],  // teal-ish glow (r,g,b 0..1)
    colorB: [0.04, 0.09, 0.17],  // deep navy
    intensity: 0.55,             // overall glow strength
    speed: 0.015,                // shader time speed
  },

  grain: { intensity: 0.045, fps: 24 },   // film-grain opacity + redraw rate

  marquee: {
    baseSpeed: 0.6,         // idle px/frame
    velocityBoost: 0.18,    // how strongly scroll velocity accelerates it
    maxTimeScale: 8,        // clamp on velocity boost
  },

  reveal: { stagger: 0.08, duration: 1.0 },  // generic reveal timing

  count: { duration: 2.0 },                  // stat count-up duration (s)

  gallery: { scrollRatio: 1.1 },             // pin length = trackWidth * ratio

  cursor: {
    dotLag: 0.12,          // tight follower duration
    trailLag: 0.45,        // loose follower duration
  },

  skew: { max: 6, factor: 0.25 },            // velocity skew clamp + sensitivity
};

/* ============================================================================
   2. ENVIRONMENT FLAGS
============================================================================ */
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const IS_TOUCH = window.matchMedia("(hover: none), (pointer: coarse)").matches;
const IS_MOBILE = window.matchMedia("(max-width: 980px)").matches;

if (REDUCED) document.documentElement.classList.add("reduced-motion");

/* GSAP globals */
const { gsap } = window;
const ScrollTrigger = window.ScrollTrigger;
const SplitText = window.SplitText;
gsap.registerPlugin(ScrollTrigger, SplitText);

/* ============================================================================
   3. GLOBAL FAIL-SAFE
   If anything throws before the loader lifts, force-reveal after 3s so the
   page is never stuck behind the loader.
============================================================================ */
let loaderLifted = false;
const FAILSAFE_MS = 6000; // must exceed the loader intro duration (~3s) with margin
const failSafe = setTimeout(() => {
  if (!loaderLifted) {
    const l = document.querySelector("[data-loader]");
    if (l) {
      l.style.transition = "opacity .6s ease"; l.style.opacity = "0";
      setTimeout(() => (l.style.display = "none"), 600);
    }
    document.documentElement.classList.add("failsafe");
  }
}, FAILSAFE_MS);

/* ============================================================================
   4. ICON GLYPHS
   Each .ico / .stat__ico / .gcard__ico has a CSS mask painted from --gly.
   We build tiny stroked SVGs as data-URIs and assign them per data-ico.
============================================================================ */
const ICONS = {
  card:    `<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>`,
  bolt:    `<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>`,
  lock:    `<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  check:   `<path d="M4 12l5 5L20 6"/>`,
  chart:   `<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>`,
  ai:      `<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>`,
  sync:    `<path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 12a9 9 0 0 1 15-6.7L21 8M3 4v4h4M21 20v-4h-4"/>`,
  clock:   `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  search:  `<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>`,
  refresh: `<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 4v4h-4M21 12a9 9 0 0 1-15 6.7L3 16M3 20v-4h4"/>`,
  shield:  `<path d="M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>`,
  box:     `<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>`,
  globe:   `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>`,
  heart:   `<path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"/>`,
  plug:    `<path d="M9 2v6M15 2v6M7 8h10v3a5 5 0 0 1-10 0zM12 16v6"/>`,
  rocket:  `<path d="M5 15c-1 1-2 5-2 5s4-1 5-2M9 11a8 8 0 0 1 8-8c2 0 3 1 3 3a8 8 0 0 1-8 8zM12 9h.01"/>`,
  dollar:  `<path d="M12 2v20M16 6.5C16 5 14.5 4 12 4S8 5 8 7s2 3 4 3.5 4 1.5 4 3.5-1.5 3-4 3-4-1-4-2.5"/>`,
  building:`<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-3h4v3"/>`,
  users:   `<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M17 5.5a3 3 0 0 1 0 5.5M21 20a5.5 5.5 0 0 0-4-5"/>`,
  spark:   `<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>`,
};
function paintIcons() {
  document.querySelectorAll("[data-ico]").forEach((el) => {
    const key = el.getAttribute("data-ico");
    const path = ICONS[key];
    if (!path) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
    // encodeURIComponent escapes quotes/#/<> so the data-URI survives url("…")
    el.style.setProperty("--gly", `url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
  });
}

/* ============================================================================
   5. LENIS  ↔  GSAP TICKER  ↔  ScrollTrigger   — ONE CLOCK, ONE SCROLL
============================================================================ */
let lenis = null;
function initLenis() {
  lenis = new window.Lenis({
    lerp: CONFIG.lenis.lerp,
    wheelMultiplier: CONFIG.lenis.wheelMultiplier,
    touchMultiplier: CONFIG.lenis.touchMultiplier,
    smoothWheel: true,
  });
  window.__lenis = lenis; // exposed for debugging / programmatic scroll

  // (a) ScrollTrigger updates on every Lenis scroll event — single source of truth.
  lenis.on("scroll", ScrollTrigger.update);

  // (b) Drive Lenis from GSAP's ticker so DOM tweens, scroll and (below) WebGL
  //     all advance on the SAME clock. gsap.ticker time is seconds → ms.
  gsap.ticker.add((time) => lenis.raf(time * 1000));

  // (c) Kill GSAP's lag smoothing so nothing desyncs after a frame hitch.
  gsap.ticker.lagSmoothing(0);
}

/* Smooth anchor links through Lenis */
function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeDrawer();
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* ============================================================================
   6. THREE.JS  — particle field + ambient nebula shader.
   Rendered from the SAME gsap.ticker. Wrapped in try/catch with a CSS
   gradient fallback already painted on the <canvas> background.
============================================================================ */
let webgl = null;
function initWebGL() {
  if (REDUCED) return;
  const canvas = document.querySelector("[data-webgl]");
  if (!canvas) return;

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.z = 600;

    /* ---- Ambient nebula: a full-screen quad behind the particles with a slow
            fragment shader (cheap fbm noise) tinted teal→navy. ------------- */
    const nebGeo = new THREE.PlaneGeometry(2, 2);
    const nebMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Vector3(...CONFIG.nebula.colorA) },
        uColorB: { value: new THREE.Vector3(...CONFIG.nebula.colorB) },
        uIntensity: { value: CONFIG.nebula.intensity },
        uAspect: { value: window.innerWidth / window.innerHeight },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime, uIntensity, uAspect;
        uniform vec3 uColorA, uColorB;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){
          vec2 i=floor(p), f=fract(p);
          float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
          vec2 u=f*f*(3.0-2.0*f);
          return mix(a,b,u.x)+ (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
        }
        float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.0; a*=0.5;} return v; }
        void main(){
          vec2 uv = vUv; uv.x *= uAspect;
          float n = fbm(uv*2.4 + vec2(uTime*0.4, -uTime*0.25));
          n += 0.4*fbm(uv*5.0 - uTime*0.15);
          float glow = smoothstep(0.2, 1.0, n) * uIntensity;
          float vig = smoothstep(1.2, 0.2, distance(vUv, vec2(0.5)));
          vec3 col = mix(uColorB, uColorA, glow) * vig;
          gl_FragColor = vec4(col, glow*0.9*vig);
        }
      `,
    });
    const nebula = new THREE.Mesh(nebGeo, nebMat);
    nebula.frustumCulled = false;
    scene.add(nebula);

    /* ---- Particle field: multi-depth teal points with opacity variation. -- */
    const count = IS_MOBILE ? CONFIG.particles.countMobile : CONFIG.particles.count;
    const positions = new Float32Array(count * 3);
    const alphas = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * CONFIG.particles.spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * CONFIG.particles.spread;
      positions[i * 3 + 2] = (Math.random() - 0.5) * CONFIG.particles.depth - 200;
      alphas[i] = Math.random() * 0.6 + 0.25;
      seeds[i] = Math.random() * 6.28;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const c = new THREE.Color(CONFIG.particles.color);
    const ptMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: CONFIG.particles.size * renderer.getPixelRatio() },
        uColor: { value: new THREE.Vector3(c.r, c.g, c.b) },
        uStretch: { value: 1.0 },     // driven by scroll velocity
      },
      vertexShader: `
        attribute float aAlpha; attribute float aSeed;
        uniform float uTime, uSize, uStretch;
        varying float vAlpha;
        void main(){
          vec3 p = position;
          p.x += sin(uTime*0.3 + aSeed)*8.0;     // gentle idle drift
          p.y += cos(uTime*0.24 + aSeed*1.3)*8.0;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * uStretch * (300.0 / -mv.z);  // depth attenuation + velocity stretch
          vAlpha = aAlpha;
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform vec3 uColor; varying float vAlpha;
        void main(){
          float d = distance(gl_PointCoord, vec2(0.5));
          if(d > 0.5) discard;
          float soft = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uColor, soft * vAlpha);
        }
      `,
    });
    const points = new THREE.Points(geo, ptMat);
    scene.add(points);

    /* ---- pointer parallax target ---- */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    if (!IS_TOUCH) {
      window.addEventListener("pointermove", (e) => {
        pointer.tx = (e.clientX / window.innerWidth - 0.5);
        pointer.ty = (e.clientY / window.innerHeight - 0.5);
      });
    }

    /* ---- scroll-velocity → particle stretch (smoothed) ---- */
    let stretchTarget = 1;
    if (lenis) lenis.on("scroll", ({ velocity }) => {
      stretchTarget = 1 + Math.min(Math.abs(velocity) * 0.012, 1.4);
    });

    /* ---- render loop on the SHARED gsap.ticker ---- */
    const clock = new THREE.Clock();
    gsap.ticker.add(() => {
      const t = clock.getElapsedTime();
      nebMat.uniforms.uTime.value = t * (CONFIG.nebula.speed * 60);
      ptMat.uniforms.uTime.value = t;

      // ease stretch toward target, decay target back to idle
      ptMat.uniforms.uStretch.value += (stretchTarget - ptMat.uniforms.uStretch.value) * 0.08;
      stretchTarget += (1 - stretchTarget) * 0.05;

      // camera forward-travel driven by the SAME scroll position
      const sc = lenis ? lenis.scroll : window.scrollY;
      camera.position.z = 600 - sc * (CONFIG.particles.travelPerScroll * 1000);

      // pointer parallax
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      camera.position.x += (pointer.x * CONFIG.particles.pointerStrength - camera.position.x) * 0.05;
      camera.position.y += (-pointer.y * CONFIG.particles.pointerStrength - camera.position.y) * 0.05;
      camera.lookAt(0, 0, camera.position.z - 600);

      points.rotation.z = t * CONFIG.particles.drift * 0.1;

      renderer.render(scene, camera);
    });

    /* ---- resize ---- */
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      nebMat.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
    });

    webgl = { renderer, scene };
  } catch (err) {
    console.warn("WebGL init failed — using CSS gradient fallback.", err);
    // The .webgl canvas already has a navy radial-gradient background in CSS.
  }
}

/* ============================================================================
   7. CUSTOM CURSOR — dot (tight) + trail (loose), via two quickTo pairs.
============================================================================ */
function initCursor() {
  if (REDUCED || IS_TOUCH) return;
  const dot = document.querySelector("[data-cursor-dot]");
  const trail = document.querySelector("[data-cursor-trail]");
  if (!dot || !trail) return;
  document.body.classList.add("has-cursor");

  const dotX = gsap.quickTo(dot, "x", { duration: CONFIG.cursor.dotLag, ease: "power3" });
  const dotY = gsap.quickTo(dot, "y", { duration: CONFIG.cursor.dotLag, ease: "power3" });
  const trX  = gsap.quickTo(trail, "x", { duration: CONFIG.cursor.trailLag, ease: "power3" });
  const trY  = gsap.quickTo(trail, "y", { duration: CONFIG.cursor.trailLag, ease: "power3" });

  window.addEventListener("pointermove", (e) => {
    dotX(e.clientX); dotY(e.clientY); trX(e.clientX); trY(e.clientY);
  });

  const interactive = "a, button, [data-magnetic], [data-magnetic-soft], input, .quote, .tier, .pcard, .gcard";
  document.querySelectorAll(interactive).forEach((el) => {
    el.addEventListener("pointerenter", () => document.body.classList.add("cursor-active"));
    el.addEventListener("pointerleave", () => document.body.classList.remove("cursor-active"));
  });
}

/* ============================================================================
   8. FILM GRAIN — animated noise drawn to a canvas at a low fps.
============================================================================ */
function initGrain() {
  if (REDUCED) return;
  const canvas = document.querySelector("[data-grain]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = 160;
  canvas.width = size; canvas.height = size;
  canvas.style.opacity = CONFIG.grain.intensity;

  let last = 0;
  const interval = 1000 / CONFIG.grain.fps;
  function draw(now) {
    if (now - last >= interval) {
      last = now;
      const img = ctx.createImageData(size, size);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

/* ============================================================================
   9. SCROLL PROGRESS METER — fills L→R, % readout, fades over footer.
============================================================================ */
function initProgress() {
  const bar = document.querySelector("[data-progress-bar]");
  const pct = document.querySelector("[data-progress-pct]");
  const wrap = document.querySelector(".scroll-progress");
  const footer = document.querySelector(".footer");
  if (!bar) return;

  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      gsap.set(bar, { scaleX: self.progress });
      if (pct) pct.textContent = Math.round(self.progress * 100) + "%";
    },
  });
  if (footer && wrap) {
    ScrollTrigger.create({
      trigger: footer, start: "top 80%", end: "top 30%",
      onUpdate: (self) => gsap.set(wrap, { opacity: 1 - self.progress }),
    });
  }
}

/* ============================================================================
   10. NAV — solidify on scroll past hero; burger drawer.
============================================================================ */
function initNav() {
  const nav = document.querySelector("[data-nav]");
  ScrollTrigger.create({
    start: "top -80",
    onUpdate: (self) => nav.classList.toggle("is-solid", self.scroll() > 80),
  });

  const burger = document.querySelector("[data-burger]");
  const drawer = document.querySelector("[data-drawer]");
  if (burger && drawer) {
    burger.addEventListener("click", () => {
      const open = drawer.classList.toggle("is-open");
      drawer.setAttribute("aria-hidden", String(!open));
      if (lenis) (open ? lenis.stop() : lenis.start());
    });
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeDrawer));
  }
}
function closeDrawer() {
  const drawer = document.querySelector("[data-drawer]");
  if (drawer && drawer.classList.contains("is-open")) {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (lenis) lenis.start();
  }
}

/* ============================================================================
   11. HELPER — SplitText masked line reveal.
   On reduced motion we skip splitting and just ensure visibility.
============================================================================ */
function splitReveal(el, { trigger = el, start = "top 85%", scrub = false } = {}) {
  if (REDUCED) { gsap.set(el, { opacity: 1 }); return; }
  const split = new SplitText(el, { type: "lines", mask: "lines", linesClass: "split-line" });
  gsap.from(split.lines, {
    yPercent: 110,
    duration: scrub ? 1 : CONFIG.reveal.duration,
    ease: CONFIG.ease.enter,
    stagger: 0.12,
    scrollTrigger: {
      trigger, start,
      end: scrub ? "top 45%" : undefined,
      scrub: scrub ? true : false,
      toggleActions: scrub ? undefined : "play none none none",
    },
  });
  return split;
}

/* ============================================================================
   12. LOADER → HERO handoff (timeline, not ScrollTrigger).
============================================================================ */
function runLoader() {
  const loader = document.querySelector("[data-loader]");
  const count = document.querySelector("[data-loader-count]");
  const word = document.querySelector(".loader__word");
  const markPath = document.querySelector(".loader__mark-path");

  if (lenis) lenis.stop(); // lock scroll during intro

  const finish = () => {
    loaderLifted = true;
    clearTimeout(failSafe);
    if (lenis) lenis.start();
    animateHeroIn();
  };

  if (REDUCED || !loader) {
    if (loader) loader.style.display = "none";
    finish();
    return;
  }

  const tl = gsap.timeline({ onComplete: finish });
  tl.to(markPath, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" })
    .to(word, { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.4")
    .to({ v: 0 }, {
      v: 100, duration: 1.4, ease: "power1.inOut",
      onUpdate() { if (count) count.textContent = Math.round(this.targets()[0].v); },
    }, "-=0.6")
    .to(loader, { yPercent: -100, duration: 1.0, ease: "expo.inOut" }, "+=0.15")
    .set(loader, { display: "none" });
}

/* ----- hero entrance: SplitText assembly + mock rise ----- */
function animateHeroIn() {
  const title = document.querySelector("[data-hero-title]");
  const eyebrow = document.querySelector("[data-reveal-eyebrow]");
  const sub = document.querySelector("[data-hero-sub]");
  const cta = document.querySelector("[data-hero-cta]");
  const trust = document.querySelector("[data-hero-trust]");
  const mock = document.querySelector("[data-hero-mock]");

  if (REDUCED) {
    gsap.set([title, eyebrow, sub, cta, trust, mock].filter(Boolean), { opacity: 1, clearProps: "transform" });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: CONFIG.ease.enter } });
  if (eyebrow) tl.from(eyebrow, { y: 20, opacity: 0, duration: 0.7 });

  if (title) {
    const split = new SplitText(title, { type: "lines", mask: "lines", linesClass: "split-line" });
    tl.from(split.lines, { yPercent: 115, duration: 1.1, stagger: 0.14 }, "-=0.4");
  }
  tl.from(sub, { y: 24, opacity: 0, duration: 0.9 }, "-=0.7")
    .from(cta, { y: 24, opacity: 0, duration: 0.9 }, "-=0.7")
    .from(trust, { y: 16, opacity: 0, duration: 0.8 }, "-=0.7")
    .from(mock, { y: 60, opacity: 0, duration: 1.3 }, "-=1.0");

  // hero mock parallax drift as you scroll away
  if (mock && !IS_MOBILE) {
    gsap.to(mock, {
      yPercent: -18, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  // scroll cue fades on first scroll
  const cue = document.querySelector("[data-scroll-cue]");
  if (cue) gsap.to(cue, {
    opacity: 0, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "10% top", scrub: true },
  });
}

/* ============================================================================
   13. VELOCITY MARQUEE — base drift + Lenis velocity boost on timeScale.
============================================================================ */
function initMarquee() {
  const track = document.querySelector("[data-marquee]");
  const set = document.querySelector("[data-marquee-set]");
  if (!track || !set) return;

  // Clone the set until it comfortably overflows twice the viewport (seamless).
  let total = set.offsetWidth;
  while (total < window.innerWidth * 2) {
    const clone = set.cloneNode(true);
    track.appendChild(clone);
    total += set.offsetWidth;
  }
  const setWidth = set.offsetWidth;

  if (REDUCED) return; // frozen marquee on reduced motion

  // Continuous wrap loop with modifiers — base speed in px/frame.
  const tl = gsap.to(track, {
    x: `-=${setWidth}`,
    duration: setWidth / (CONFIG.marquee.baseSpeed * 60),
    ease: "none",
    repeat: -1,
    modifiers: { x: (x) => `${parseFloat(x) % setWidth}px` },
  });

  // Map Lenis velocity → temporary timeScale boost, eased back to idle (1).
  const setScale = gsap.quickTo(tl, "timeScale", { duration: 0.6, ease: "power2.out" });
  if (lenis) {
    lenis.on("scroll", ({ velocity }) => {
      const direction = velocity < 0 ? -1 : 1;
      const boost = 1 + Math.min(Math.abs(velocity) * CONFIG.marquee.velocityBoost, CONFIG.marquee.maxTimeScale);
      tl.timeScale(direction * boost);   // immediate punch
      setScale(direction * 1);           // ease back toward idle drift
    });
  }
}

/* ============================================================================
   14. SECTION HEADINGS — masked SplitText reveal, one per element.
============================================================================ */
function initHeadings() {
  document.querySelectorAll("[data-reveal-heading]").forEach((el) => {
    splitReveal(el, { trigger: el, start: "top 88%" });
  });
}

/* ============================================================================
   15. FEATURE SECTIONS — scrubbed icon-row stagger + clip-path plate wipe
       + per-card mouse-parallax depth + ongoing plate parallax.
============================================================================ */
function initFeatures() {
  document.querySelectorAll("[data-feature]").forEach((feature) => {
    const rows = feature.querySelectorAll("[data-row]");
    const plate = feature.querySelector("[data-plate] .plate");

    /* --- benefit rows: scrubbed stagger tied to scroll position --- */
    if (rows.length && !REDUCED) {
      gsap.from(rows, {
        y: 28, opacity: 0, stagger: 0.15, ease: CONFIG.ease.motion,
        scrollTrigger: { trigger: feature, start: "top 70%", end: "center 60%", scrub: true },
      });
      // vary each icon's micro-animation (scale / pulse / quarter-turn / grow)
      rows.forEach((row, i) => {
        const ico = row.querySelector(".ico");
        if (!ico) return;
        const variants = [
          { scale: 0, rotate: -40 },
          { scale: 0.4, opacity: 0 },
          { rotate: 90 },
          { scale: 0, transformOrigin: "bottom" },
        ];
        gsap.from(ico, {
          ...variants[i % variants.length],
          duration: 0.8, ease: "back.out(1.6)",
          scrollTrigger: { trigger: row, start: "top 85%", toggleActions: "play none none none" },
        });
      });
    }

    /* --- plate clip-path wipe reveal, then settle from slight zoom --- */
    if (plate && !REDUCED) {
      gsap.fromTo(plate,
        { clipPath: "inset(0 100% 0 0)", scale: 1.08 },
        { clipPath: "inset(0 0% 0 0)", scale: 1, duration: 1.2, ease: CONFIG.ease.enter,
          scrollTrigger: { trigger: plate, start: "top 82%", toggleActions: "play none none none" } });

      // ongoing gentle parallax drift
      gsap.fromTo(plate, { y: 40 }, {
        y: -40, ease: "none",
        scrollTrigger: { trigger: feature, start: "top bottom", end: "bottom top", scrub: true },
      });

      // mouse-tracked depth tilt within the card bounds
      if (!IS_TOUCH) addPlateTilt(plate);
    }
  });
}

function addPlateTilt(plate) {
  const wrap = plate.parentElement;
  const rotX = gsap.quickTo(plate, "rotationX", { duration: 0.6, ease: "power3" });
  const rotY = gsap.quickTo(plate, "rotationY", { duration: 0.6, ease: "power3" });
  wrap.addEventListener("pointermove", (e) => {
    const r = wrap.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rotY(px * 10); rotX(-py * 10);
  });
  wrap.addEventListener("pointerleave", () => { rotX(0); rotY(0); });
}

/* ============================================================================
   16. STATS COUNT-UP — onEnter counter per stat, with section stagger.
============================================================================ */
function initStats() {
  const section = document.querySelector("[data-stats]");
  if (!section) return;

  const stats = section.querySelectorAll("[data-stat]");
  if (!REDUCED) {
    gsap.from(stats, {
      y: 40, opacity: 0, stagger: CONFIG.reveal.stagger, ease: CONFIG.ease.enter, duration: 1,
      scrollTrigger: { trigger: section, start: "top 75%", toggleActions: "play none none none" },
    });
  }

  section.querySelectorAll("[data-count]").forEach((el) => {
    const to = parseFloat(el.dataset.to);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const decimals = (el.dataset.to.split(".")[1] || "").length;
    const ico = el.closest("[data-stat]").querySelector(".stat__ico");

    ScrollTrigger.create({
      trigger: el, start: "top 85%", once: true,
      onEnter: () => {
        if (REDUCED) { el.textContent = prefix + to.toLocaleString() + suffix; return; }
        if (ico) gsap.fromTo(ico, { scale: 0, rotate: -30 },
          { scale: 1, rotate: 0, duration: 0.7, ease: "back.out(1.8)" });
        gsap.fromTo({ v: 0 }, { v: 0 }, {
          v: to, duration: CONFIG.count.duration, ease: CONFIG.ease.count,
          onUpdate() {
            const val = this.targets()[0].v;
            el.textContent = prefix + val.toLocaleString(undefined, {
              minimumFractionDigits: decimals, maximumFractionDigits: decimals,
            }) + suffix;
          },
        });
      },
    });
  });
}

/* ============================================================================
   17. PINNED PLATFORM OVERVIEW — pin + scrub step-through of 4 states.
============================================================================ */
function initOverview() {
  const section = document.querySelector("[data-overview]");
  const pin = document.querySelector("[data-overview-pin]");
  if (!section || !pin || IS_MOBILE || REDUCED) {
    document.querySelectorAll("[data-ov-panel]")[0]?.classList.add("is-active");
    document.querySelectorAll("[data-ov-step]")[0]?.classList.add("is-active");
    return;
  }

  const steps = gsap.utils.toArray("[data-ov-step]");
  const panels = gsap.utils.toArray("[data-ov-panel]");
  const progress = document.querySelector("[data-ov-progress]");
  const n = steps.length;

  const setActive = (idx) => {
    steps.forEach((s, i) => s.classList.toggle("is-active", i === idx));
    panels.forEach((p, i) => p.classList.toggle("is-active", i === idx));
  };
  setActive(0);

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => "+=" + window.innerHeight * n,  // one viewport of scroll per step
    pin: pin,
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const idx = Math.min(n - 1, Math.floor(self.progress * n));
      setActive(idx);
      if (progress) gsap.set(progress, { width: self.progress * 100 + "%" });
    },
  });
}

/* ============================================================================
   18. TESTIMONIALS — each card revealed individually, scrubbed to scroll.
============================================================================ */
function initQuotes() {
  const cards = gsap.utils.toArray("[data-quote]");
  if (REDUCED) { gsap.set(cards, { opacity: 1 }); return; }
  cards.forEach((card) => {
    gsap.fromTo(card,
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, ease: "none",
        scrollTrigger: { trigger: card, start: "top 92%", end: "top 58%", scrub: true } });
  });
}

/* ============================================================================
   19. HORIZONTAL GALLERY — pin + scrub, vertical scroll pans track sideways.
============================================================================ */
function initGallery() {
  const section = document.querySelector("[data-gallery]");
  const pin = document.querySelector("[data-gallery-pin]");
  const track = document.querySelector("[data-gallery-track]");
  if (!section || !track || IS_MOBILE || REDUCED) return; // vertical stack via CSS on mobile

  const getScroll = () =>
    track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(track).paddingLeft);

  const tween = gsap.to(track, {
    x: () => -getScroll(),
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => "+=" + getScroll() * CONFIG.gallery.scrollRatio,
      pin: pin,
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  // cards ease in as they cross the viewport, using the horizontal tween as driver
  gsap.utils.toArray("[data-gcard]").forEach((card) => {
    gsap.from(card, {
      opacity: 0, y: 40, duration: 1, ease: CONFIG.ease.motion,
      scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 85%", toggleActions: "play none none none" },
    });
  });
}

/* ============================================================================
   20. PRICING + PRESS — staggered scroll entrances.
============================================================================ */
function initStaggerGrids() {
  if (REDUCED) return;
  const tiers = gsap.utils.toArray("[data-tier]");
  if (tiers.length) gsap.from(tiers, {
    y: 50, opacity: 0, stagger: CONFIG.reveal.stagger, duration: 1, ease: CONFIG.ease.enter,
    scrollTrigger: { trigger: ".pricing__grid", start: "top 80%", toggleActions: "play none none none" },
  });

  const pcards = gsap.utils.toArray("[data-pcard]");
  if (pcards.length) gsap.from(pcards, {
    y: 40, opacity: 0, stagger: CONFIG.reveal.stagger, duration: 0.9, ease: CONFIG.ease.enter,
    scrollTrigger: { trigger: ".press__grid", start: "top 82%", toggleActions: "play none none none" },
  });
}

/* ============================================================================
   21. FINAL CTA — heading reveal (magnetic button handled globally).
============================================================================ */
function initCTA() {
  const title = document.querySelector("[data-cta-title]");
  if (title) splitReveal(title, { trigger: title, start: "top 80%" });
}

/* ============================================================================
   22. MAGNETIC BUTTONS — gently pulled toward cursor. Disabled on touch.
============================================================================ */
function initMagnetic() {
  if (IS_TOUCH || REDUCED) return;
  document.querySelectorAll("[data-magnetic], [data-magnetic-soft]").forEach((el) => {
    const strength = el.hasAttribute("data-magnetic-soft") ? 0.25 : 0.5;
    const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * strength);
      y((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener("pointerleave", () => { x(0); y(0); });
  });
}

/* ============================================================================
   23. SCROLL-VELOCITY SKEW — images/plates lean into fast scroll.
============================================================================ */
function initSkew() {
  if (REDUCED) return;
  const targets = gsap.utils.toArray("[data-plate] .plate, [data-gcard], [data-pcard]");
  if (!targets.length) return;
  const setSkew = targets.map((t) => gsap.quickTo(t, "skewY", { duration: 0.5, ease: "power3" }));
  const clamp = gsap.utils.clamp(-CONFIG.skew.max, CONFIG.skew.max);
  ScrollTrigger.create({
    onUpdate: (self) => {
      const s = clamp(self.getVelocity() / 1000 * CONFIG.skew.factor * -1);
      setSkew.forEach((fn) => fn(s));
    },
  });
}

/* ============================================================================
   24. BOOTSTRAP
============================================================================ */
function init() {
  paintIcons();
  if (!REDUCED) initLenis();
  initAnchors();
  initWebGL();
  initCursor();
  initGrain();
  initProgress();
  initNav();

  // Non-text choreography can be wired immediately.
  initFeatures();
  initStats();
  initOverview();
  initQuotes();
  initGallery();
  initStaggerGrids();
  initMagnetic();
  initSkew();
  initMarquee();

  // SplitText needs final font metrics, so build line reveals only once fonts
  // are ready (avoids "SplitText called before fonts loaded" + wrong wraps).
  const buildTextReveals = () => {
    initHeadings();   // every [data-reveal-heading]
    initCTA();        // final CTA headline
    ScrollTrigger.refresh();
  };
  if (document.fonts && document.fonts.load) {
    // Force the faces to actually load (they load lazily on first use, so
    // fonts.ready alone can resolve before they're requested), THEN split.
    Promise.all([
      document.fonts.load('700 1rem "Syne"'),
      document.fonts.load('400 1rem "Inter"'),
      document.fonts.load('400 1rem "JetBrains Mono"'),
    ]).then(() => document.fonts.ready).then(buildTextReveals).catch(buildTextReveals);
  } else {
    buildTextReveals();
  }
  window.addEventListener("load", () => ScrollTrigger.refresh());

  // run intro last so hero animation kicks off cleanly
  runLoader();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
