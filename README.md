<div align="center">

<img src="public/favicon.svg" width="72" alt="Lathe logo" />

# Lathe One

**A scroll-driven 3D launch site for a fictional turntable.**

_Built around one moment: the needle finding the groove._

![React](https://img.shields.io/badge/React_19-2a0d10?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_8-2a0d10?style=flat-square&logo=vite&logoColor=FFD62E)
![Three.js](https://img.shields.io/badge/Three.js-2a0d10?style=flat-square&logo=threedotjs&logoColor=ede6da)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-2a0d10?style=flat-square&logo=tailwindcss&logoColor=38BDF8)
![GSAP](https://img.shields.io/badge/GSAP-2a0d10?style=flat-square&logo=greensock&logoColor=88CE02)

</div>

---

## About

**Lathe** is a concept project: an imaginary boutique audio brand launching its first record player, the **Lathe One**. The brand, the product and its specs are all made up.

I built it as a **portfolio piece** to practise real-time 3D, scroll choreography and sound design on the web. The idea: **the page is one side of a record.** As you scroll, the tonearm travels from the outer edge towards the label, so the arm is also the progress bar. Every section is a track, and halfway through you flip the record to side B.

The 3D turntable is made entirely in code from primitives and canvas textures. The site loads no external models, HDRs or audio files.

## Features

- **Pressing preloader:** a record is "cut" while the real loading progress counts up, and the first frame is drawn before any JavaScript arrives.
- **Needle drop intro:** the record floats down onto the platter, the arm swings over and the needle lands.
- **Scroll = RPM:** your scroll speed spins the platter. The strobe dots drift, and the speed readout stretches its letter width (variable `wdth` axis) with the revolutions.
- **Exploded view:** the plinth, damping layer, motor, platter and felt mat separate on scroll.
- **Live finish configurator:** swap between Walnut, Ash and Smoked oak and the 3D model updates in real time.
- **Flip the record:** the signature transition. The record turns over in 3D and the whole page moves from oxblood (side A) to aluminum (side B).
- **Needle navigation:** a tiny turntable in the corner whose arm tracks your progress. Click it to open the track list as a menu.
- **Runout groove footer:** a ring of text locked to the 3D record's screen projection every frame, so it stays centered at any aspect ratio.
- **Generative sound (optional, off by default):** music is "pressed" once in an `OfflineAudioContext`, then played at the platter's speed, so tempo and pitch follow your scroll. Includes crackle, scratch on reverse scroll and a needle-drop thud.
- **Dust in the light beam:** an ambient particle field and light-shaft shaders drift across the page.
- **Custom cursor & magnetic buttons** on pointer devices.
- **Designed 404:** "Not on this pressing". The missing URL is added to the track list as B3, crossed out, running time 4:04.
- **Reduced motion, done properly:** every animation has a calmer `gsap.matchMedia()` version instead of being switched off.

## Performance & Accessibility

- 3D scene lazy-loaded as its own chunk. The initial JS is about 146 KB gzipped.
- Shaders compile in parallel (`gl.compileAsync`). Rendering pauses while the preloader covers the scene.
- Adaptive quality: drei's `PerformanceMonitor` steps the pixel ratio down when the frame rate drops.
- Lighthouse: **99** performance on desktop, **100** for accessibility, best practices and SEO.
- Keyboard navigable, skip link, focus-trapped menu, Playwright + axe tests.

## Tech Stack

| Area          | Tools                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| UI            | [React 19](https://react.dev)                                                                           |
| Build tool    | [Vite 8](https://vite.dev)                                                                              |
| 3D            | [Three.js](https://threejs.org) via [React Three Fiber](https://r3f.docs.pmnd.rs) + [drei](https://drei.docs.pmnd.rs) |
| Styling       | [Tailwind CSS 4](https://tailwindcss.com) (via `@tailwindcss/vite`)                                     |
| Animation     | [GSAP](https://gsap.com): ScrollTrigger, SplitText                                                      |
| React + GSAP  | [`@gsap/react`](https://gsap.com/resources/React) (`useGSAP`)                                           |
| Smooth scroll | [Lenis](https://lenis.darkroom.engineering)                                                             |
| Sound         | Web Audio API                                                                                           |
| Typography    | Bricolage Grotesque & Newsreader via [Fontsource](https://fontsource.org)                               |
| Testing       | [Playwright](https://playwright.dev) + [axe-core](https://github.com/dequelabs/axe-core)                |
| Linting       | ESLint + Prettier                                                                                       |

## Getting Started

**Requirements:** Node.js 20.19+ or 22.12+

```bash
# clone the repo
git clone https://github.com/melihfidandev/lathe.git
cd lathe

# install dependencies
npm install

# start the dev server
npm run dev
```

### Scripts

| Command            | Description                                         |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Start the local dev server                          |
| `npm run build`    | Build for production into `dist/` (incl. `404.html`) |
| `npm run preview`  | Preview the production build                        |
| `npm run lint`     | Run ESLint                                          |
| `npm run format`   | Format with Prettier                                |
| `npm run test:e2e` | Run Playwright + axe tests                          |

## Project Structure

```
lathe/
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── App.jsx            # page composition
│   ├── main.jsx           # entry, routes unknown URLs to the 404
│   ├── animations/        # poses.js (3D choreography) + director.js (scroll → pose)
│   ├── three/             # procedural turntable, canvas textures, dust & light shaders
│   ├── sections/          # A1 Needle drop … B2 Pre-order, Flip, Runout
│   ├── components/        # preloader, cursor, header, needle nav, sound toggle
│   ├── pages/             # NotFound ("Not on this pressing")
│   ├── lib/               # gsap, lenis, Web Audio, shared store
│   ├── hooks/
│   ├── content/           # track list & finishes
│   └── styles/            # Tailwind theme tokens
└── tests/
    └── e2e/               # Playwright + axe
```

## Disclaimer

Lathe is **not a real brand** and the Lathe One is **not a real product**. All names, specs, prices and text on the site are fictional and exist only for demonstration.
