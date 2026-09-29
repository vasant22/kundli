# Kundli / जन्मपत्री App — Project Notes (handoff)

Created: 2026-09-28. Status: **Main app COMPLETE; “Kundli Matching” (Ashtakoot Guna Milan) COMPLETE — Phases 1–8 done 2026-09-29, live at https://kundli.mybapuji.com/match/** (same repo; nav link added on the main page). **Third project “Panchang” — COMPLETE (Phases 1–11, 2026-09-29) — live at https://kundli.mybapuji.com/panchang/ and /panchang-widget/; 362 tests.** User-side remainders: Panchang hand-checks (tests/PANCHANG_VALIDATION.md), WordPress embed, plus the older 10-chart AstroSage validation (tests/VALIDATION.md), matching hand-checks (tests/MATCH_VALIDATION.md), mybapuji.com link, device checks.
First thing to do in a fresh chat: read this file + `docs/kundli-matching-guide.txt` (current task spec; `docs/kundli-guide.txt` = spec of the completed main app, reference only). Old HTTPS-cert notes below are resolved — no action needed.

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
- Token spend can be checked from app logs: `~/.openclaw-autoclaw/logs/autoclaw-compat.log` → `grep "Wallet v2 response"` → `total=NNNN` (credits; user calls them "tokens"). Baseline just before Phase 12: **~5.1k** (2026-09-28; Phase 11 spent ≈100).
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

### 2026-09-28 — Phase 7 done
- `src/charts.js`: SVG builders — `buildNorthChart(kundli)` (fixed houses 1-12 anti-clockwise, precomputed centre table, auto-shrink for many planets, "Asc" in house 1) and `buildSouthChart(kundli, meta)` (fixed 4×4 rashi grid, lagna corner-diagonal + "Asc", centre box = Name/date/time/place in English). Text inside charts is English only: Su Mo Ma Me Ju Ve Sa Ra Ke + "(R)", rashi numbers, "Asc". Elements carry `data-house` / `data-rashi` for tests.
- App: summary shows the chart with a **उत्तर भारतीय / दक्षिण भारतीय toggle** — switching redraws from the same data object (no recalculation). Responsive viewBox, max 380 px.
- Tests: **50/50 passing** (+6 chart tests; +1 form test: toggle without recalculation).
- Real-browser end-to-end ✓: North chart rendered with every planet in the right house (Mo Sa(R) Ra(R) together in house 5…); toggled to South — planets in correct fixed rashi cells, "Asc" in the Kanya cell, centre box “15 May 1990 / 14:30:00 / Varanasi”.
- Next: **Phase 8** — full results page: bilingual planet table (planet / rashi / degree / nakshatra+pada / house / retro), header block (ayanamsa, lagna, birth details), Download-PNG, Print, Copy details, instant language toggle.

### 2026-09-28 — Phase 8 done
- Results page: full **bilingual planet table** — ग्रह/Planet · राशि · अंश (deg°min′sec″) · नक्षत्र+पद · भाव · वक्री — all 9 grahas + an Ascendant row, values side-by-side “हिंदी / English”. Header block (birth details, coordinates, tz used, ayanamsa, lagna) kept above the chart.
- Actions: **PNG सेव करें** (SVG → canvas → 1080×1080 PNG download), **प्रिंट करें** (print stylesheet hides form/toggle/actions), **विवरण कॉपी करें** (clipboard + “✓” message). Language toggle re-renders headers/labels instantly; values stay bilingual.
- Tests: **53/53 passing** (+3: table contents & degree format `0°32'59"`; header switching; copy flow with mocked clipboard).
- Real-browser end-to-end ✓: table rendered fully; Copy → “✓ कॉपी हो गया”; PNG → a **valid 1080×1080 PNG** landed in ~/Downloads (checked with `file`; saved copy as `~/Downloads/kundli-north.png`). (Side-panel browser saves it with a temp name `.com.zhipuai.autoclaw.*`; normal browsers → `kundli-north.png`. Cosmetic.)
- Next: **Phase 9** — testing & accuracy validation: automated known-chart tests + `tests/VALIDATION.md` (10 births for the user to compare vs AstroSage), + browser/device checks.

