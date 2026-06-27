# Meridian — Medical Fintech Landing (concept)

A cinematic, awwwards-style single-page concept for a fictional medical-fintech
brand, **Meridian** — *"The operating system for modern medical practice."*

Built with **Lenis** (smooth scroll), **GSAP + ScrollTrigger + SplitText**
(all scroll choreography), and **Three.js** (WebGL particle field + ambient
nebula). Everything is **vendored locally — the site runs fully offline.**

---

## How to run

ES modules require a static server (`file://` will **not** work — the browser
blocks module imports over the file protocol).

Pick any one of these from inside the `meridian/` folder:

```bash
# Python 3 (no install needed on macOS)
python3 -m http.server 8000

# Node
npx serve .

# PHP
php -S localhost:8000
```

Then open **http://localhost:8000** in a modern browser.

> The repo also ships a `.claude/launch.json` so the Claude Code preview panel
> can serve it directly.

### Confirming it runs offline

After the first load, disconnect from the network and reload — it will work
unchanged. All libraries and fonts are vendored under `vendor/` and `fonts/`;
there are **no CDN links, no import maps, and no external requests** at runtime
(verify with the browser Network tab: every request is same-origin).

---

## Project structure

```
meridian/
├── index.html          # all markup + section structure
├── css/
│   └── styles.css       # design tokens (:root), layout, components, responsive
├── js/
│   └── main.js          # CONFIG block + all behaviour (see below)
├── vendor/              # vendored libraries (offline)
│   ├── gsap.min.js
│   ├── ScrollTrigger.min.js
│   ├── SplitText.min.js
│   ├── lenis.min.js
│   └── three.module.js  # imported by relative path from main.js
├── fonts/               # Syne (display), Inter (body), JetBrains Mono (eyebrow)
└── images/              # drop real product/avatar/logo assets here
```

---

## The "one clock, one scroll" sync

Lenis, GSAP and the WebGL render loop all advance on the **same** `gsap.ticker`
and share **one** scroll position (see `initLenis()` and `initWebGL()` in
`js/main.js`):

- `gsap.ticker.add(t => lenis.raf(t * 1000))` — Lenis is driven by the ticker
- `lenis.on("scroll", ScrollTrigger.update)` — ScrollTrigger updates from Lenis
- `gsap.ticker.lagSmoothing(0)` — no desync after a frame hitch
- the Three.js camera/particles read `lenis.scroll` inside that same ticker loop

---

## Tuning — the CONFIG block

Open `js/main.js` and edit the single `CONFIG` object at the top. It documents
every adjustable value:

| Group | What it controls |
|-------|------------------|
| `lenis` | scroll lerp/weight, wheel & touch multipliers |
| `ease` | the easing strings used everywhere (`expo.out`, `power3.out`, …) |
| `particles` | count (desktop/mobile), colour, depth/spread, size, forward-travel per scroll, idle drift, pointer strength |
| `nebula` | shader teal/navy colour stops, glow intensity, speed |
| `grain` | film-grain opacity + redraw fps |
| `marquee` | base drift speed, velocity boost, max time-scale |
| `reveal` | generic reveal stagger + duration |
| `count` | stat count-up duration (easing via `ease.count`) |
| `gallery` | horizontal-gallery card size (CSS) + scroll ratio |
| `cursor` | dot size/trail (CSS) + follower lag durations |
| `skew` | velocity-skew clamp + sensitivity |

---

## Swapping in real content

- **Copy / testimonials / press / pricing** → edit `index.html` directly. All
  testimonials carry a real name, title, and practice.
- **Stat count-up targets** → the `data-to`, `data-prefix`, `data-suffix`
  attributes on each `<span data-count>` in the Stats section.
- **Images** → drop files in `images/` and point `<img src>` at them. Every
  visual in this build is CSS-drawn, so there are **no broken-image holes** by
  default; add real imagery incrementally.
- **Brand colours / type** → the `:root` tokens at the top of `css/styles.css`.

---

## Resilience & accessibility

- **`prefers-reduced-motion`** — disables WebGL, the custom cursor, grain, pins,
  parallax, scrub and velocity reactions; reveals become plain and the page is
  fully readable and navigable.
- **WebGL failure** — `initWebGL()` is wrapped in `try/catch`; on failure the
  `.webgl` canvas keeps its CSS navy radial-gradient fallback.
- **JS fail-safe** — if anything throws before the intro loader lifts, a 6s
  timeout force-reveals the page so it can never get stuck behind the loader.
- **No-JS** — every section is laid out and readable with CSS alone.

---

*All data, names, headlines and the brand itself are fictional, created for a
portfolio/concept showcase.*
