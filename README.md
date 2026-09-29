# कुंडली / Kundli — Vedic Birth Chart Web App

Free, static, browser-only Vedic astrology (Kundli / जन्मपत्री) app for **mybapuji.com**.
All calculations run in the visitor's browser — **no backend, no database, no API keys, no tracking**.

| Item | Choice |
| --- | --- |
| Chart styles | North Indian & South Indian (toggle) |
| Language | Hindi (default) + English |
| Ayanamsa | Lahiri (sidereal), whole-sign houses |
| Ephemeris | Swiss Ephemeris via WebAssembly (`swisseph-wasm`, Moshier mode) |
| Place search | Open-Meteo Geocoding (free, no key) |
| License | AGPL-3.0 |

## Status

**Main app complete (Phases 1–13)** — a full browser-only Vedic Kundli app, live at **kundli.mybapuji.com** (custom domain; HTTPS auto-provisions). Source: <https://github.com/vasant22/kundli>. Final report: [`docs/final-report.html`](./docs/final-report.html).

**Kundli Matching (`/match/`) complete** — two-step form, Ashtakoot Guna Milan (36 points), Mangal Dosha, bilingual report with PNG/PDF export. Calibrated 100% against the reference calculators over 269 pairs; manual checklist: [`tests/MATCH_VALIDATION.md`](./tests/MATCH_VALIDATION.md).

User-side remainders: the 10-chart reference validation ([`tests/VALIDATION.md`](./tests/VALIDATION.md)), the matching checklist ([`tests/MATCH_VALIDATION.md`](./tests/MATCH_VALIDATION.md)), linking the app from mybapuji.com, and cross-device checks.

## Development

Requires Node.js 18+.

```bash
npm install      # install dependencies
npm run dev      # start dev server -> http://localhost:5173
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

> **Note:** opening `index.html` directly from disk (`file://...`) shows a blank page —
> the whole UI is rendered by JavaScript and must be served. Always view the app via
> `npm run dev` (or `npm run preview`) and open the printed local address.

## Deployment

The app deploys to **GitHub Pages** (custom domain `kundli.mybapuji.com`) via GitHub Actions — step-by-step in [`DEPLOY.md`](./DEPLOY.md).

## Contributing

