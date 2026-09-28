# Kundli / जन्मपत्री App — Project Notes (handoff)

Created: 2026-09-28. Status: **Phase 2 done (2026-09-28) → start Phase 3 (birth-place search via Open-Meteo).**
First thing to do in a fresh chat: read this file + `docs/kundli-guide.txt`, then begin the next phase (Phase 3 per the guide).

## What to build
Static, browser-only Vedic "Kundli / Birth Chart" web app for mybapuji.com.
Authoritative spec + prompt: `docs/kundli-guide.txt` (original: `docs/Kundli_Project_Guide.docx`).
Hard requirements (summary):
- Pure static: Vite vanilla JS, `base: './'`, no backend/DB/API keys. All calculation in visitor's browser.
- Swiss Ephemeris via WASM (npm `swisseph-wasm`, Moshier mode, wasm served locally; read the actual package README/type defs before using its API — guide allows a better maintained equivalent if needed).
- Charts: North Indian + South Indian toggle. Text INSIDE charts: English only (Su Mo Ma Me Ju Ve Sa Ra Ke, Asc; rashi numbers 1–12).
- Everything else bilingual: Hindi (default) + English, with toggle. Full Hindi+English lists: 12 rashis, 9 grahas, 27 nakshatras, all UI strings.
- Ayanamsa: Lahiri; sidereal; whole-sign houses. Rahu: Mean default (True Node option later).
- Birth place: Open-Meteo geocoding (free, no key; search only on button/Enter; manual lat/lon/tz fallback; credit line "Geocoding by Open-Meteo.com").
- Time conversion with historical timezone rules + manual UTC offset override; unit tests (2000 India, 1943 India, US DST, midnight edges).
- Results page: chart + bilingual planet table + header block (ayanamsa value, lagna, birth details), PNG download, print stylesheet.
- Phases 1–13 in guide order; test after each phase; don't skip.
- LICENSE = AGPL-3.0 (Swiss Ephemeris), README + DEPLOY.md, GitHub Actions → GitHub Pages, `public/CNAME` (subdomain to confirm: kundli.mybapuji.com).
- Mobile-first (most users on phones), build < 3 MB, no trackers, bilingual privacy note.

## Working rules (user preferences for this project)
- User = Vasant (non-technical). Talk in SIMPLE HINDI, short updates, no heavy jargon.
- After EVERY phase: report what was done + tokens spent + what's next (and pause for a tiny "आगे बढ़ो" if convenient).
- Token-budget conscious (AutoClaw credits): keep turns lean, batch work, terse command outputs, no unnecessary browsing (spec is fixed).
- Token spend can be checked from app logs: `~/.openclaw-autoclaw/logs/autoclaw-compat.log` → `grep "Wallet v2 response"` → `total=NNNN` (credits; user calls them "tokens"). Baseline just before Phase 3: **~9.6k** (2026-09-28; Phase 2 spent ≈1,070).
- Verify locally each phase (npm run dev / npm test). User will hand-verify 10 charts vs AstroSage later (`tests/VALIDATION.md`).
- Git: init repo in this folder; commit after each phase. GitHub repo + Pages + DNS are later steps (Cloudflare keys in `~/.openclaw-autoclaw/workspace/.secrets/keys.env`; user needs GitHub account).
- If blocked: choose sensible default, note it, continue (per guide).

## Phase 1 checklist (DONE — 2026-09-28, see progress log)
- [x] Scaffold Vite vanilla JS project in this folder (manual scaffold) + `base: './'`.
- [x] Structure: `index.html`, `src/{main,astro,geocode,timeutil,charts,i18n}.js`, `src/style.css`, `public/`, `tests/` (+ `scripts/`).
- [x] `npm i swisseph-wasm` + read its README/llms.txt; wasm loads in browser (dev) and in the build from a relative path (`/wasm/`).
- [x] `git init`, `.gitignore`, `README.md`, `LICENSE` (full AGPL-3.0 text).
- [x] Quick verify: dev server runs; wasm module loads & calculates in browser; report Phase 1 done in Hindi + token cost.

## Progress log

### 2026-09-28 — Phase 1 done
- Stack: Vite 8.3.1 (vanilla), `swisseph-wasm` 0.1.0, Node 25.5.
- Verified in a real browser, both dev server and `npm run preview` (production build): page shows `JD 2451545` and Sun longitude `280.37°` — engine works. (2451545 is the known J2000.0 Julian Day; Sun ≈280.37° is correct.)
- Build size: `dist/` = 2.7 MB total (budget < 3 MB): JS ~83 kB, CSS ~0.5 kB, wasm 562 kB + ephemeris data 2.05 MB (both served from `/wasm/`).
- Gotchas solved (keep for later phases):
  - `optimizeDeps.exclude: ['swisseph-wasm']` in `vite.config.js` — keeps its internal `new URL('../wasm/...')` file resolution working in dev.
  - `scripts/copy-wasm.mjs` copies `swisseph.{wasm,data}` into `public/wasm/` on `predev`/`prebuild` (folder is gitignored).
  - Small Vite plugin in `vite.config.js` drops a dead fallback `.wasm` asset from the bundle (else `dist/` would be ~3.3 MB).
- Git: initialised on `main`; commit `6dcf3fe`. Local git identity: `Vasant / basanthariom@users.noreply.github.com` (placeholder — change if the GitHub account differs).
- ⚠️ Before pushing the repo PUBLIC in Phase 12: decide whether to keep this NOTES.md in the repo (it contains internal workflow notes).
- Next: **Phase 2** — input form (name, gender, date, time, place + validation), orange/saffron responsive UI per guide.

### 2026-09-28 — Phase 2 done
- Input form: name, gender, birth date, birth time (24h, separate hour/minute/second), birth place + Search button (stub until Phase 3), "Get Kundli"; inline bilingual validation; live language toggle (Hindi default ⇄ English) that also re-renders the summary card.
- Month input = **12 tappable chips** (radio group) instead of a dropdown — bigger touch targets on phones and fully automatable for tests.
- Tests: `tests/form.test.js` (vitest + jsdom — 6 tests: render, empty-submit errors, invalid date/time/year, valid-submit summary, toggle both ways). `npm test` = 6/6 pass. Test tooling was brought forward from Phase 4/9 scope because verification needed it; it will keep growing there.
- Browser check (real side-panel browser): empty submit → 4 errors shown; sample filled (राधा शर्मा / 15 मई 1990 / 14:30:00 / Varanasi) → ✅ summary card. Automation notes for future phases: the side-panel bridge cannot drive native `<select>` dropdowns or key events (Tab/arrows) — avoid native selects for new inputs, prefer buttons/chips; also type into ONE field per step (no batched click+type).
- Next: **Phase 3** — Open-Meteo place search (button/Enter only, ≤8 results, manual lat/lon/tz fallback, "Geocoding by Open-Meteo.com" credit).
