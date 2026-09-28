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

**Phase 1 complete** — project scaffold, Swiss Ephemeris WASM loads in the browser, git repo initialised.
The full app is built in phases (see `NOTES.md`); UI, calculations, charts and tests follow in later phases.

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

## License

AGPL-3.0 — required because Swiss Ephemeris is AGPL. See [`LICENSE`](./LICENSE).

Calculations by [Swiss Ephemeris](https://www.astro.com/swisseph/) (Astrodienst AG), used under AGPL.
Geocoding by [Open-Meteo.com](https://open-meteo.com).
