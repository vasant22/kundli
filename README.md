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

**Project complete (Phases 1–13)** — a full browser-only Vedic Kundli app, live at **kundli.mybapuji.com** (custom domain; HTTPS auto-provisions). Source: <https://github.com/vasant22/kundli>. Final report: [`docs/final-report.html`](./docs/final-report.html).
User-side remainders: the 10-chart reference validation ([`tests/VALIDATION.md`](./tests/VALIDATION.md)), linking the app from mybapuji.com, and cross-device checks.

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

## License

AGPL-3.0 — required because Swiss Ephemeris is AGPL. See [`LICENSE`](./LICENSE).

Calculations by [Swiss Ephemeris](https://www.astro.com/swisseph/) (Astrodienst AG), used under AGPL.
Geocoding by [Open-Meteo.com](https://open-meteo.com).
