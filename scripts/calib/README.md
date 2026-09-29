# scripts/calib — one-time verification helpers (not part of the app)

These scratch scripts were used (2026-09-29) to **verify every Ashtakoot lookup
table and the Mangal-Dosha rules against published sources and the standard
reference calculator** before/while implementing `src/ashtakoot.js` and
`src/mangaldosha.js`.

- `gen-births.mjs` — finds births (1995, Varanasi) with the Moon at chosen
  nakshatra/rashi positions, so specific koota cells can be exercised.
- `check.mjs` — drives the reference calculator's match form for a list of
  pairs and stores its per-koota points (`results.json`).
- `analyze.mjs` — compares collected results against the proposed tables.
- `gen-pairs2.mjs`, `pairs-batch2.json` — systematic coverage sets
  (full 14×14 Yoni matrix, 7×7 Graha-Maitri, Vashya/Varna probes).
- `build-yoni.mjs` / `build-fixtures.mjs` — regenerate the verified Yoni matrix
  and the test fixtures used by `tests/ashtakoot.test.js`.
- `manglik-check.mjs`, `mangal.json` — per-chart Mangal Dosha details
  (house positions from Lagna & Moon) used to calibrate `mangaldosha.js`.
- `gen-probes.mjs` — finds probe charts that pin down exact rule details
  (e.g. the 2nd house is not counted by the reference).

Result: **2152/2152 koota values and 269/269 totals** match the reference
calculator across all calibrated pairs (see `tests/fixtures/`).
These scripts hit the public reference site; they are kept for documentation
and reproducibility only — run them rarely and politely, if at all.
