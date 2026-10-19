# GitHub Pages White Screen Resolution & Automated Deployment

Fix the complete white screen issue on the deployed GitHub Pages site (`https://ahsan3944.github.io/prayer-clock-salah-companion/`) by providing the production GitHub Actions build-and-deploy workflow, SPA 404 fallback routing, and verifying Vite build artifact consistency.

## User Review & Critical Decisions

> [!IMPORTANT]
> The verified root cause is that GitHub Pages was serving raw repository root files (including unbundled `<script type="module" src="/src/main.tsx"></script>`) rather than the compiled `dist/` production assets. Modern browsers cannot directly execute raw TypeScript `.tsx` files, resulting in an unmounted DOM and a completely white screen.

- **Confirmed Decision 1**: Automated GitHub Actions workflow configured under `.github/workflows/deploy.yml` that checks out the repo, sets up Node.js, runs `npm ci` and `npm run build`, and deploys the generated `dist/` directory to GitHub Pages.
- **Confirmed Decision 2**: Include a lightweight `404.html` SPA redirect helper in `public/` to prevent HTTP 404 on deep links or manual browser refreshes on GitHub Pages.

---

## 1. Overview & Core Concept

- **What It Does**: Establishes a seamless, production-grade GitHub Pages deployment pipeline. When changes are pushed to `main`, GitHub Actions automatically compiles the Vite bundle, maps all asset paths to the `/prayer-clock-salah-companion/` subpath, and publishes the compiled static assets (`dist/`) directly to the official GitHub Pages CDN.
- **Target Audience**: Users accessing the live companion web app via GitHub Pages across desktop and mobile devices.
- **Key Value**: Guarantees zero white-screen crashes, instantaneous bundle loading, correct CSS/font/icon rendering, and offline PWA capability under GitHub's subpath URL structure.

---

## 2. User Experience & Visual Design

- **Zero UI Disruption**: The application's existing visual design (modern Islamic luxury aesthetic, gold/emerald accents, typography, digital clock, prayer timetables, Bukhari Hadith reader, and Tasbih counter) remains completely intact.
- **Loading & First Paint**: Eliminates failed network requests (`404` on `/assets/...` or `/src/main.tsx`), enabling immediate rendering of the initial layout, prayer schedule, and digital clock.
- **SPA Refresh Handling**: With `404.html` fallback in `public/`, any page refresh or direct navigation gracefully retains state and redirects to the base repository path without showing GitHub's default 404 error page.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Official GitHub Actions `actions/deploy-pages` vs. Branch-Based `gh-pages`**
  - *Chosen Approach*: Official GitHub Actions workflow (`deploy.yml`) utilizing `actions/upload-pages-artifact` and `actions/deploy-pages`.
  - *Why*: Eliminates the need for a separate `gh-pages` branch, reduces repository clutter, guarantees reproducible builds in a clean CI environment, and prevents accidental commits of build artifacts to git history.
  - *Alternatives Considered*: Manual `gh-pages` branch pushes (prone to branch sync mismatches and human error).

- **Decision 2: 404 Fallback Strategy for GitHub Pages**
  - *Chosen Approach*: Place `public/404.html` with a lightweight SPA redirect script that encodes the requested path and replaces it on the primary `index.html`.
  - *Why*: GitHub Pages natively serves `404.html` for any path not found on disk, enabling seamless single-page application hydration.
  - *Alternatives Considered*: Hash-based routing (changes existing URL schema).

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│            GitHub Repository (Ahsan3944)               │
│                  Branch: main                          │
└──────────────────────────┬─────────────────────────────┘
                           │ git push
                           ▼
┌────────────────────────────────────────────────────────┐
│        GitHub Actions (.github/workflows/deploy.yml)   │
│  1. actions/checkout@v4                                │
│  2. actions/setup-node@v4 (Node 20)                    │
│  3. npm ci                                             │
│  4. npm run build (Vite base: /.../)                   │
│  5. actions/upload-pages-artifact@v3 (path: dist/)     │
│  6. actions/deploy-pages@v4                            │
└──────────────────────────┬─────────────────────────────┘
                           │ deploys
                           ▼
┌────────────────────────────────────────────────────────┐
│            GitHub Pages CDN (ahsan3944.github.io)      │
│  /prayer-clock-salah-companion/                        │
│    ├── index.html (references /prayer-clock-.../assets)│
│    ├── assets/ (compiled JS and CSS chunks)            │
│    ├── icon.svg                                        │
│    ├── manifest.json                                   │
│    └── 404.html (SPA redirect fallback)                │
└────────────────────────────────────────────────────────┘
```

### Action Items Upon Approval:
1. Create `.github/workflows/deploy.yml` with proper permissions (`contents: read`, `pages: write`, `id-token: write`), Node 20 setup, dependency install, Vite build, and Pages deployment.
2. Create `public/404.html` to support SPA routing fallback on GitHub Pages.
3. Validate build output (`npm run build`) and verify compilation (`compile_applet`).
4. Provide simple step-by-step instructions for the user to commit the changes and enable GitHub Actions in the GitHub repository's Pages settings.