Bug reports and pull requests are welcome — please open an issue or a PR on GitHub
(<https://github.com/basanthariom/kundli>).

For local development, Node.js 18+ is enough:

```bash
npm install
npm run dev    # dev server
npm test       # test suite
```

## Privacy

- All calculations run in the visitor's browser. Nothing is stored or sent — no analytics, no trackers, no cookies, no external scripts.
- The only network request is the optional **Open-Meteo** place search, and only when you press “Search / खोजें”.

## Accuracy & known differences

- Ephemeris: **Swiss Ephemeris 2.10.03** (compiled to WebAssembly in this repo; Moshier fallback is bundled). Sidereal mode: **Lahiri**; houses: **whole-sign**.
- `tests/accuracy.test.js` verifies six birth charts (lagna + every planet's rashi and longitude, ≤ 0.01°) against reference values generated with **pyswisseph 2.10.03** — regenerate them with `scripts/gen-fixtures.py`.
- Manual validation list (10 births to compare against a reference site by hand): see [`tests/VALIDATION.md`](./tests/VALIDATION.md).
- Known acceptable differences vs other websites:
  - **Rahu**: this app uses the **Mean node** by default (a True Node option exists); sites that default to True can differ by up to ~1°.
  - **Lahiri variants**: implementations differ by arcseconds–arcminutes; we follow Swiss Ephemeris' Lahiri.
  - **House display**: we show whole-sign houses; some sites use Placidus/KP cusps for a planet's “house” column. Planet rashis are unaffected.

## Kundli Matching — rules, calibration & known variations

The `/match/` page adds **Ashtakoot Guna Milan (36 points)** plus **Mangal Dosha** checks for two
people. Code: `src/match.js` (page), `src/ashtakoot.js` (all 8 kootas), `src/mangaldosha.js`,
`src/matchcard.js` (PNG scorecard).

Every lookup table was verified before coding and then **calibrated cell-by-cell against the
industry-standard reference calculators** (the AstroSage matchmaking tool as primary reference,
cross-checked against Saravali.de's classical "Maitreya" documentation and the open-source
PyJHora library). Result: **2152/2152 koota values and 269/269 totals match the reference across
269 test pairs** — see `tests/fixtures/ashtakoot-calibration.json`; the one-time verification
scripts are in `scripts/calib/` (see its README).

Known variations where published sources differ (we follow the reference implementation used for
calibration — adjust the noted spots if your tradition differs; each is commented in the code):

- **Varna** — Kshatriya→Vaishya→Shudra→Brahmin cycles through the signs (some books map by
  element only, swapping Air/Earth = Vaishya/Shudra).
- **Vashya** — 5×5 score table with half-sign splits for Dhanu/Makar; some published tables differ
  in a few cells (e.g. Chatushpada–Vanachara = 0, Manava–Jalachara = 0.5 here).
- **Tara** — each direction gives 1.5 unless its count ≡ 3/5/7 (mod 9); display names follow the
  same convention as the reference.
- **Gana** — asymmetric table (rows = groom, columns = bride); Saravali.de's published table reads
  transposed relative to the reference — we keep the reference orientation (verified 9/9 cells).
- **Graha Maitri** — the scale includes 0.5/1/3/4/5 values for enemy combinations (some sources
  use 0/1/2/3/4/5).
- **Bhakoot** — flat rule: 2/12, 5/9, 6/8 → 0, else 7. Classical "nivaran" cases (same lord or
  mutual-friend lords) are shown as an informational **note only** — the reference doesn't cancel
  the dosha either; flip this if your tradition cancels.
- **Nadi** — strict same-Nadi = 0; classical exceptions (e.g. same nakshatra, different pada) are
  **not** applied — flagged in code comments for review.
- **Mangal Dosha** — houses {1, 4, 7, 8, 12} counted from **both Lagna and Moon** (the reference
  does not count the 2nd house — verified with dedicated probe charts). Own-sign/exaltation and
  "both manglik" cancellations are surfaced as notes only.
- **Score bands** — below 18 not recommended · 18–24 average · 24–32 good · 32–36 excellent.

Manual hand-verification checklist for the user: [`tests/MATCH_VALIDATION.md`](./tests/MATCH_VALIDATION.md).

## पंचांग / Panchang — rules, calibration & how to verify

The Panchang feature (full page at `/panchang/`; homepage widget at `/panchang-widget/` for the
mybapuji.com iframe) shares the same Swiss-Ephemeris core. Formulas, sources and verification
procedures live in **docs/PANCHANG_FORMULAS.md**; the hand-check checklist is
**tests/PANCHANG_VALIDATION.md**.

- **Anchoring**: everything is computed at the place's sunrise (sidereal Lahiri). Tithi /
  Nakshatra / Yoga / Karana show the element(s) running from sunrise, end times in `HH:MM:SS`
  (extended `24+H` across midnight; “upto Full Night” when the first element ends past the next
  sunrise). The reference caps each limb at two entries — same here.
- **Samvat years**: Shaka & Kali flip on the first sunrise after the Chaitra new moon; **Vikram
  flips ~2 weeks earlier** — first sunrise after the Phalguna full moon (purnimanta Chaitra 1).
  Samvatsara name = 60-year cycle, `idx = (Shaka + 12) mod 60`.
- **Ritu** is reckoned on the **tropical (sayana) Sun** at sunrise, boundaries at 330°+60k — as
  the reference sites do.
- **Pravishte / Gate** (Bengali solar day-count): smooth count, Drik-verified on 2026–2027 edges.
  AstroSage diverges on two known cases (2026 Srabon “2”-repeat; 16–17 Jul 2027 glitch) — see
  docs/PANCHANG_FORMULAS.md §8.
- **Moon rise/set**: first event after the date's sunrise (next-day spills shown as `24+H`);
  disc = upper limb + refraction (matches AstroSage; Drik uses centre/no-refraction for the Moon
  and differs ~4 min by design — documented, not a bug).
- **Accepted variations**: element end times can differ from a given reference by up to ~3 min
  (Drik and AstroSage themselves differ ~3–4 min on some dates; our values sit within ~1 min of
  Drik). The 2025-03-29 Chatushpada→Naga karana change falls within ~1 min of sunrise — a given
  site may show one more/fewer entry that day.
- **Modern planets** (Uranus/Neptune/Pluto) are excluded by design (no role in classical Vedic
  astrology); a labelled note under the planets table says so.
- **Widget location** is fixed in `src/widget-location.js` (currently Mumbai); no geocoding ever
  runs for widget visitors.
- **Future additions** noted: multi-day (“next 7 days”) panchang table, festival/vrat
  highlighting, Choghadiya.

**Calibration record**: 63 New-Delhi dates vs AstroSage (all elements incl. end times), 12
city×date combos vs Drik Panchang (elements + 5 muhurat windows per city), muhurat tables checked
on all 7 weekdays against both sites, 4 Samvat-flip years verified (2024–2027). Run `npm test`.

## License

AGPL-3.0 — required because Swiss Ephemeris is AGPL. See [`LICENSE`](./LICENSE).

Calculations by [Swiss Ephemeris](https://www.astro.com/swisseph/) (Astrodienst AG), used under AGPL.
Geocoding by [Open-Meteo.com](https://open-meteo.com).