### 2026-09-28 — Phase 9 done
- `tests/accuracy.test.js`: **6 known charts** (Varanasi-1990, Kolkata-1943 wartime, Delhi-1975 near-midnight, Nairobi-1980 southern hemisphere, New York-1976 US DST, Chennai-2005) — asserts lagna rashi + all 9 planets' rashis + longitudes (≤ 0.01°) + ayanamsa, vs reference values generated with **pyswisseph 2.10.03** (`scripts/gen-fixtures.py`; same Swiss version as our WASM build — verifies our integration exactly; independent third-party check = the user's manual pass). All pass.
- `tests/VALIDATION.md`: manual checklist — 10 births (different cities/decades/hemispheres, incl. pre-1950 Lahore-1920, near-midnight Delhi-1975); “Our result” column **pre-filled** from our engine; user fills Reference (AstroSage) + Match. Plus browser/device checklist.
- README: new **“Accuracy & known differences”** section (Mean vs True Rahu, Lahiri variants, whole-sign houses).
- Tests total: **59/59 passing**.
- Next: **Phase 10** — performance, privacy & robustness (bundle size, no trackers, graceful errors, accessibility).

### 2026-09-28 — Phase 10 done
- Size: `dist/` = **2.9 MB** total (target < 3 MB): swisseph.data 2.05 MB + wasm 552 KB + JS 119 KB + fonts 156 KB + css/html. Compression-friendly separate files; gzip: data ≈1.93 MB, wasm ≈261 KB, JS ≈35 KB, CSS ≈2 KB.
- Privacy: no analytics/trackers/cookies/external scripts; only network request = user-triggered Open-Meteo search. **Bilingual privacy note added in the footer**; README “Privacy” section added.
- Robustness: engine failure → friendly message + **retry works now** (failed engine promise resets); PNG failure → visible message; copy failure → message; font `display: swap`.
- Accessibility: `aria-live` on results; chart toggle buttons get `aria-pressed`; charts have `role="img"` + `aria-label`; all inputs labelled.
- Tests: **62/62 passing** (+3 form tests: engine-failure & retry, footer privacy, aria-pressed). Real-browser smoke ✓ (footer note renders).
- Next: **Phase 11** — AGPL compliance: footer “Source code” + Swiss Ephemeris credit, README polish (run/build/contribute).

