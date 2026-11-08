# NOCTIS — Scrollytelling Experience

A premium, minimal, single-page scrollytelling website for **NOCTIS**, a fictional electric performance automotive brand.

> *"A city in total blackout at night where the car's light is the only light in the world. Quiet, expensive and precise: huge empty space, few words, perfect motion."*

---

## ⚡ Technical Highlights

- **Pure Vanilla Web Architecture**: Plain HTML5, CSS3, and vanilla JavaScript (`index.html`, `styles.css`, `main.js`, `config.js`). Zero frameworks, zero build tools, zero npm packages, zero external runtime libraries.
- **Scroll-Scrubbed `<canvas>` Sequences**:
  - **Hero Section**: 590 seamless scroll-scrubbed WebP frames joining 3 continuous driving clips through the blackout city.
  - **Dismantle Section**: 200 progressive WebP frames deconstructing the vehicle down to its carbon composite monocoque, battery pack, axial-flux motors, and photonic light signature.
  - **Single 60fps rAF Loop**: Smooth lerp interpolation (`current += (target - current) * 0.15`), redrawing only when the rounded frame changes.
  - **Smart Preloading & Fallback**: Preloads initial frames before site reveal; dynamically falls back to nearest loaded frame to eliminate any flicker or missing frames.
  - **Responsive Fitting**: Cover-fit on landscape viewports; contain-fit vertically centered on `--asphalt` (`#07080A`) on portrait viewports so the car is never cropped.
- **Strict Aesthetic Design System**:
  - **Zero Gradients**: No linear, radial, or conic gradients.
  - **Zero Glassmorphism**: No backdrop-filter, no blurs, no frosted translucency.
  - **Zero Drop Shadows or Glows**: Flat solid colors, 1px hairlines, type, and photography.
  - **Typography**: Google Fonts Archivo (variable font with expanded width `wdth 125`), Inter (body), and JetBrains Mono (telemetry HUD).
- **Interactive Lineup Accordion**:
  - 5 models (`GT-E`, `S`, `X`, `R`, `ONE`) in a full-height horizontal accordion.
  - 80ms debounced hover transitions with custom easing `cubic-bezier(0.16, 1, 0.3, 1)`.
  - Shared floor line at 72% height with 6% slide-in entrance.
  - Fully accessible via keyboard arrow keys, ARIA attributes, and vertical stacking on mobile (`< 768px`).
- **Custom Headlight Cursor**:
  - 6px xenon dot inside a 28px 1px stroke ring with lerp 0.18 mouse following.
  - Morphs into a 44×2px horizontal light bar with contextual mono tags (`VIEW`, `RESERVE`, `MENU`, `OPEN`, `CONFIGURE`).
  - Preserved native cursor on touch screens and under `prefers-reduced-motion`.
- **Global Film Grain**:
  - Dynamic 8fps shifted noise tile on an offscreen canvas at 3.5% opacity.

---

## 🚀 Running Locally

You can run this project using any static web server:

```bash
# Python
python -m http.server 8000

# VS Code Live Server
# Right-click index.html -> "Open with Live Server"
```

Then navigate to `http://localhost:8000`.

---

## 📁 Repository Structure

```
.
├── assets/
│   ├── cars/                   # Lineup studio WebP profiles (1600x900)
│   └── frames/
│       ├── hero/               # 590 desktop WebP frames (1600px, Q78)
│       ├── hero-mobile/        # 590 mobile WebP frames (960px, Q72)
│       ├── dismantle/          # 200 desktop WebP frames (1600px, Q78)
│       └── dismantle-mobile/   # 200 mobile WebP frames (960px, Q72)
├── config.js                   # Scrollytelling thresholds, coordinates & specs
├── index.html                  # Semantic single-page markup
├── main.js                     # 60fps canvas engine & interactions
└── styles.css                  # Strict design tokens & layout
```

---

*© 2026 NOCTIS. Fictional automotive brand. All rights reserved.*
