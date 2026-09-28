# Kundli / जन्मपत्री App — Project Notes (handoff)

Created: 2026-09-28. Status: **Phase 6 done (2026-09-28) → start Phase 7 (SVG charts — North Indian diamond + South Indian 4×4, English-only inside, toggle).**
First thing to do in a fresh chat: read this file + `docs/kundli-guide.txt`, then begin the next phase (Phase 7 per the guide).

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
- Token spend can be checked from app logs: `~/.openclaw-autoclaw/logs/autoclaw-compat.log` → `grep "Wallet v2 response"` → `total=NNNN` (credits; user calls them "tokens"). Baseline just before Phase 7: **~7.8k** (2026-09-28; Phase 6 spent ≈420).
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

### 2026-09-28 — Phase 3 done
- Place search: `src/geocode.js` calls Open-Meteo geocoding (`count=8&language=en`), only on Search button / Enter (small cooldown between identical searches); results appear as a clickable list "Name, State, Country"; picking one shows "✔ चुना गया …" with lat/lon + timezone, and the summary uses it.
- Manual fallback: collapsible `<details>` with latitude, longitude, time zone (IANA name or UTC offset `+05:30`), validated; auto-opens itself when it has an error. Credit line "Geocoding by Open-Meteo.com" added. Bilingual messages for: empty query, not found, network failure, searching….
- Tests grew to **16/16 passing** (+4 geocode unit tests; +6 form tests: results render, pick, submit-with-pick, friendly messages, manual validation, edit-clears-pick).
- Browser check (real network): searched "Varanasi" → 6+ real results; picked first → "✔ चुना गया: Varanasi, Uttar Pradesh, India · 25.31668, 83.01041 · Asia/Kolkata". (Note: after the results list expands, the submit button is below the fold and the side-panel bridge can't scroll — submit-with-pick is covered by the tests instead.)
- Next: **Phase 4** — local birth time → UTC with historical timezone rules + manual UTC-offset override + unit tests (2000 India, 1943 India, US DST, midnight edges), then Julian Day via Swiss Ephemeris.

### 2026-09-28 — Phase 4 done
- `src/timeutil.js`: local birth time → UTC via the system timezone database (`Intl.DateTimeFormat`, historical rules included); fixed-offset zones ("+05:30"); offset parsing/formatting; IANA validation; `toJulianDay(utc, julday)` wrapper for Swiss Ephemeris.
- Form: new optional **"UTC ऑफ़सेट (वैकल्पिक)"** field under birth time (validated); the summary now shows **समय क्षेत्र (offset used)** and **UTC समय** rows.
- Tests: +9 timeutil (2000 India; **1943 India wartime +06:30**; US DST summer/winter; midnight edges; offset parsing; IANA validation) and +3 form tests (override wins; bad offset rejected; 1943 historical case in the summary). **28/28 passing** — including a Julian Day check against the real Swiss Ephemeris WASM in Node (J2000 = 2451545.0 exactly).
- Note: full in-app Julian Day display comes with Phase 5 (that's when the WASM engine gets initialized at submit time).
- Next: **Phase 5** — `src/astro.js`: sidereal Lahiri; Sun–Saturn + mean Rahu + Ketu; Ascendant & whole-sign houses; per-planet rashi/degree/nakshatra/pada/retro/house/rashi-lord from one data object.

### 2026-09-28 — Phase 5 done
- `src/astro.js`: Lahiri sidereal mode; Sun–Saturn + Rahu (mean default, True Node option) + Ketu = Rahu+180°; Ascendant + whole-sign houses via `houses_ex(…, 'W')`; per body: rashi (0-11), degInSign, nakshatra (1-27), pada (1-4), retro, house, rashiLord — one clean data object for both charts later.
- App: submit loads the WASM engine on first use and computes the chart in the background; the summary now shows **लग्न, अयनांश (लाहिरी) and a compact planet list**. Polar-latitude guard returns a friendly error.
- Tests: **40/40 passing** (+11 astro tests with real WASM in Node; +1 form test with mocked engine). Verified: lagna Kanya 7°02′, ayanamsa 23°43′ (1990), Sun 0°33′ Vrishabha, retro Me/Sa/Ra/Ke, True-vs-Mean node, sign/nakshatra boundary edges, tropical−sidereal = ayanamsa.
- Real-browser end-to-end ✓: searched & picked Varanasi (real Open-Meteo), submitted → browser loaded the WASM and the summary matched the Node reference exactly (लग्न राशि 6 · 7°02′; Su राशि 2 · 0°33′ · भाव 9; Sa वक्री; etc.).
- ⚠️ Side-panel automation learnings (for future browser checks): fragment-navigate (`#get-btn`) = full RELOAD → wipes form state (never use between filling and submitting); after results expand, click an inert area then press “End” to scroll to the bottom (that's how submit was reached!); click+type = one pair per message; snapshot often; elementId clicks OK for visible elements.
- Next: **Phase 6** — full bilingual data lists (12 rashis, 9 grahas, 27 nakshatras, Hindi+English), all UI strings, self-hosted Noto Sans Devanagari font.

### 2026-09-28 — Phase 6 done
- `src/i18n.js`: full bilingual lists — 12 rashis (मेष…मीन), 9 grahas (with Su/Mo/… chart abbreviations), all 27 nakshatras (अश्विनी…रेवती); helpers `rashiLabel()` / `grahaLabel()` / `nakshatraLabel()` produce the “हिंदी / English” side-by-side format.
- Summary mini-list now uses the bilingual names (e.g. “सूर्य / Sun · वृषभ / Taurus · 0°33′ · भाव 9 · वक्री”; lagna “कन्या / Virgo · 7°02′”).
- Font: **Noto Sans Devanagari self-hosted** — 2 woff2 subsets in `public/fonts/` (devanagari 118 KB + latin 25 KB; variable font → single `@font-face` with weight range 400–600), generated by `scripts/fetch-fonts.mjs` into `src/fonts.css`; family stack starts with ‘Noto Sans Devanagari’ + system fallbacks. Build rewrites refs to `../fonts/…` (subpath-safe). No Google Fonts requests at runtime.
- Tests: **43/43 passing** (+3 i18n list tests). Live check: dev serves the font (200 font/woff2) and the page re-rendered with changed text metrics (font applied).
- Next: **Phase 7** — draw the two SVG charts (North Indian diamond / South Indian 4×4, English-only labels inside: Su Mo Ma Me Ju Ve Sa Ra Ke + Asc + rashi numbers) + toggle without recalculation.