### 2026-09-28 — Phase 11 done
- Footer: **“गणना इंजन: Swiss Ephemeris (Astrodienst AG)”** link (astro.com/swisseph) + **“सोर्स कोड (GitHub)”** link, both `target="_blank" rel="noopener"`, bilingual label. Privacy note above them (Phase 10).
- LICENSE (full AGPL-3.0) ✓ already in repo; README got a **Contributing** section (issues/PRs + local dev commands + link).
- ⚠️ **SOURCE_URL** in `src/main.js` currently points to `https://github.com/basanthariom/kundli` — confirm the GitHub username/repo in Phase 12 and update.
- Tests: **62/62 passing** (footer test extended: href/target/rel + bilingual label). Browser ✓ footer line renders.
- Next: **Phase 12** — deployment: create GitHub repo + Actions + Pages + Cloudflare DNS (needs the user's GitHub account; Cloudflare keys in `.secrets/keys.env`).

### 2026-09-28 — Phase 12 (part 1): deploy scaffolding
- `.github/workflows/deploy.yml`: push to `main` → `npm ci` → `npm test` → `npm run build` → deploy to Pages (`upload-pages-artifact` + `deploy-pages`).
- `public/CNAME` = `kundli.mybapuji.com` (flows into `dist/` on build).
- `DEPLOY.md`: simple Hindi walkthrough (create repo → push → Pages settings → Cloudflare CNAME DNS-only → enforce HTTPS) + checklist.
- Waiting on **user's GitHub username/account** to: create/push the repo, fix `SOURCE_URL` (footer), optionally add the Cloudflare DNS record. Cloudflare keys file has `CF_ACCOUNT`/`CF_EMAIL` (no API token seen — ask if needed).

### 2026-09-28 — Phase 12 (part 2): pushed to GitHub
- GitHub login completed as **vasant22** (token scopes: gist, read:org, repo, **workflow**). ⚠️ NOTE: the “Authorize github” button on the device-consent page did NOT respond to automation; the user's own code entry + click made it work — ask the user for that step if auth is ever needed again.
- `git push -u origin main` ✓ → **https://github.com/vasant22/kundli** (public). Deploy workflow started automatically (run 36443887632). Pages: enabled, build_type=workflow, site URL https://vasant22.github.io/kundli/.
- Tokens ran low (~1.6k) → remaining work TOMORROW when tokens refill: (1) verify the workflow run + https://vasant22.github.io/kundli/ loads; (2) Cloudflare DNS: CNAME `kundli` → `vasant22.github.io`, **DNS-only (grey)**; (3) custom domain `kundli.mybapuji.com` + Enforce HTTPS; (4) verify https; (5) Phase 13 final report. (Cloudflare API token not in .secrets — only CF_ACCOUNT/CF_EMAIL; either user adds the record via dashboard or provides a token.)

### 2026-09-29 — Phase 12 (part 3): DNS + custom domain done; HTTPS pending
- Cloudflare: added CNAME `kundli` → `vasant22.github.io`, **DNS-only (grey)** — user logged into CF in the side panel, agent drove the dashboard. DNS resolves on public resolvers ✓ (local Mac/panel cache lagged a few minutes — normal).
- GitHub Pages: custom domain `kundli.mybapuji.com` set via API; **http://kundli.mybapuji.com serves the app — 200 OK ✓** (github.io URL now 301-redirects to the custom domain).
- HTTPS cert still provisioning (`https_certificate: null`). Cron checks scheduled: `30aa09c5…` at 04:53:55Z (checks cert, enforces HTTPS if ready, notifies this chat via sessions_send; else sends a short note) + backup `a22175c8…` at 05:40Z (deleteAfterRun).
- If checks miss: next active run → `gh api repos/vasant22/kundli/pages` (see https_certificate), `gh api -X PUT repos/vasant22/kundli/pages -F https_enforced=true`, verify https (use `curl --resolve kundli.mybapuji.com:443:185.199.108.153` if local DNS caches stall), then **Phase 13 final report**.

### 2026-09-29 — Phase 13 done: final report delivered
- Final report (Hindi, warm-paper editorial layout, single self-contained HTML) at **`docs/final-report.html`**: क्या बना · live links · 13-step journey · commands · file map · verification (62 tests) · limitations · future ideas (Vimshottari, D9/divisional charts, PDF export) · user’s remaining tasks. Rendered & checked in the browser.
- Project status: **COMPLETE.** Live: http://kundli.mybapuji.com · Repo: github.com/vasant22/kundli.
- Pending (auto/user): HTTPS cert (cron checks: f8b14e1d@05:55Z · 155a0455@08:00Z · backup a22175c8@05:40Z — all deleteAfterRun); user: AstroSage validation + mybapuji.com link + device checks.

### 2026-09-29 — PDF export corrections (user feedback)
- User feedback on the Phase-14 PDF export → three fixes: (1) the “✅ जानकारी सही है” heading is hidden in print (still shows on screen); (2) the print/PDF letter-head is now “कुंडली / Kundli” + a bordered box with both site links (mybapuji.com · kundli.mybapuji.com, clickable in the saved PDF); (3) the footer credit line (गणना इंजन + सोर्स कोड) and the “…तैयार हैं…” note are hidden in print — the website footer keeps the credits (AGPL source offer stays on the site; the PDF itself doesn’t need them).
- Verified: 69/69 tests; real Chrome print-to-PDF sample — computed print styles (box border, hidden lines), print-flow screenshots, and raw PDF text via pdfjs (page 1 starts with title + links box; no “जानकारी सही है”; last page ends with the privacy line; no credit lines, no page-number footers). Sample: `.openclaw/tmp/pdfcheck/kundli-test.pdf` (scratch, not committed).

### 2026-09-29 — Next task received: “Kundli Matching” (Ashtakoot Guna Milan, Phases 1–8)
- User supplied the spec (`docs/kundli-matching-guide.txt` + original docx alongside): add a `/match/` page to THIS repo — two-step form (boy → girl, one person per screen), Ashtakoot 36-point Guna Milan + Mangal Dosha checks for both, bilingual, same theme + same deploy pipeline.
- Reuse existing modules (astro.js, geocode.js, timeutil.js, i18n.js — extend i18n; don’t duplicate). New modules: `src/ashtakoot.js`, `src/mangaldosha.js`. Tests + `tests/MATCH_VALIDATION.md` (the user will hand-verify Nadi/Bhakoot exceptions; comment any simplifications).
- Rules: verify every classical lookup table against published sources before coding; ask only if truly blocked; never skip per-phase verification. Guide estimate: ~1–2 h coding + the user’s ~1–1.5 h validation — possibly one sitting.
- Next action: **Phase 1** (reuse setup; add the match page/route) — do this in a fresh chat (token-friendly continuation), starting from this file.

### 2026-09-29 — Kundli Matching Phases 1–8 done (live same day)
- **Phase 1** (`4911339`): multi-page Vite build (`match/index.html` + `src/match.js`), site nav कुंडली ⇄ कुंडली मिलान, i18n match strings. Tests 73→.
- **Phase 2** (`aaea7e4`): two-step boy→girl form — same validation/place-search/time-conversion/astro modules parameterised per person; Back; live language toggle; both charts computed on “मिलान रिपोर्ट देखें”. Real-engine e2e test added. Tests 80.
- **Phase 3** (`1898643`): `src/ashtakoot.js` — all 8 kootas. Tables verified against published sources (Saravali.de “Maitreya”, PyJHora, DrikPanchang) **and calibrated cell-by-cell against the industry-standard reference calculator (AstroSage)**: 269 pairs → **2152/2152 koota values + 269/269 totals match**. Fixtures: `tests/fixtures/ashtakoot-calibration.json`; one-time scripts + data in `scripts/calib/` (+ its README).
- **Phase 4** (same commit): `src/mangaldosha.js` — houses {1,4,7,8,12} from Lagna **and** Moon; 2nd house **not** counted (probe-verified); severity Low=one chart / High=both; nivaran notes (mutual, own-sign, exaltation) informational only — matches reference behaviour.
- **Phase 5** (`2a4ff0d`): full report (match.js + `src/matchcard.js`): bilingual koota table with reasons, total, verdict band, Mangal Dosha section, disclaimer; **PNG scorecard export** (1200×1010, Devanagari fine), PDF/print letter-head, copy details. Browser + PNG verified.
- **Phase 6** (`ad8dfa1`): `tests/MATCH_VALIDATION.md` (8 hand-check couples, our results prefilled), README “Kundli Matching — rules/calibration/variations” section. Full suite: **101 tests**.
- **Phase 7**: pushed → GitHub Actions deploy ✓ → **https://kundli.mybapuji.com/match/ live** (200; wasm + assets OK; nav link verified on the live main page).
- **Phase 8**: summary to user (this log + chat report).
- ⚠️ For the user’s review (also in README/MATCH_VALIDATION): Bhakoot nivaran = note only; Nadi strict (no exceptions); Gana orientation = reference’s; Vashya/Maitri/Varna variants where classical books differ.
- Dev helper: `/match/?demo=1` prefills the sample couple (dev build only, not in production).
- Handoff: all next steps are user-side (MATCH_VALIDATION hand checks, mybapuji.com link, device checks).

### 2026-09-29 — Panchang Phase 2 done: sunrise/sunset/moonrise/moonset (`src/sunrise.js`)
- `src/sunrise.js`: rise_trans-based. Sun & Moon disc = upper limb + refraction (matches
  **AstroSage**; Drik uses center-of-disc/no-refraction for the Moon → ~4 min difference,
  documented in code + fixtures, we follow AstroSage). Moonrise/moonset = first event AFTER the
  date's sunrise, next-day spills shown in extended hours (24+, 25+, 26+ — verified vs AstroSage
  Oct 3–6). Polar day/night → null + `note: 'polar'`. Timezone via `timeutil.offsetAt`.
