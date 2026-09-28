# Kundli / जन्मपत्री App — Project Notes (handoff)

Created: 2026-09-28. Status: **Phase 0 done → start Phase 1.**
First thing to do in a fresh chat: read this file + `docs/kundli-guide.txt`, then begin Phase 1 below.

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
- Token spend can be checked from app logs: `~/.openclaw-autoclaw/logs/autoclaw-compat.log` → `grep "Wallet v2"` → `total_balance` (credits; user calls them "tokens"). Baseline just before Phase 1: **~11.0k** (2026-09-28).
- Verify locally each phase (npm run dev / npm test). User will hand-verify 10 charts vs AstroSage later (`tests/VALIDATION.md`).
- Git: init repo in this folder; commit after each phase. GitHub repo + Pages + DNS are later steps (Cloudflare keys in `~/.openclaw-autoclaw/workspace/.secrets/keys.env`; user needs GitHub account).
- If blocked: choose sensible default, note it, continue (per guide).

## Phase 1 checklist (start here)
- [ ] Scaffold Vite vanilla JS project in this folder (`npm create vite@latest . -- --template vanilla` or manual) + `base: './'`.
- [ ] Structure: `index.html`, `src/{main,astro,geocode,timeutil,charts,i18n}.js`, `src/style.css`, `public/`, `tests/`.
- [ ] `npm i swisseph-wasm`; read its README; make wasm load in browser via vite dev from a RELATIVE path (add to build output correctly).
- [ ] `git init`, `.gitignore`, `README.md`, `LICENSE` (full AGPL-3.0 text).
- [ ] Quick verify: dev server runs; wasm module loads; report Phase 1 done in Hindi + token cost.
