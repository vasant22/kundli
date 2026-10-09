# Kundli / जन्मपत्री App — Project Notes (handoff)

Created: 2026-09-28. Status: **Main app COMPLETE; “Kundli Matching” (Ashtakoot Guna Milan) COMPLETE — Phases 1–8 done 2026-09-29, live at https://kundli.mybapuji.com/match/** (same repo; nav link added on the main page). **Third project “Panchang” — COMPLETE (Phases 1–11, 2026-09-29) — live at https://kundli.mybapuji.com/panchang/ and /panchang-widget/; 362 tests.** User-side remainders: Panchang hand-checks (tests/PANCHANG_VALIDATION.md), WordPress embed, plus the older 10-chart AstroSage validation (tests/VALIDATION.md), matching hand-checks (tests/MATCH_VALIDATION.md), mybapuji.com link, device checks.
First thing to do in a fresh chat: read this file + `docs/bnn-guide.txt` (current task spec — Project #4 BNN चार्ट; `docs/kundli-guide.txt` / `docs/kundli-matching-guide.txt` / `docs/panchang-guide.txt` = specs of the completed apps, reference only). Old HTTPS-cert notes below are resolved — no action needed.

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

### 2026-09-29 — Homepage Widgets Phase 5: mybapuji.com होमपेज पर तीनों कार्ड (LIVE) + auto-height
- नया `src/widget-resize.js` — तीनों widget pages अपनी असली card-height parent को
  postMessage से भेजते हैं (`{type:'acw-height'}`; load / resize / content-change पर,
  ResizeObserver आधारित)। parent (होमपेज) iframe की ऊँचाई उसी हिसाब से set करता है।
  commits `96528c3` (reporter + harness) · `f327375` (measure-fix)।
- 🐛 browser-जाँच में बग पकड़ा: `scrollHeight` कभी iframe की current ऊँचाई से नीचे नहीं
  जाता — reporter 600 (iframe size) भेज रहा था, content (566) नहीं। फ़िक्स: `#widget`
  element की `getBoundingClientRect().height`; +1 test → **393 passing**। (debug page से
  verify: height=566 applied; harness में तीनों कार्ड auto-fit ✓)
- **mybapuji.com deploy**: `mu-plugins/autoclaw-templates/autoclaw-home.php` में `.band`
  के नीचे नया `.acw-tools` section — 3 कॉलम (कुंडली · मिलान · पंचांग; ≤860px पर 1 कॉलम),
  तीनों iframes `?transparent=1`। Backup: `autoclaw-home.php.bak-20260929` (= rollback
  वापस कॉपी)। कैश साफ़ (supercache + nginx); CF HTML-cache नहीं करता (DYNAMIC)।
- Dev tools: `tests/widgets-preview.html` = WordPress block का हूबहू mirror (auto-height
  सहित, browser-verified)। `tests/resize-debug.html` सिर्फ़ debugging के लिए (commit नहीं)।
- Next: **Phase 6** — testing (breakpoints, दोनों round-trips, `tests/HOMEPAGE_WIDGETS_CHECKLIST.md`)।

### 2026-09-29 — Homepage Widgets Phase 5b: live-verification notes (mybapuji deploy के बाद)
- Deploy के बाद homepage पर पहले कुछ 520 दिखे — जाँच में निकला: nginx cache खाली करने के
  तुरंत बाद हर पेज origin से generate होता है (~2s), कुछ requests transient 520; cache
  भरते ही स्थिर (8/8 → 200, फिर 0.34s)। **सबक: `/var/cache/nginx/*` साफ़ करने के बाद
  `systemctl restart nginx` कर दें** (unlink() crit errors भी रुक जाते हैं)।
- Cross-origin auto-height live-verified ✓: एक local test page में LIVE widget
  (kundli.mybapuji.com से, 566px) → message arrive + applied। (तीनों widgets एक ही mechanism।)
- Panel की 379px चौड़ाई में desktop 3-column का visual सिर्फ़ user के browser पर दिखेगा;
  mobile = single column; दोनों एक ही grid से।

### 2026-09-29 — होमपेज widgets: यूज़र-feedback fixes (suggestions + credit) (`057a955`)
- 🐛 समस्या 1: जगह चुनने के बाद भी suggestions नहीं हटती थीं — कारण: `widget.css` में
  `[hidden]` नियम नहीं था और `.kw-results{display:flex}` hidden attribute को override कर
  देता था (पूरे tools में style.css में यह नियम पहले से था — इसलिए वहाँ ठीक चलता था)।
  फ़िक्स: widget.css में `[hidden]{display:none !important}`; + kw/mw tests में assertions।
- समस्या 2: "Geocoding by Open-Meteo.com" भद्दा लग रहा था — यह मुफ़्त सेवा की शर्त
  (attribution) है, इसलिए पूरा हटाया नहीं; अब बहुत छोटा/हल्का और कार्ड के सबसे नीचे
  (button के नीचे)। पूरे tools में भी same softening।
- Browser-verified (kw): 'amla' search → pick → सूची तुरंत हटी ✓, confirm ✓, credit नीचे ✓।
- Commit: `057a955` (+ notes commit)। Next: **Phase 6** — testing checklist अब भी बाक़ी।

### 2026-09-29 — footer credits: "लगभग invisible" style (user request) (`9d0c501`)
- User ने पूछा कि bottom की "गणना इंजन / सोर्स कोड" लाइन क्यों है — समझाया: ये license
  शर्तें हैं (Swiss Ephemeris credit + AGPL source offer), इसलिए हटाना ठीक नहीं। User बोले
  — रहने दो पर style **हल्का/almost invisible** कर दो।
- `.site-footer .note`: color `#b7ab9d`, size 0.74rem; links अब underline-less (hover पर ही
  underline + गहरा रंग)। Print में निजता-लाइन `#8f8f8f` (PDF पढ़ने लायक); credit line print
  में छिपी रहती है (पहले जैसा)। 393 tests ✓; style.css बदला — तीनों pages (main/match/
  panchang) पर असर।

### 2026-09-29 — Favicon: mybapuji का 🌿 icon कुंडली साइट पर (`6c8bf85`)
- User request: mybapuji.com वाला छोटा tab-icon (favicon) kundli.mybapuji.com पर भी।
- `public/favicon-32.png` + `public/favicon.png` (mybapuji के site-icon से, 32+192px); सभी
  6 pages के `<head>` में `<link rel="icon">` (relative paths — custom domain + किसी भी
  sub-path दोनों पर सही)। Built output में verify: files 200 + links हर page पर। 393 tests ✓।
- ⚠️ पुराने browsers tab-icon ज़िद्दी cache करते हैं — user को hard refresh / नया tab चाहिए
  हो सकता है; नए visitors को तुरंत दिखेगा।

### 2026-09-29 — Fix: पंचांग विजेट का button नई tab में खोले (`2d0964c`)
- User report: mybapuji होमपेज पर पंचांग कार्ड का “आज का पंचांग” button काम नहीं करता।
  कारण: उस `<a>` में `target` नहीं था — iframe के अंदर click पर वह **उसी छोटे कार्ड को**
  navigate करता (कटा/अधूरा दिखता)। फ़िक्स: `target="_blank" rel="noopener"` (कुंडली/मिलान
  कार्ड जैसा)। + test assertions। Browser: click पर card अपनी जगह रहता है, नई tab खुलती है।
- 393 tests ✓ (commit `2d0964c`)।

### 2026-09-29 — Widget कार्ड: बराबर ऊँचाई + बड़ी सुंदर headings (`8388b06`)
- User feedback: (1) तीनों कार्ड के निचले किनारे ऊपर-नीचे थे → अब सब `min-height:570px`
  (flex से भरकर, button नीचे pin) — निचले किनारे एक लाइन में; flex से margins collapse
  नहीं हो रहे थे (spacing बढ़ गया था) → `.kw-field` वग़ैरह सिर्फ़ bottom-margin पर — तीनों
  कार्ड exact 570px, buttons भी एक लाइन पर।
- (2) Card headings छोटी थीं → अब **Rozha One** (सेल्फ़-होस्टेड display font, +47KB;
  `scripts/fetch-fonts.mjs` में जोड़ा; `fonts.css` regenerate) 1.3em में — बड़ी + बोल्ड-दिखने
  वाली। Browser-verified: तीनों iframes 582px (बराबर), titles एक ही line में। 393 tests ✓।
- dist अब 3.03 MiB (Rozha के +47KB से)।

### 2026-09-29 — Headings वापस साफ़-बोल्ड + section heading हटाई (`ed77fc6`)
- User: designed font (Rozha) नहीं चाहिए — **bold + स्पष्ट readable** चाहिए; size ठीक है।
  → `.pw-title` अब **Noto Sans Devanagari 700** (1.3em वही)। Noto अब 400–800 range
  (same variable file, extra 0 KB); Rozha files हटा दीं — dist वापस **2.99 MiB**।
- mybapuji section से “मुफ़्त ज्योतिष साधन / कुंडली · मिलान · पंचांग” header हटाया (cards के
  अपने titles काफ़ी हैं)। Server: backup `autoclaw-home.php.bak-20260929b`; swap + कैश साफ़ +
  nginx restart (पिछली सीख लागू — कोई 520 नहीं); homepage 200, 3/3 stable; heading गायब ✓।
- तीनों कार्ड अब भी बराबर (582/582 harness; कोई title wrap नहीं)।

### 2026-09-30 — ऊपर का menu अब साफ़ दिखने वाला (user request)
- User: "https://kundli.mybapuji.com/ के top पर menu नज़र नहीं आ रहा" — तीनों pages के
  `.site-nav` links अब **chips**: सामान्य = हल्का saffron bg + border + बोल्ड text;
  active = गहरा saffron bg + सफ़ेद text (hover भी)। सिर्फ़ `src/style.css` (सभी pages
  पर लागू)। 393 tests ✓; dist वही **2.99 MiB**।
- 2026-09-30 (follow-up): chips थोड़े tight किए (padding .85rem, gap .4rem) + hidden ≤340px
  पर छोटी-सी बदलाव — अब **तीनों pages पर तीनों links एक ही लाइन** में (375px: 63+103+60px)।

### 2026-09-30 — ऊपर MyBapuji (मुख्य साइट) की menu-पट्टी (user request)
- User: "kundli पेज के top पर MyBapuji का home menu भी देना है, दिख नहीं रहा" → तीनों
  पूरे पेजों (/, /match/, /panchang/) पर सबसे ऊपर **हरे रंग की पट्टी**: 🌿 MyBapuji.Com +
  होम · किताबें · ब्लॉग · इलाज · वीडियो (सभी mybapuji.com पर; हिंदी/अंग्रेज़ी toggle साथ)।
  नई फ़ाइल `src/mybapuji-strip.js`; `style.css` में `.mb-strip` (+ print में छिपी)।
  widgets/mini pages पर नहीं — सिर्फ़ पूरे पेजों पर। **395 tests ✓** (2 नए + assertions)।

### 2026-09-30 — SEO + Google Search Console (कुंडली · मिलान · पंचांग — user request)
- User: नई links (कुंडली/मिलान/पंचांग) Google में rank करें; "free" keyword ज़रूर; GSC में submit।
- SEO changes (commit `2a76a7e`, **403 tests ✓**, CI success):
  - Titles अब "Free …" → Free कुंडली बनाएं / Free कुंडली मिलान (36 गुण अष्टकूट) / Free पंचांग (Aaj Ka Panchang)।
  - Meta description + **keywords** (free…), canonical, Open Graph, JSON-LD (**WebApplication + FAQPage**) — तीनों pages।
  - पेज के अंत में स्थिर **FAQ/SEO भाग** (JS बंद हो तो भी दिखता है; `.seo-box`) + internal-link chips; H1 के नीचे **"✨ 100% Free …" badge** (i18n keys: `app.badge`/`match.badge`/`panchang.badge`)।
  - `public/robots.txt` + `public/sitemap.xml` (3 URLs) — live दोनों 200; नया `tests/seo.test.js` (8 tests)।
  - dist ≈ 3.1 MiB (+~25 KB HTML; gzip असर बहुत छोटा)।
- Keyword research (जो pages rank कर रहे हैं → खोजशब्द): कुंडली = free kundli / जन्म कुंडली / जन्मपत्री / कुंडली बनाएं (AstroSage, Prokerala, AstroTalk, mpanchang…); मिलान = कुंडली मिलान / गुण मिलान / 36 गुण / अष्टकूट / मंगल दोष / नाम से मिलान (AstroSage, Shaadi, Prokerala, AstroTalk…); पंचांग = आज का पंचांग / आज की तिथि / राहु काल / शुभ मुहूर्त / हिन्दू पंचांग (Drik Panchang, Prokerala, onlinejyotish…)।
- GSC (user खुद logged-in थे; कुछ नहीं पूछना पड़ा):
  - नई property **https://kundli.mybapuji.com/** जोड़ी → **auto-verified** ("Domain name provider" से — parent domain property की बदौलत)।
  - Sitemap `https://kundli.mybapuji.com/sitemap.xml` submit → **Status: Success · 3 discovered pages** (domain property की सूची में भी दिखता है)।
  - तीनों URLs: URL Inspection → **Request indexing** ("priority crawl queue")। फ़िलहाल स्थिति: "Discovered – currently not indexed" (पहला crawl आने वाले दिनों में)।
- आगे: 2–4 हफ़्तों में GSC queries देखें; OG image (share preview) नहीं बनाया; mybapuji menu anchors अभी "कुंडली/जन्म पत्री/…" (चाहें तो "Free …" कर सकते हैं — user से पूछकर)।

### 2026-09-30 — किताबें + Amazon Sponsored block (user request — तीनों pages के bottom पर)
- User: जैसे mybapuji.com pages पर ज्योतिष-किताबों की free-download links व Amazon affiliate (Sponsored) है (sample: /pdf-astrology-books-english-free-download/), वैसे ही /, /match/, /panchang/ के bottom पर जोड़ो — title "ज्योतिष संबंधित किताबें मुफ़्त download करें" जैसा।
- जोड़ा (तीनों HTML, static; seo-info के अंदर FAQ के नीचे):
  - "ज्योतिष संबंधित किताबें मुफ़्त Download करें" box — 7 cards (ज्योतिष शास्त्र · KP ×3 · नाड़ी ज्योतिष · हस्त रेखा ज्ञान · ज्योतिष संग्रह — mybapuji links, 200 ✓) + chips: सभी हिंदी किताबें / English ज्योतिष किताबें।
  - "Sponsored — आपके लिए चुनी किताबें" box — 6 Amazon search links (tag krishna220af-21; rel="nofollow sponsored noopener"; ज्योतिष/धार्मिक/मंत्र-तंत्र/वेदांत/प्रेरक/योग)।
  - CSS `.book-grid/.book-card/.sponsored-tag/.seo-note`; print में seo-info साथ छिपता है। tests +3 → **406 ✓**; dist ≈ 3.13 MiB।
- ⚠️ Amazon links static (rotation वाला mu-plugin यहाँ नहीं) — बदलने हों तो तीनों HTML में सीधे edit (tag रहने दें)।

### 2026-09-30 — FAQ accordion (+/−) + tool links बाहर (user request)
- तीनों पेजों का FAQ अब `<details class="faq-item">` accordion — प्रश्न ऊपर, "+" दबाने पर उत्तर (खुलने पर "−")।
- "और मुफ़्त टूल" वाले दोनों chips अब FAQ box से बाहर — हमेशा दिखते हैं (कभी hide नहीं)।
- CSS: `.faq-item/summary/::after`; `.seo-links` generic (बॉक्स-बाहर भी चलेगा); `.seo-info > * + *` spacing।
- tests 406 ✓; dist check done।

---

## Project #4 — BNN (भृगु नंदी नाड़ी) चार्ट — शुरू 2026-10-07
Spec: `docs/bnn-guide.txt` (+ `docs/Kundli_BNN_Project_Guide.docx`, संस्करण 2)। Guide भाग 6 में phases 1–9 — हर phase के बाद: test → छोटी हिंदी रिपोर्ट → commit।
नियम (user-confirmed 2026-10-07): **चित्र = लग्न (राशि) कुंडली; सारी गणना/तालिकाएँ ग्रहों की degree + भावचलित (KP New) से।** BP/AP toggle (आयु 30+ → default AP)। प्रतिशत constants settings में (R11)। खुले मुद्दे implement नहीं — report/पूछना only (शनि-सूर्य-97, गुलिक, TR tabs, PCP 7th/वक्री, BRSSS B11, अंतर-वर्ष 364)।

### 2026-10-07 — BNN Phase 1 done (`d5cb72c`)
- नया page `/bnn/` — `bnn/index.html` + entry `src/bnn/main.js`: कुंडली page वाला ही input form (वही shared modules — birthvalidate/geocode/prefill/timeutil/i18n; कोई duplicate rule नहीं)। Nav में "BNN चार्ट" (सिर्फ़ bnn page पर; बाक़ी pages पर launch के समय) ।
- `src/bnn/` stubs (अगले चरणों का contract): kp (Ph2) · prsss (Ph3) · combos (Ph4) · percent + special (Ph5) · dasha (Ph6) · transit (Ph7) · render (2+)। `vite.config.js` multi-page input जुड़ा।
- SEO: फ़िलहाल `noindex` + canonical (निर्माणाधीन); चरण 9 में index + sitemap + बाक़ी pages के nav links।
- Tests: **415 ✓** (नए: `tests/bnn.test.js` 6, `tests/bnn-modules.test.js` 3)। `npm run build` ✓ — dist 3.1M; `/bnn/` = 3.75 kB HTML + ~11 kB JS।
- ⚠️ jsdom में `scrollIntoView` नहीं होता → guard लगाया (main.js वाला ही pattern)।
- Token: wallet 25313 → ~25071 (Δ ≈ 242 इस चरण में)।
- **अगला — Phase 2**: swisseph के KP/Krishnamurti sidereal-mode candidates की सूची → reference chart (22-01-1980, 20:30, बैतूल) पर हर candidate → 1 कला के भीतर मेल वाला variant; फिर लग्न-चार्ट drawing (उत्तर/दक्षिण toggle) + centre panel (R16) + exchange label (R6)।

### 2026-10-07 — BNN Phase 2a: अयनांश तय (reference match) (`62f03e0`)
- Reference चार्ट (22-01-1980, 20:30, बैतूल) पर sweph के सारे KP/Krishnamurti candidates जाँचे — `scripts/bnn-calib/` + **`docs/bnn-calib-findings.md`**।
- **चुना: sidereal mode 44 ("Lahiri VP285") = 23°35′06″** — अकेला candidate जो ग्रह ≤0.84′ देता है (Krishnamurti 5/45: 5.8–7′ ✗; Lahiri/ICRC ~1.2′)।
- **Input-fit खुलासा**: पुराने outputs पूरे देते हैं lat≈21°29′ + समय≈20:32:13 (+2m13s) पर → संधियाँ ≤0.35′, ग्रह ≤1.55′, तिथि/योग/नक्षत्र-उत्तरा भाद्रपद-3 exactly ✓। (user/guru से confirm — findings §3; ज़्यादा कुंडलियाँ मिलें तो recalibrate।)
- `src/bnn/kp.js` अब असली engine: computeBhavaChalit (Placidus + planets + bhava-map + tithi/yoga) · setBnnAyanamsa · findExchanges (MERCURY<>SATURN ✓) · BNN_SETTINGS। `tests/bnn-kp.test.js` (6 नए)। **421 ✓**।
- Token: wallet 25071 → ~24405 (Δ ≈ 666 इस phase-भाग में)।
- **अगला — Phase 2b**: लग्न-चार्ट drawing — उत्तर/दक्षिण बटन, लाल cusp अंक+डिग्री, '#' वक्री, centre panel (नाम/आयु/नक्षत्र-पद/तिथि/योग + MERCURY<>SATURN label), page में जोड़ना + tests।

### 2026-10-07 — BNN Phase 2a सत्यापित (user screenshots) (`1486825`)
- User ने अपने software के 2 screenshots भेजे: details screen में **lat 21.4833 / lon 78.25, जन्म 20:30:00, GMT 5.5** (Ref 58); outer face = हमारा लक्ष्य UI।
- पहेली हल: बचा offset = **+50.6s = ΔT(1980)** → पुराना software **भाव-संधियाँ UT+ΔT** पर बनाता है। अब: **संधियाँ ≤0.7′, ग्रह ≤0.9′** — पूरा match ✓ (findings §3)।
- `kp.js`: `housesAtDeltaT: true` जुड़ा; test fixture exact coords पर; `docs/bnn-calib-findings.md` updated (+UI संदर्भ §5)।
- Screenshots (private ब्यौरा; repo में नहीं) → `.openclaw/tmp/bnn-ref/`; उनकी tables/transit अंक आगे के phases के test-डेटा।
- **421 ✓**। Token: इस Phase-2a काम में कुल ≈ 1061 (wallet 25071 → 24010)।
- **अगला — Phase 2b**: वही शक्ल का चार्ट drawing (south grid + लाल cusp + centre panel + MERCURY<>SATURN + उत्तर/दक्षिण toggle)।

### 2026-10-07 — BNN Phase 2b: चार्ट drawing (`acb05d2`)
- `render.js` असली drawing: दक्षिण grid + उत्तर diamond; लाल cusp अंक ("09 11.31"), ग्रह 3-अक्षर codes ("MAR# 21.30"; मिनट TRUNCATE), ASC marker, centre panel (नाम/जगह/तारीख़+वार/AGE Y-M-D/नक्षत्र-3/तिथि/योग), MERCURY<>SATURN box; submit → चार्ट + उत्तर/दक्षिण toggle।
- Display parity: मिनट truncate + भाव-संधि +0.5s fine-tune → चार्ट का हर visible अंक पुराने face से अक्षरशः same (`scripts/bnn-calib/chart-texts.mjs`; test में pinned)।
- Preflight: headless-Chrome से असली rendered चार्ट जाँचा ✓।
- Tests **427 ✓** (नए: render 4, page +1, kp display-parity +1)।
- Token: wallet 24010 → ~23762 (Δ ≈ 250)।
- **Push → CI → live: https://kundli.mybapuji.com/bnn/** (noindex; launch पर index + sitemap + nav links)।
- **अगला — Phase 3**: PRSSS / BRSSS chains।

### 2026-10-07 — BNN Phase 3: PRSSS / BRSSS (`e546321`)
- `src/bnn/prsss.js` असली: पाँच स्तर (राशि स्वामी → नक्षत्र → उप → उप-उप → उप-उप-उप; विंशोत्तरी अनुपात 7/20/6/10/7/18/16/19/17, exact fractions); PRSSS = ग्रह की अपनी longitude से, BRSSS = भाव-संधि से।
- Verification (`scripts/bnn-calib/prsss-check.mjs`): **PRSSS 9/9 · BRSSS 11/11 — पाँचों levels PASS (L5 भी!)**।
- **B11 (guide: "मेल नहीं खाती")**: नियम से हमारा मान = `mercury, rahu, mercury, rahu, rahu` — report-only रखा, force नहीं किया; guru से पूछना बाक़ी।
- Tests: `tests/bnn-prsss.test.js` (4 नए)। कुल **431 ✓**।
- **अगला — Phase 4**: Combination engine (R1–R7: zones/order/aspects/parivartana BP-AP, Astronomy column)।

### 2026-10-07 — BNN Phase 4: Combination engine (R1–R7) (`505957c`)
- `combos.js` असली: directions/zones (1-5-7-9; Ra-Ke 1-5-9 + 7वें-zone का skip), order keys (Q−P)/(P−Q) mod 30, Mars 4/8 + Saturn 3/10 aspects, **parivartana BP/AP seat swap**, Astronomy column; `percent.js` (R11 formulas) भी अब असली।
- **Aspect नियम की खोज (reference से)**: aspect entries सिर्फ़ तब जुड़ते हैं जब ग्रह उसकी influence zone **[बिंदु −30°, +2°]** में हो (guide के "zone" शब्द का सटीक अर्थ)।
- **Verification (`scripts/bnn-calib/combos-check.mjs`): 51/51 PASS** — AP planet+bhava (guide भाग 5) · BP planet+bhava list159 + ASTRONOMY (user screenshots) — सब match ✓।
- **Screenshots-verification (user, 2026-10-07)**: PRSSS 9/9 (छिपा 3rd level भी 'VEN' निकला ✓) · BRSSS 12/12 (B11 = MER,RAH,MER,RAH,RAH — पुरानी "B11 मेल नहीं खाती" शंका हल ✓)।
- **Report-only खुले मुद्दे**: पुराना software ~1° पीछे बैठे ग्रह को भी जोड़ता है (AP: SAT row में SUN-97; BP: MER row में SUN) — guide कहती है implement न करें, केवल report — वैसा ही रखा।
- **Display order (user, Phase 5 के लिए)**: bhava tabs `[1-5-9 | 1-5-7-9 | BRSSS | SPECIAL]`; planet tabs `[1-5-7-9 | 1-5-9 | SPECIAL | 3-11 | 10 | PRSSS | ASTRONOMY]` — 3-11/10 guide R8 से नहीं बनाएँगे (सॉफ्टवेयर में ख़ाली हैं)।
- Tests: `tests/bnn-combos.test.js` (10 नए) — कुल **441 ✓**।
- Token: wallet 23148 → 22319 (Δ ≈ 829; गहरी screenshot-verification)।
- **अगला — Phase 5**: Percentages (R11, हो चुका — रिपोर्ट/रंग बाक़ी) + Lordship/SPECIAL (R13) + पूरी tables पेज पर (Planet/Bhava संयोजन tabs)।

### 2026-10-07 — BNN Phase 4b: 159/1579 split + नए screenshots verification (`ec54fe9`)
- User के नए 4 screenshots (planet & bhava × NAT159/NAT1579) से पुष्टि: **159 = सिर्फ़ 1-5-9-zone members (7th-zone हटाकर)**; 1579 = पूरा (1-5-7-9)। **आख़िरी column = astronomy = "progression में पहले मिलने वाला ग्रह"** — यह पहले से सही था (सब 9 ✓)।
- Duplicate cells (जैसे JUP-159 में RAH दो बार, VEN-row में MOO-8 दो बार, B02 में SAT10-6 दो बार) = user-घोषित software bugs → हमारा output साफ़ (dedup)।
- `combos.js`: `planetCombinations` अब per planet **`{ list159, list1579 }`** देता है। `combos-check`: **59/59 PASS**। Tests **441 ✓**।
- खुले note: MER row में mixed-seat quirks (SUN-97 class) वैसे ही report-only; screenshot के B02/B07 में bug-cells।
- ❓ User से पूछा (reply में): labels के साथ के **-91 / -95 / -18 जैसे अंक** किस चीज़ के हैं? (Phase 5 table display के लिए चाहिए।)
- Token: wallet 22319 → 22210 (Δ ≈ 109)।

### 2026-10-07 — BNN Phase 5: पूरी Combination tables पेज पर (`56ef906`)
- **`-NN` suffix का रहस्य हल (user की बात सही)**: label पर का अंक = ग्रह की अपने भाव से closeness, **बिना 0.942 गुणांक**: `100 × (1 − d/W)` — 9/9 exactly (JUP 91, SUN 18, MOO 95, MAR 69, MER 15, VEN 95, SAT 27, RAH 20, KET 20) ✓ → tables में लगा दिया।
- **SPECIAL engine (R13)**: Director (भाव-अनुसार), owns/sits→gives, star lord + star-gives, 'IN STAR OF A' — guide के AP expectations से **36/36 PASS** (`scripts/bnn-calib/special-check.mjs`)।
- **Tables UI पेज पर**: PLANET COMBINATION (1-5-7-9 · 1-5-9 · SPECIAL · PRSSS · ASTRONOMY + label suffix) और BHAVA COMBINATION (1-5-9 · 1-5-7-9 · BRSSS · SPECIAL: Director/IN STAR OF A) — R17 रंग (🔵/🟢/🟠, Saturn-always-green), legend, **BP/AP toggle** (आयु 30+ → default AP) + exchange label अब "AFTER/BEFORE PARIVARDHANAI (AP/BP)"।
- Tests **443 ✓** (page tables + BP/AP toggle सहित)। Headless-Chrome से असली render जाँचा ✓ (screenshot)।
- Token: wallet 22210 → 21657 (Δ ≈ 553; इस phase का UI+verification काम)।
- **अगला — Phase 6**: विंशोत्तरी दशा/भुक्ति/अंतर (disposal dates + ages; 366/364-दिन वर्ष settings)।

### 2026-10-07 — BNN पेज अब menu में (user request) (`285d6ea`)
- चारों पेजों के top nav में **"BNN चार्ट"** link जोड़ा — user को पेज live दिख नहीं रहा था (menu link नहीं था; browser 10-मिनट cache भी)। `match.test.js` nav update (4 links)। Tests **443 ✓**; live JS में link present ✓।

### 2026-10-07 — BNN corrections (user screenshots) (`e1c22a4`)
- **भाव table पहले, planet table बाद में** (order swap)।
- **159/1579/SPECIAL/PRSSS अब tabs** (एक साथ columns नहीं): bhava tabs [1-5-9, 1-5-7-9, BRSSS, SPECIAL]; planet tabs [1-5-7-9, 1-5-9, SPECIAL, PRSSS]।
- **"ASTRONOMY" शब्द पूरी तरह हटाया** — progression column बिना header (pink), legend से भी हटाया। Software का Astronomy tab नहीं बनाते (guide R8)।
- **-NN labels अब seat-based**: AP में MER-27, SAT#-15; BP में MER-15, SAT#-27 — दोनों modes verified (special-check अब **45/45**)।
- Tests **444 ✓**; live ✓ (menu link सहित, `kundli.mybapuji.com` → "BNN चार्ट")।
- ❓ User से पूछा: SAT# की 1-5-7-9 पंक्ति में SUN (~97%) — software दिखाता है; guide कहती थी "implement न करें" — दिखाना है या नहीं? (जवाब पर अगला कदम।)
- **अगला — Phase 6** (user की पुष्टि के बाद): दशा/भुक्ति/अंतर।

### 2026-10-07 — BNN corrections-2: progression column + गुरुजी का परिवर्तन-नियम
- **Progression planet अब हमेशा 9वें column में** — fixed frame: label + 7 combo slots + progression;
  1-5-7-9 और 1-5-9 दोनों tabs में एक-सी शक्ल (old software जैसी 9-column)। पहले user ने "8वें",
  फिर "9वें ज़्यादा अच्छा" कहा — वही लागू (arrows-screenshots 06:45/07:09 के मुताबिक)।
- **SUN-97 का जवाब मिला + लागू (गुरुजी नियम)**: परिवर्तन वाले ग्रह की कुर्सी-डिग्री से **1° के भीतर
  पीछे (उल्टी दिशा)** बैठा ग्रह combination में जुड़ता है → **AP में SAT# row = SUN-97 | KET-8**,
  **BP में MER row = SUN-97 | KET-8** — दोनों old software से exactly मेल (percent भाव-सूत्र से = 97)।
  `combos.js` → `COMBO_SETTINGS.returnedCatchDeg = 1.0`। (`combos-check`: 59/59 + catch ✅✅)
- Report-only बाक़ी: BP-1579 MER row के extra cells VEN-37/RAH-15 (159 में SAT10-18) — नियम अभी नहीं मिला।
- User के browser में labels −1 (पुराना cache) दिख रहा था — live/server सही; hard refresh से ठीक।

### 2026-10-07 — BNN Phase 6: दशा / भुक्ति / अंतर
- **दशा-अंशांकन**: पुराना software दशा **UT+ΔT** वाले चंद्र से चलाता है (जैसे भाव-संधियाँ) — इसी से
  पहली दशा-अंत 23-12-1985 exactly आती है (plain UT: 28-12-1985)। `src/bnn/dasha.js` असली — balance,
  महादशा 9 अंत-तिथियाँ+आयु, भुक्ति (366-दिन) और अंतर (भुक्ति × a/120; आख़िरी = भुक्ति-अंत)।
- **`scripts/bnn-calib/dasha-check.mjs`: 27/27 PASS** — महादशा 9/9 · भुक्ति 9/9 · अंतर 9/9 (guide भाग 5;
  "RAH कटी" पंक्ति हमारे पास = 04-01-2028)। Findings doc §6-7।
- UI: नया section **"VIMSHOTTARI — DHASA / BHUKTHI / ANDHIRAM"** (tabs; चल रही पंक्ति पीली);
  centre panel में अब **"VEN DHASA: 23-12-2009 -> 23-12-2029"** + **"MER BHUKTI: 04-01-2026 -> 06-11-2028"** ✓।
- Tests **445 → 451 ✓**; headless-Chrome से असली render जाँचा ✓ (SUN-97, 9-column, दशा tables सब मौजूद)।
- Token: wallet 19593 (session शुरुआत) → 18241; Δ ≈ 1350 (corrections-2 + Phase 6 साथ में)।
- **अगला — Phase 7**: गोचर (chart के बाहर + गोचर लग्न; reference 30-09-2026) और Phase 7b PCP।

### 2026-10-07 — BNN correction-3: SPECIAL (भाव) tab अब sir के software जैसा
- User (screenshots 08:01/08:07): भाव-वाले SPECIAL tab की शक्ल बदलनी थी — columns अब: **LORD**
  (भाव का स्वामी) · **PLANETS(A)** (भाव में बैठे ग्रह; cusp के सबसे पास वाला पहले; # = वक्री) ·
  **IN STAR OF A** · **LORDSHIP** (= पहले का "Director" — भाव का फल देने वाला ग्रह)।
  पहले हमारे पास सिर्फ़ [Director | IN STAR OF A] था।
- **IN STAR OF A decode** (user ने पूछा था): जिन ग्रहों का **नक्षत्र-स्वामी** भाव के किसी बैठे ग्रह A में
  हो (भाव खाली → A = भाव-स्वामी)। हमारे numbers sir के software से पहले से exactly मेल खाते थे ✓।
- Verification: `special-check` **45 → 69 ✓** (+12 LORD, +12 PLANETS(A) — sir के screenshot से);
  असली browser render की पूरी 12-row तालिका sir के software से अक्षरशः मेल ✓; tests **451 ✓**।
- **अगला — Phase 7**: गोचर (transit) + PCP — user की "आगे बढ़ो" पर।

### 2026-10-07 — BNN correction-4: planet SPECIAL में LORDSHIP अलग column
- User (screenshot 08:16): planet combination का SPECIAL tab — star के फल वाला हिस्सा पहले
  ★ star cell में मिला हुआ था ("★ VEN-7 → 3,7,10")। अब **अलग columns**: [Lord | sits → gives |
  **STAR** | **LORDSHIP**] — जैसे JUP: `5,8 | 01 → 1,5 | VEN - 7 | 3,7,10` (sir के software से मेल)।
- असली browser render से जाँचा ✓; tests **451 ✓**।
- **अगला — Phase 7**: गोचर (transit) + PCP।

### 2026-10-07 — BNN Phase 7: गोचर (transit) ring
- चार्ट के चारों ओर **गोचर के ग्रह + गोचर लग्न** — पुराने face की तरह अपनी राशि के किनारे (बाएँ/
  दाएँ/ऊपर/नीचे), degree.mm के साथ, वक्री पर #, गहरे-मैरून रंग में। नीचे पट्टी: **गोचर समय**
  (default अभी) + "अभी" बटन + गोचर स्थान; समय बदलते ही ring अपने-आप बदलता है। दोनों styles में।
- अंशांकन (findings §8): transit = **UT+ΔT(+0.5s)** (भाव-संधि जैसा); बाहर के अंक **round** होते हैं
  ("ASC 28.01" सबूत), अंदर का text truncate ही रहता है।
- **`transit-check.mjs`: 20/20 PASS** — ① guide भाग 5 (01-10-2026 ≈12:16, सब ≤0.63′) ② outer-face
  screenshot (07-10-2026 04:40:03) — SAT# 16.52, MAR 10.53, JUP 26.24, VEN# 13.59, MER 13.56,
  SUN 19.28, MOO 03.39, ASC 28.01 exact; RAH/KET में ~0.6′ node-model अंतर (नोट)।
- Tests **451 → 456 ✓**; headless render में ring जाँचा ✓।
- **अगला — Phase 7b**: PCP (विशेष गोचर)।

### 2026-10-07 — BNN corrections-5: उत्तर चार्ट overlap + लग्न-चिह्न + Printing output (PDF)
- **उत्तर भारतीय चार्ट**: भाव-नाम व ग्रह centre-square में घुस रहे थे → अब हर block panel से टकराते ही
  सबसे छोटी दिशा में बाहर खिसक जाता है (चारों दिशाओं के लिए जाँच ✓, user का screenshot).
- **दक्षिणी चार्ट**: लग्न वाले खाने के **ऊपर-बाएँ कोने में दो छोटे आड़े डंडे** — चार्ट देखते ही लग्न पहचान
  आता है (ASC text पहले जैसा)।
- **Printing output**: नया बटन **"🖨️ प्रिंट / PDF बनाएँ"** (`src/bnn/print.js` + @media-print CSS) — 5-page A4:
  ① हरि ॐ · नाम · मंत्र (ॐ ऐं ह्रीं श्रीं क्लीं चामुण्डायै विच्चे नमः) · info@mybapuji.com · mybapuji.com;
  बाएँ **गणपति**, दाएँ **माँ सरस्वती** (AI-निर्मित, transparent PNG ~35KB); BASIC DETAILS + चार्ट |
  ② combination + दोनों SPECIAL टेबल | ③-④ PRSSS/BRSSS + DHASA + सारी 81 भुक्तियाँ + ANDHIRAM; हर पेज पर
  mybapuji.com footer। (sample से सिर्फ़ structure लिया — design/नाम/टेबल शैली हमारी अपनी, copy नहीं।)
- **पहली (आंशिक) दशा की भुक्तियाँ** (sample खोज): SAT block = शुरू की 6 ख़ाली rows + [MAR 01-08-1980,
  RAH 10-06-1983, JUP 23-12-1985]; sample में [12-08-1980, 21-06-1983] (~11 दिन का अंतर = उनका internal
  scale; बाक़ी सब blocks exactly: MER 22-05-1988 ✓ …)। `dasha.js` bhukthiList अब यही structure देता है।
- Tests **456 → 462 ✓**; headless `--print-to-pdf` से पूरा 5-page output जाँचा ✓; dist ≈ 3.3 MiB (2 images +).
- **जवाब**: बाक़ी phases = 7b PCP (Windows के समय) · 8 Verification (और कुंडलियाँ) · 9 Final launch।

### 2026-10-07 — BNN corrections-6: बड़े charts + लग्न-डंडे (तिरछे) + All Chart PNG + buttons bottom में
- **चार्ट बड़े**: स्क्रीन पर chart-box 420 → **620px** (दोनों styles — ग्रह आराम से पढ़े जाते हैं);
  print/PDF में चार्ट **94mm → 122mm** (brochure वाली पढ़ने की दिक्कत हल)।
- **लग्न-चिह्न** (user का annotated sample): लग्न वाले खाने के **ऊपर-दाएँ कोने पर दो समानांतर तिरछी
  लकीरें** — पहले वाले आड़े डंडे हटा दिए।
- **Action buttons अब page के bottom में** (सारी तालिकाओं के बाद): [🖨️ प्रिंट / PDF] + नया
  **[📄 ऑल चार्ट (PNG)]**।
- **ऑल चार्ट (`src/bnn/allchart.js`)**: click पर wide PNG (1680×1080, 2× scale) — बाएँ वही चार्ट जो
  user देख रहा है (style + गोचर ring सहित), दाएँ **जो दो tabs अभी खुले हैं** (भाव + ग्रह — tab बदलते
  ही export में भी वही; tab keys main.js के values.bnnBhavaTab/bnnPlanetTab में दर्ज होती हैं), नीचे
  **चल रही दशा-भुक्ति-अंतर** strip। SVG → canvas → PNG download; headless में पूरा output देखा ✓।
- Tests **462 → 466 ✓**; live deploy ✓।

### 2026-10-07 — BNN corrections-7: परिवर्तन-box + print के बड़े/रंगीन tables + भाव पहले
- **परिवर्तन box** (screen + print + ऑल-चार्ट सब में — user के sample मुताबिक): जब ग्रह-परिवर्तन हो,
  चार्ट के **ऊपर-बाएँ कोने पर छोटा box** — "MERCURY<>SATURN" जैसी जोड़ी 2 पंक्तियों में; चार्ट खोलते ही
  नज़र आता है (`render.js` → `drawExchangeBox`; margin अब परिवर्तन होने पर भी खुलता है; परिवर्तन न हो तो
  box नहीं)।
- **Print PDF**: ① चार्ट **122 → 175mm** (net ग्रिड ~129mm) ② सारी tables **font 9.5 → 12.5px**, cells
  मोटी (padding 3×7), headings 13.5px ③ combination tables अब **रंगीन** (blue/green/orange/pink —
  web जैसी) ④ क्रम: **BHAVA पहले, फिर PLANET** (combo व special — दोनों जोड़े bhava-first) ⑤ ज़रूरत से
  ज़्यादा page-break हटाया — अब 5 pages, बिना आधा-खाली पेज।
- Tests **466 ✓**; print (5-page) · screen · ऑल-चार्ट — तीनों headless में जाँचे ✓।

### 2026-10-07 — BNN corrections-8: bottom में किताबें+affiliate, BNN FAQ, SEO (free), नए legends
- **पेज के bottom में** (मिलान/पंचांग जैसा): **BNN FAQ** (5 प्रश्न — BNN क्या है (Gemini School of
  Astrology की BNN class + Selvam sir व श्री सुलूर गोस्वामी सर द्वारा हज़ारों कुंडलियों की research से
  विकसित सिद्धांत), free/बिना साइन-अप, क्या-क्या मिलता है, भावचलित KP New, PDF/PNG download) +
  "ज्योतिष संबंधित किताबें मुफ़्त Download" (7 कार्ड + 2 chips) + "Sponsored — आपके लिए चुनी किताबें"
  (6 Amazon links, tag=krishna220af-21) + Free tool chips।
- **SEO**: title/description/keywords में "free"; robots अब **index, follow** (निर्माणाधीन हटाया);
  OG tags; JSON-LD (WebApplication + FAQPage); **sitemap.xml में /bnn/ जोड़ा**; nav link अब
  **"Free BNN चार्ट"** (चारों पेजों में)। ⚠️ बाक़ी: GSC में /bnn/ submit करना (user)।
- **Legends** (दोनों combination तालिकाएँ): ● भाव / ● केन्द्रीय ग्रह (dark brown = row-label रंग) ·
  ● मुख्य ग्रह · ● उपग्रह · ● अल्प बलशाली ग्रह — पुरानी लंबी व्याख्या + pink item हटाए।
- Tests **466 → 469 ✓**; bottom + legends headless में जाँचे ✓।

### 2026-10-07 — BNN corrections-9 (user 11:34): FAQ बिना नाम + All Chart की tables बड़ी
- **FAQ text** (visible + JSON-LD दोनों): पुराना text — जिसमें Gemini School/Selvam sir/सुलूर गोस्वामी सर के नाम थे
  (वे सिर्फ़ search-hint थे) — हटा। अब internet-research आधारित सामान्य विवरण: BNN = प्राचीन नाड़ी-परंपरा
  से जुड़ी चार्ट-आधारित पद्धति; नाम महर्षि भृगु–नंदी परंपरा से; फलादेश ग्रहों की राशि-डिग्री + संयोजन/
  त्रिकोण जैसे ग्रह-संबंधों से। किसी व्यक्ति/class का ज़िक्र नहीं (seo.test में guard जुड़ा)।
- **All Chart PNG**: दोनों combination tables बड़ी — font 14→16, rowH 25.5→31, columns दाईं जगह भरते हुए
  चौड़े (bhava ≈798px, planet ≈800px; पहले 578/688) — "Right-hand side" की ख़ाली जगह इस्तेमाल; बाएँ चार्ट
  यथावत (user ने कहा वह ठीक है)। `tests/bnn-allchart.test.js` में size-assertions जुड़ीं।
- **अंक-जाँच नोट**: user के screenshot वाले values हर जगह 1 कम थे — जाँच का नतीजा: वह उनके browser के
  पुराने version से था; fresh live load == हमारे numbers (calibration 69/69 · 59/59 pass)। Reply में
  hard-refresh (⌘+Shift+R) की सलाह दी।
- Tests **469 → 471 ✓**; headless export + FAQ verify ✓।

### 2026-10-07 — BNN: AI-handover pack (desktop conversion) + skill update (user request)
- **`docs/bnn-ai-handover.md`** (नया, ≈31KB): user चाहते हैं कि कोई भी AI tool इसे पढ़कर BNN को desktop software
  में convert कर सके। अंदर: §0 उपयोग · §1 product summary · §2 implementation + module-map · §3 पूरा computation
  spec (ayanamsa mode 44, UT+ΔT+0.5s, zones/aspects/parivartana/returned-catch, 159/1579, percent constants,
  colours, PRSSS/BRSSS, SPECIAL, dasha/andhiram formulas, transit, display/print/PNG conventions) · §4 constants ·
  §5 सारे acceptance vectors (AP/BP तालिकाएँ, PRSSS/BRSSS, दशा 27/27, transit) · §6 खुले मुद्दे · §7 desktop routes
  (Tauri/Electron vs native + checklist) · Appendix A ready-to-paste prompt।
- **ZIP pack** `BNN-AI-Handover-Pack_2026-10-07.zip` (doc + src + tests + scripts/bnn-calib + docs + NOTES;
  ≈409KB) — workspace root व Desktop पर delivery के लिए; repo में नहीं (snapshot)।
- **Skill update प्रस्ताव** `mybapuji-kundli-20261007-35742f5eb7` (pending) — BNN section §7 + module map +
  checks + desktop-handover pointers जोड़े (skill_workshop से)।
- Repo में कोई गणना-बदलाव नहीं (सिर्फ़ doc + notes); tests 471 ✓।

### 2026-10-07 — PCP प्रथम अवलोकन (Gemini software — Parallels VM में)
- User ने दिखाया कि Windows VM में PCP वाला option है ("उसे command में समझा नहीं पाऊँगा")। मैंने Parallels `prlctl capture` + keyboard-events से स्क्रीन देखी और ख़ुद एक search (Find) चलाया।
- नतीजे/सुराग पूरे लिखे: `docs/bnn-calib-findings.md` §9 (End = ग्रह-डिग्री +1°, rows की chaining, खुले मुद्दे)।
- अगला: गुरु/शनि वाला test + tabs + 159/1579 का चुनाव ढूँढना, फिर **display-रणनीति** user के साथ तय करना।

### 2026-10-07 — PCP दूसरा दौर: user ने MARS/1579/Saturn-Guru setup दिया — मैंने पढ़ा
- Software में labels का रहस्य खुला (MAR-k = motion-direction में स्थिति); direct window ≈ [N−5°, N+1°]; 1579/159 radio मिल गया।
- पूरा ब्यौरा + दोनों tables के सारे rows: `docs/bnn-calib-findings.md` §10।
- अगला कदम: **display-रणनीति** user के साथ तय करना (कैसे /bnn/ पर दिखाएँ) — reply में विकल्प भेजे।

### 2026-10-07 — PCP तीसरा दौर: Mercury@159 पढ़ा + label-नियम हल + 1579-test pending
- **Label नियम पूरा हल**: k = जन्म-ग्रह की स्थिति, गोचर-ग्रह की (segment के अंत वाली) राशि से, चाल की दिशा में गिनकर (direct=आगे, retro=पीछे) — ~30 rows verified।
- End ≈ "डिग्री +1°" या station; starts का exact margin अभी open (hh:mm या guru-rules चाहिए)।
- Bonus: main window verified (dasha ages/BRSSS/old tabs मेल)।
- ⚠️ मेरे keys से END DATE 07→04-01-2033 हुआ था — user से वापस कराना + ●1579 करके Find कराना (reply में लिखा)। पूरा ब्यौरा findings §11।

### 2026-10-07 — PCP: 159 vs 1579 पहली तुलना (Mercury)
- Live screen से निकाला: 1579 = 159 + `MER-7 16-07-2026→20-07-2026` − `MER-9 11-02-2029→14-06-2029`; Saturn दोनों में समान।
- MER-7 की degree-window भी जाँची (कर्क 9.19→10.07 = वही ~[+0.25°, +1°] पैटर्न)। पूरा ब्यौरा findings §12।

### 2026-10-07 — BNN Phase 7b: स्पेशल ट्रांज़िट (Special Transit) LIVE
- इंजन + UI + tests: **engine 15/15 vs legacy मंगल तालिका** (pcp-check.mjs); page के bottom में section (tabs/g्रह/1579-159/dates/खोजें/per-planet tables/प्रिंट); headless verify ✓; **477 tests ✓**।
- बाक़ी: start-margin के guru-confirm + छोटी polish। विवरण findings §13।

### 2026-10-07 — PCP: सूर्य-कुंडली से तुलना — start-margin chart-दर-chart अलग (मंगल −5°, सूर्य −3.85°, बुध +0.15°)
- End-नियम सब जगह ✓; start-rule पकड़ में नहीं आया — guru से पूछने का सटीक सवाल तैयार (findings §14)। Reply भेजा।

### 2026-10-07 — PCP: 🎯 start-lead = हर ग्रह का तय अंक (मंगल 5°, शुक्र 6°, सूर्य 3.86°, बुध 0.15°)
- Owner के hint से पकड़ा; engine में लगाया + validation 19/23 (मंगल 15/15)। बाक़ी 4 = dip/station बारीक़ियाँ। बाक़ी 5 ग्रहों के tests user से माँगे। findings §15।

### 2026-10-07 — PCP: पाँचों ग्रहों के leads मिले + engine update (validation 27/51)
- feeds: चंद्र 2.44/8.29 · गुरु 0.17/5.4 · शनि 0.89/10.75 · राहु 14.42/10.4 · केतु 13.94 (गु/श)। बाक़ी = वक्री-टुकड़ों की structure। findings §16।

### 2026-10-07 — BNN का GSC submit हो गया + mybapuji.com के 403 मुद्दे पर काम (user request)
- **kundli property** (URL-prefix "https://kundli.mybapuji.com/"): `/bnn/` पर URL Inspection → **Request indexing ✓** ("URL was added to a priority crawl queue"); `sitemap.xml` **resubmit ✓** (row: Submitted Oct 7 · Success; अगली read पर /bnn/ के साथ discovered 3→4)।
- पेज पहले से तैयार था (index,follow + sitemap में /bnn/ + चारों pages के nav links — corrections-8); सिर्फ़ GSC submit बाक़ी था — अब पूरा। → BNN का launch-side SEO काम शेष नहीं।
- साथ में: **mybapuji.com (मुख्य साइट) के "Blocked due to 403" (3,378 पेज) पर GSC VALIDATE FIX चालू** — पूरी जाँच/रिपोर्ट: `mybapuji-audit/gsc-403-and-bnn-2026-10-07.md`।

### 2026-10-08 — BNN दृष्टि-% की गुत्थी हल (Gudiya चार्ट जाँच) — `combos.js` fix + tests
- user (screenshots): नया चार्ट **"gudiya"** (08-11-1991 10:45:50, Raisen) पर **B01 का MAR4 (3 vs 0)** और **B05 का MAR8 (4 vs 28)** guru-software से मेल नहीं खा रहा था।
- **जाँच `scripts/bnn-calib/gudiya-check.mjs`** (special-check जैसा; AP+BP): पकड़ा कि गड़बड़ी `combos.js` के **भाव-पंक्ति के aspect loop** में — वह दृष्टि-बिंदु का % ग्रह वाले सूत्र `100×(1 − d/(0.942×W))` से गिन रहा था।
- **सही नियम (दो चार्ट से verified)**: दृष्टि-बिंदु की closeness = **100×(1 − d/30)** — fixed 30° span; और **d ≥ 30° हो तो entry दिखती ही नहीं** (B01 का MAR4-फ़ैंटम ख़त्म; पहले "MAR4--3" जैसा ऋणात्मक बन रहा था)।
- नतीजे — पुराना चार्ट: MAR4-**71**, MAR8-**65**, **SAT3-13, SAT10-6** चारों **exact** (SAT3/SAT10 = guide के पुराने "अभी मेल नहीं खाते" open items, अब हल)। Gudiya: MAR4 हटा ✓, MAR8 4→**27** (guru 28, Δ1 शेष), SAT3-**72** ✓, SAT10-**82** ✓।
- Files: `percent.js` (+`aspectToBhavaPercent`, `aspectSpanDeg:30`) · `combos.js` (aspect loop) · `tests/bnn-combos.test.js` (2 नए: synthetic 30°-span + guide values) · `tests/bnn-modules.test.js` · नया check script। **टेस्ट 479 ✓**।
- बाक़ी: Gudiya MAR8 का ±1 (हम 27, guru 28 — rounding/time-स्तर; असली software पर दोबारा देखकर confirm करना)। ध्यान: user की screenshot-A हमारे app के **10:45:00** वाले run जैसी है (birth time 10:45:50 है), check इसलिए 10:45:50 पर।
- **push हो गया (live)** — user ने "अपना software update कर दो" कहा; CI run 37733347742 ✓ (aspect fix LIVE)।

### 2026-10-08 — BNN: स्पेशल ट्रांज़िट section अब अपने पूरे घेरे में + बड़े अक्षर (user request 11:07)
- user: पेज के bottom का Special Transit मिल-जुला व छोटे अक्षरों में लग रहा था → पूरे section (title→results) को अपना बॉर्डर-बॉक्स दिया: `1.5px #d9a95f`, radius 14, हल्का क्रीम bg `#fffcf4`, padding; अक्षर बड़े — title 0.95→**1.05**, intro 0.85→**0.95** (गहरा रंग #5c4a24), rows 0.85→**0.92**, chips 0.82→**0.88**, TRANSIT-chip 0.85→**0.9**, st-table 0.78→**0.82**।
- जाँच: headless-Chrome preview (desktop 900 + mobile 430) — घेरा पूरा section घेरता है, अलग दिखता है ✓।

### 2026-10-08 — BNN: लड़की की कुंडली में Venus top (PLANET-tabs) + progression-legend (user request 13:06)
- user: BNN नियम — गुरु = जीव कारक (लड़की की कुंडली में **वीनस**), लग्न जैसा अध्ययन → **Planet Combination की चारों tabs (1-5-7-9 · 1-5-9 · SPECIAL · PRSSS) में लड़की = Venus top, Jupiter 6वें स्थान पर** (दोनों की जगह बदली); लड़के = पहले जैसा। साझा helper `planetRowOrder(gender)` (render.js) — screen + print + allchart PNG तीनों जगह लगा।
- legend: planet table के नीचे 5वाँ item — progression-partner column के रंग (#8e24aa) का डॉट + **'प्रगति का प्रथम ग्रह' / 'Progression first planet'**।
- tests: +2 (planetRowOrder unit + female DOM flow) — **481 ✓**। headless preview (desktop+mobile) में VEN-top व 5-item legend जाँचा ✓।

### 2026-10-08 — BNN: गोचर-ring में लग्न नीला + दक्षिणी चार्ट के लग्न-डंडे box से match (user request 13:47)
- (1) गोचर (transit ring) में **ASC / लग्न अब अलग रंग — नीला #1565c0**; बाक़ी गोचर-ग्रह पहले जैसे dark red (#700000)। लग्न पहचान में आता है। दोनों शैलियों में (shared drawTransitRing)।
- (2) दक्षिणी चार्ट के लग्न-cell के **दो तिरछे डंडे दोबारा खींचे**: अब box वाला ही **रंग (#5a3410) व मोटाई (1.4)**, दोनों **parallel** और **border-to-border** (सिरे ठीक cell की top व right edge पर — पहले अंदर वाली डंडी border से अलग/मोटी थी और round-cap था); d = 22/30।
- tests update: lagna-mark invariants (endpoints बिल्कुल border पर, stroke/width = grid) + transit ASC fill नीला — **481 ✓**; headless chart-preview से visual जाँच ✓।

### 2026-10-08 — BNN: दृष्टि-अंक की चमक applied (4 · 8 · 3 · 10) — user ने Option B चुना (14:03–14:07)
- user: sample देखकर — "तीसरे number का option B सुंदर है — apply कर दो"; साथ में शर्त: चमक **सिर्फ़ अंकों (4·8·3·10) पर**, background/मुख्य रंग वैसे ही रहें।
- लागू: `render.js` entCell — aspect entries (MAR4/MAR8/SAT3/SAT10) में अंक `<span class="drishti-digit">` में; `style.css` — हर 1.5s टिमटिमाती सुनहरी चमक (per main colour: drishti-green/orange/blue keyframes), reduced-motion fallback। बाक़ी tables/print/PNG अछूते।
- test +1 (digit spans सिर्फ़ 4·8·3·10, सिर्फ़ aspect cells पर) — **482 ✓**; headless still (कुछ अंक चमक-क्षण में freeze करके) से visually जाँचा ✓।

### 2026-10-09 — BNN PCP: 🎯 Saturn·159 लंबी-range पूरा decode — 14/14 rows exact
- user: वक्री-hint ("सिर्फ़ वक्री ग्रह के लिए combination उल्टी दिशा में count") + नए screenshots
  (Saturn · 159 · 09-10-2026 → 09-10-2048) बनाम हमारा live output (10:06/10:08 वाले)।
- **पहली बार row-by-row exact मिलान: गुरु 9/9 + शनि 5/5 = 14/14** (पहले: [D→B] rows ग़ायब,
  शनि×शनि lead 0.89 ग़लत, शनि dips +10°40′ पर खुल रही थीं, 8 rows 1-दिन खिसकी)।
- **नए नियम code में**: (1) **rise rows [D→B]** (`−lead ≤ rvD < +1` → अगले +1° तक); (2) शनि leads:
  ×शनि **10.667**, ×गुरु **10.72**; (3) शनि dips अब **X ≈ +3.9 (zDeg+0.7)** पर — +10°40′-dips बंद;
  (4) गुरु **−1.02** mid line; (5) **display = crossing + 12h** की IST तारीख़ (clipped = edge)।
- Files: `src/bnn/pcp.js` · `src/bnn/pcp-ui.js` · `tests/bnn-pcp.test.js` (+4) · `scripts/bnn-calib/pcp-check.mjs`
  (नया SATURN-159 case); **tests 486 ✓** · **pcp-check score 27/51 → 47/65** (मंगल 15/15 · शनि 5/5 ·
  शनि-159 14/14)। ब्यौरा: `docs/bnn-calib-findings.md` §17 · `docs/pcp-research.md` v0.95।
- बाक़ी (अगले दौर): सूर्य/चंद्र के "D-से-शुरू" rows · राहु/केतु/बुध की structures (user से उनकी १५९
  tables माँगी) · 159-vs-1579 dip-अपवाद। **deploy: push origin main (CI)।**