- Accuracy: sun ±30 s vs 12 Drik city×date refs (Varanasi/Mumbai/Chennai/Delhi × Mar 20/Jun 21/
  Dec 21); AstroSage Delhi 2026-09-29: rise +19 s / set −22 s / day-length 11:56:41 vs 11:57:22
  (±60 s tolerance); moon within ±2 min of AstroSage. Polar checked (Tromsø).
- Tests: +23 → **124 passing** (`tests/sunrise.test.js`, fixtures `tests/fixtures/sunrise-refs.json`).
- New calib tools: `scripts/panchang-calib/{probe-moon,diff-sunrise,check-sunrise}.mjs`, `drik-rise-set.json`.
- Next: **Phase 3** — `src/panchang.js` core (tithi/nakshatra/yoga/karana + end times via
  bisection, samvat years, amanta/purnimanta months incl. Adhika, ritu, moon sign, day duration).

### 2026-09-29 — Panchang Phase 3 done: core calculation (`src/panchang.js`)
- `src/panchang.js`: tithi/nakshatra/yoga/karana with exact end moments (bisection) + reference
  display rules (max 2 entries per limb; extended-hours "27:20:03"; "upto Full Night" flag);
  Vaar; Samvat trio + Samvatsara name; Pravishte; Amanta/Purnimanta (+Adhika, evaluated at
  sunrise); Ritu; Moon sign; day duration.
- **Two Phase-1 rules corrected in this phase** (re-verified vs AstroSage + Drik pins):
  (1) **Vikram flips on the first sunrise after Phalguna Purnima** (purnimanta Chaitra day 1):
  2024 Mar 26 / 2025 Mar 15 / 2026 Mar 4 / 2027 Mar 23 — a plain `Shaka+135` is wrong in early
  March (offset is +136 between the Vikram flip and the Chaitra Pratipada flip).
  (2) **Ritu uses the TROPICAL Sun** at sunrise, boundaries 330°+60k (12/12 boundary pairs of
  2026 matched; Drik agrees on spot checks).
- Shaka/Kali flip = first sunrise after the Chaitra new moon (2024 Apr 9 / 2025 Mar 30 / 2026
  Mar 20 ✓; Kali = Shaka+3179). Adhika Jyeshtha 2026 (May 16–Jun 15) handled; month naming now
  evaluated at SUNRISE (fixes the 15-Jun-2026 boundary).
- Shared code: astro.js +`sunMoonLongitudes`, +`sunSayanaLongitude`; i18n.js +`SAMVATSARA_NAMES`
  (60 names, hi+en — pulled ahead for Phase 3; other Panchang lists stay in Phase 6).
- Tests: +71 (`tests/panchang.test.js`: 63 reference dates + focused flips/Night/adhika/
  Pravishte-edges/polar) → **195 passing**. Documented skips: Pravishte AS divergences
  (5 dates) + karana razor 2025-03-29.
- Tools: `scripts/panchang-calib/check-panchang.mjs`; `astrosage.json` grew to 63 records.
- Next: **Phase 4** — `src/muhurat.js` (8-part Rahu/Yamaganda/Gulika; 15-part Kulika/Kantaka/
  Kalavela/Yamaghanta/Dushta/Abhijit — tables in docs/PANCHANG_FORMULAS.md §11).

### 2026-09-29 — Panchang Phase 4 done: muhurat windows (`src/muhurat.js`)
- `src/muhurat.js`: 8-part daytime (Rahu Kaal, Yamaganda, Gulika Kaal) + 15-part daytime
  (Kulika, Kantaka/Mrityu, Kalavela/Ardhayaam, Yamaghanta, Dushta Muhurtas [1–2 windows],
  Abhijit) — tables straight from docs/PANCHANG_FORMULAS.md §11 (pre-verified ×7 weekdays).
  Entries carry {key, hi, en, from, to, fromJd, toJd}; integrated into `computePanchang()`
  as `.muhurats`.
- i18n.js: +`MUHURAT_NAMES` (9 rows hi+en — Phase 4 needs names in its returned object).
- Tests: +65 (`tests/muhurat.test.js`: all fixture dates with muhurat fields + focused checks
  incl. Monday's two Dushta windows & Abhijit centered on midday) → **260 passing**.
- Next: **Phase 5** — `src/panchang-extras.js`: Disha Shoola, Tara Bala (reuse ashtakoot.js
  tables), Chandra Bala.

### 2026-09-29 — Panchang Phase 5 done: Disha Shoola / Tara Bala / Chandra Bala (`src/panchang-extras.js`)
- `src/panchang-extras.js`: fixed weekday→direction table; **Tara Bala** (9-group counting from
  the janma star; excludes Vipat/Pratyari/Vadha; Janma kept) and **Chandra Bala** ({1,3,6,7,10,11}
  distances) — full bilingual lists in zodiacal order; integrated into `computePanchang()` as
  `.extras`. NOTE: Ashtakoot's tara display table uses its own index base (separately
  calibrated) — commented in both modules.
- i18n.js: +`DIRECTIONS` (8 compass names, hi+en).
- Tests: +65 — Tara/Chandra lists asserted for **every** fixture date (~40 dates × both lists +
  disha × all) → **325 passing**.
- Next: **Phase 6** — i18n additions (30 tithi, 27 yoga, 11 karana, 7 vaar, amanta/purnimanta
  months, ritus, muhurat & direction names done, UI strings for all sections).

### 2026-09-29 — Panchang Phase 6 done: bilingual lists + UI strings (i18n.js)
- +`TITHIS` (30), +`YOGAS` (27), +`KARANAS` (11), +`VAARAS` (7), +`LUNAR_MONTHS` (12 — shared by
  amanta & purnimanta), +`RITUS` (6) with label helpers (`tithiLabel`, `yogaLabel`, `karanaLabel`,
  `vaaraLabel`, `lunarMonthLabel(+adhika)`, `rituLabel`, `samvatsaraLabel`). Samvatsara(60),
  MUHURAT_NAMES, DIRECTIONS were added in Phases 3–5 as the compute modules required them.
- +~50 `panchang.*` UI strings (all section headers, field labels, upto/from/to, Full Night,
  Adhik, N/A, chart tab labels, widget labels, errors) merged via Object.assign → `t()` unchanged.
- Tests: +5 (`tests/panchang-i18n.test.js`: lengths, non-empty entries, spot checks, key parity
  in both languages, language switching) → **330 passing**.
- Next: **Phase 7** — homepage widget (`panchang-widget/` page for the mybapuji.com iframe,
  fixed ashram location, auto-refresh daily, card fields + “Today Panchang” button).

### 2026-09-29 — Panchang Phase 7 done: homepage widget (`panchang-widget/`)
- New page `panchang-widget/index.html` + `src/panchang-widget.js` + `src/widget.css` +
  `src/widget-location.js`.
- ⚠️ **Location is a PLACEHOLDER (Vrindavan)** — the guide says the user will provide the
  ashram's exact location. Change the 4 values in `src/widget-location.js` when provided;
  geocoding is never called on load. **Ask the user in the Phase-7 report.**
- Card: title + location + full date; rows: Tithi (with paksha + end time), Month Amanta,
  Month Purnimanta, Day & Samvat (Vikram), Nakshatra, Yoga (1–2), Karana (1–2);
  “आज का पंचांग” button → full page (kundli.mybapuji.com/panchang/). `?lang=en` for English
  labels; `?transparent=1` to blend into the WordPress theme.
- Auto-refresh: date check every 30 s + on tab visibility; `window.__panchangWidget` debug
  handle ({getDate, refresh}) for the Phase-10 midnight check.
- Verified in a real browser: Hindi & English renders both correct (dev server).
- Tests: +7 (todayInZone across midnights, rows order/values, renderWidget hi/en) →
  **337 passing**. Build adds `dist/panchang-widget/` (~13 KB; total ≈ 2.92 MiB — within the
  ~3 MB budget).
- Next: **Phase 8** — full `/panchang/` page (all sections incl. Lagna chart at sunrise with
  North/South/East tabs + planets table).

### 2026-09-29 — Panchang Phase 8 done: full `/panchang/` page
- **Page**: `panchang/index.html` + `src/panchang-page.js` + `src/panchang.css` (multi-page
  build entry). Default place = MUMBAI (user's instruction; `src/widget-location.js`); place
  search reuses geocode.js; date picker defaults to today; “पंचांग देखें” computes; URL params
  for tests/deep-links (`?lang=en&date=…&lat=…&lon=…&tz=…&place=…`).
- **All nine sections** rendered (bilingual): आज का पंचांग, सूर्य-चंद्र गणना, हिंदू मास-वर्ष,
  अशुभ/शुभ मुहूर्त (bilingual window labels), दिशा शूल, चंद्रबल-ताराबल, सूर्योदय का लग्न चार्ट
  (उत्तर/दक्षिण/पूर्व tabs — **new `buildEastChart`** in charts.js, decoded layout), सूर्योदय की
  9-ग्रह तालिका (राशि/अंश/नक्षत्र/पद, “(R)” retro) + modern-planets note.
- **Nav**: “पंचांग” link added to main + match pages (and this page's own nav).
- Verified in a real browser: Hindi & English renders; Mumbai values (सूर्योदय 06:28:43, राहु
  15:28:45–16:58:45, ताराबल/चंद्रबल lists, charts, planets table) all correct.
- Tests: +13 (page 10 + East chart 3; match-nav test updated) → **350 passing**. Build ✓
  (`dist/panchang/`, total ≈ 2.93 MiB).
- Noted as future (per guide): “next 7 days” date-range table.
- Next: **Phase 9** — validation: more known-date asserts + `tests/PANCHANG_VALIDATION.md`
  manual checklist (10 dates incl. two-tithi day, Samvat boundary, chart spot-check).

### 2026-09-29 — Panchang Phase 9 done: testing & validation
- New multi-city test `tests/panchang-multicity.test.js` (+ fixture
  `scripts/panchang-calib/drik-panchang.json`): 12 city×date combos (Varanasi/Mumbai/Chennai/
  Delhi × Mar/Jun/Dec) vs Drik — tithi/nakshatra/yoga/karana names + ends and Rahu/Yamaganda/
  Gulika/Abhijit/Dur windows, all within 120 s (measured ≤ ~90 s).
- `tests/PANCHANG_VALIDATION.md` generated (`npm run panchang:validation`) — 10 hand-check dates
  spread across the year (two-tithi day, Full-Night display, Samvat flips, Adhika month,
  Pravishte edges) with OUR values pre-filled + a Sep-29 Mumbai chart/planet-table check;
  user fills “संदर्भ परिणाम / मैच?” columns.
- README: new “पंचांग / Panchang — rules, calibration & how to verify” section (all known
  variations + calibration record).
- Refactor: `jdToUtcParts`/`sunriseKundli` moved to `src/panchang.js` (re-exported by the page)
  so Node calib scripts don't import CSS.
- Test count: **362 passing**.
- Next: **Phase 10** — deploy (push → GitHub Actions → live; widget iframe embed instructions
  for the mybapuji.com WordPress homepage; midnight-refresh check).

### 2026-09-29 — Panchang Phase 10 done: DEPLOYED (live) + WordPress instructions
- `git push` → GitHub Actions: first run **failed on a CI-only test** — the page test passed a
  lowercase `timezone` key → silent UTC fallback in offset resolution (invisible on an IST dev
  machine, caught on UTC runners). Fixed (`timeZone` + a guard in `computeDayTimes` against silent
  fallback); full suite re-verified under `TZ=UTC` (362/362). Second run: **success → deployed**.
- **LIVE (verified)**: https://kundli.mybapuji.com/panchang/ ·
  https://kundli.mybapuji.com/panchang-widget/ (both 200; live pages render correctly — Mumbai
  default, all sections; widget verified in a real browser).
- `DEPLOY.md`: new “पंचांग पेज व होमपेज विजेट” section — WordPress embed step-by-step +
  exact iframe code (Custom HTML block, height 640, `?lang=hi/en`, `&transparent=1`).
- Midnight auto-refresh check: one-shot cron `9465d2db…` fires 00:10 IST (30 Sep) and reports
  in the chat.
- Remaining: user's PANCHANG_VALIDATION.md hand-check + Phase 11 final report.

### 2026-09-29 — Panchang Phase 11 done: FINAL REPORT — project COMPLETE
- `docs/panchang-final-report.html` — Hindi editorial single-file report (क्या बना / live links /
  11-phase journey / commands / file map / verification / flagged uncertainties / WordPress embed /
  future ideas / user tasks). Rendered & checked in the browser.
- All 11 phases complete; 362 tests; both pages deployed and verified live; CI green.
- Handoff (user-side): PANCHANG_VALIDATION.md hand-check (10 dates, Mumbai, prefilled),
  WordPress homepage embed (code in DEPLOY.md + the report), midnight-check result arriving via
  cron `9465d2db…` (00:10 IST, reports in chat).

### 2026-09-29 — Homepage Widgets (mybapuji.com 3-card row) — Phase 1 done
- New project received via `widget.docx` spec: mybapuji.com homepage पर astrosage-शैली का
  तीन-कार्ड row — Kundli mini-widget + Kundli-Matching mini-widget + existing Panchang widget.
  सारा logic reuse; गणना में कोई बदलाव नहीं। Phases 1–8. Plan confirmed: हर mini-widget
  query-string बनाकर full tool **नई tab** में खोलेगा (cross-domain iframe से data silently
  share नहीं हो सकता)।
- **Phase 1 (`5157705`)**: चारों live pages जाँचे (सब 200)। दो नए input-only widget pages की
  ज़रूरत confirm। मौजूदा pages में **URL pre-fill + auto-run** जोड़ा (full tools अब link से
  भरे हुए खुलेंगे):
  - `src/prefill.js` (new) — pure param-parsing module (unit-tested)।
  - `src/main.js` — `?name&gender&day&month&year&hour&min&sec&place&lat&lng&tz&lang`;
    सब पूरा व सही हो तो calculation अपने-आप।
  - `src/match.js` — वही keys `b_`/`g_` prefix से; दोनों तरफ़ पूरा हो तो report अपने-आप।
  - `lon` = `lng` का alias; `lang=hi|en` optional. Widgets (Phases 2–3) यही format भेजेंगे।
- Tests: +10 (`tests/prefill.test.js`) → **372 passing**. Real-browser round-trips (dev
  server, असली engine): कुंडली (लग्न कन्या 7°02′ + चार्ट) और मिलान (कुल योग 29.5/36 + मंगल
  दोष जाँच) दोनों link से अपने-आप चले ✓. Build ✓ (2.94 MiB).
- Next: **Phase 2** — Kundli mini-widget page (kundli.mybapuji.com/widgets/kundli/).

### 2026-09-29 — Homepage Widgets Phase 2 done: Kundli mini-widget (`026149e`)
- नया छोटा कार्ड पेज **widgets/kundli/** (kundli.mybapuji.com/widgets/kundli/): सिर्फ़ फ़ॉर्म —
  नाम, लिंग (3 chips, मुख्य पेज जैसा; native dropdown नहीं — touch/browser-test friendly),
  तिथि (दिन/महीना/साल), समय (घंटा/मिनट/सेकंड), जगह (geocode search + results + ✔ confirm),
  “कुंडली बनाएँ”। कोई गणना नहीं — submit पर prefill-URL बनाकर पूरा tool **नई tab** में
  (`../../` से site root; dev+prod दोनों में सही; `?lang=en`/`?transparent=1` भी चलते हैं)।
- **validation अब साझा**: नया `src/birthvalidate.js` — main.js / match.js / widget तीनों वही
  rules (rules में कोई बदलाव नहीं; duplicate code हटा; सारे पुराने tests पास)। i18n +`kw.*`
  (hi+en); widget.css +`.kw-*` styles; vite multi-page entry जुड़ा।
- Tests: +9 (`tests/kundli-widget.test.js`: URL format, render order, validation messages,
  search+pick+open) → **381 passing** (TZ=UTC भी)। Build ✓ 2.95 MiB (dist/widgets/kundli/)।
- Browser (379px): card render ✓, असली Open-Meteo खोज + चयन + ✔ confirm ✓, submit →
  “✅ कुंडली नई tab में खुल रही है…” ✓। jsdom नोट: document में same id दो बार हो तो scoped
  `#id` query fail हो सकती है — tests में body साफ़ करके हल किया।
- Commit: `026149e` + notes commit। Next: **Phase 3** — Matching mini-widget (widgets/match/)।

### 2026-09-29 — Homepage Widgets Phase 3 done: Matching mini-widget (`24cac61`)
- नया छोटा कार्ड पेज **widgets/match/** (kundli.mybapuji.com/widgets/match/): दो-चरणीय फ़ॉर्म
  कार्ड के अंदर ही — चरण 1 लड़का → “आगे बढ़ें” → चरण 2 लड़की → “मिलान रिपोर्ट देखें”; नोट
  “लड़की का विवरण अगले पन्ने पर डालें।” (spec के मुताबिक़) + पीछे-बटन। कोई गणना नहीं —
  final submit पर **/match/** का prefill-URL (b_/g_) बनाकर **नई tab** में खोलता है।
- वही shared pieces: `birthvalidate.js`, `geocode.js`, `.kw-*` styles; i18n +`mw.title` /
  `mw.opening`; vite entry `match-widget`।
- Tests: +9 (`tests/match-widget.test.js`: b_/g_ URL, render, दोनों चरण, ख़ाली-जाँच, पूरी
  यात्रा search×2 → open, Back) → **390 passing** (TZ=UTC भी)। Build ✓ 2.96 MiB।
- Browser (379px): कार्ड render ✓; लड़के की असली खोज+चयन → “आगे बढ़ें” → लड़की चरण ✓;
  लड़की खोज+चयन → “मिलान रिपोर्ट देखें” → “✅ मिलान रिपोर्ट नई tab में…” ✓।
- Commit: `24cac61` + notes commit। Next: **Phase 4** — पंचांग विजेट का बाहरी size/card-style
  मिलान (सिर्फ़ packaging; गणना में कोई बदलाव नहीं)।

### 2026-09-29 — Homepage Widgets Phase 4 done: पंचांग कार्ड style-milan (`643e935`)
- जाँच: तीनों कार्ड अब भी वही साझा stylesheet (widget.css `.pw-card` / `.pw-btn`) इस्तेमाल
  करते हैं — padding, border-radius, shadow, fonts, button size सब एक जैसे। Browser (364px):
  पंचांग कार्ड सही (title/मुंबई/तारीख़ + 7 rows + बटन 337×39 — नए widgets के बटन जितना ही)।
  ⇒ **कोई CSS बदलाव ज़रूरी नहीं** (spec: “adjust ONLY if needed”)।
- नया dev-टूल: `tests/widgets-preview.html` — तीनों widgets stacked preview (मोबाइल view);
  Phase 5/6 का local test bed।
- कार्ड ऊँचाइयाँ natural अलग हैं (कुंडली ~554 · मिलान ~521+ · पंचांग ~472) — height का
  हल Phase 5 में (iframe auto-resize postMessage, prefer (b))।
- Commit: `643e935` + notes commit। Next: **Phase 5** — homepage 3-column HTML/CSS block
  (WordPress deliverable) + iframe auto-resize mechanism।
