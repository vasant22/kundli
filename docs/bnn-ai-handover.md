# Bhrigu Nandi Nadi (BNN) Chart — AI Handover Pack
### Complete project specification for converting the BNN chart tool into a desktop application

- **Document date:** 7 October 2026 · **Version:** v1.0 (matches web app: Phases 1–7 + corrections 1–9, 471 automated tests)
- **Live web app:** https://kundli.mybapuji.com/bnn/ · **Source code (public, master copy):** https://github.com/vasant22/kundli — BNN code under `src/bnn/`, requirements spec `docs/bnn-guide.txt`, calibration ledger `docs/bnn-calib-findings.md`, checks `scripts/bnn-calib/`, tests `tests/bnn-*.test.js`.
- **License:** AGPL-3.0 (see `LICENSE`). Ephemeris: Swiss Ephemeris (dual license — keep the credit/attribution).
- **Audience:** any coding AI tool or developer tasked with porting this tool to a Windows/macOS/Linux desktop application.

> **हिंदी में (छोटा परिचय):** यह दस्तावेज़ BNN चार्ट software (अभी वेब पर — kundli.mybapuji.com/bnn) का पूरा तकनीकी नक्शा है। इसे (और repo `github.com/vasant22/kundli` को, या साथ दी ZIP pack को) किसी भी coding AI tool — Claude, ChatGPT, Cursor, Codex — को देकर कहें: *"Convert this project into an offline desktop application"* (तैयार prompt नीचे Appendix A में है)। सारी गणना का हर नियम, हर स्थिरांक (constant) और सही-ग़लत जाँचने के नमूने (test vectors) यहीं दिए हैं। यह app: भावचलित (KP New) गणना — ayanamsa mode 44, भाव-संधियाँ UT+ΔT+0.5s — और सारे output पुराने software से ~1 कला (arcminute) तक मिलाए हुए हैं (जाँच-बही: `docs/bnn-calib-findings.md`)। किसी भी step के बाद test चलाएँ और Hindi/English में बताएँ।

---

## 0. How to use this pack

1. Hand **this document + the repo link** (or the accompanying ZIP) to any capable coding AI tool.
2. Suggested instruction: *"Read the BNN handover document and the source in `src/bnn/`. Convert this tool into an offline desktop application. Follow §3 rules exactly, keep constants from §4, and validate against §5 test vectors. §7 describes recommended conversion routes."*
3. **This document supersedes** the original requirements guide (`docs/bnn-guide.txt`) wherever they differ — it includes every correction verified during development (returned-degree rule, 1-5-9 / 1-5-7-9 split, seat-based label suffixes, display conventions, print/PNG specs, etc.).
4. Never "fix" or re-derive the fitted formulas/constants — they are calibrated against a legacy desktop astrology program (via screenshots). Known residuals are documented in §5/§6; leave them as-is.

---

## 1. Product summary — what the software does

A free, offline-capable **Bhrigu Nandi Nadi (BNN) astrology chart** tool. Input: birth date, time, place (or manual lat/lon/tz), optional name, gender. Output (all computed locally, no server):

1. **Lagna (rashi) chart drawing** — South-Indian / North-Indian style toggle; red cusp numbers + degrees inside each sign cell; planets with truncated degree.minute and `#` for retrograde; ASC marker; lagna corner marks; a **parivartana label** ("MERCURY<>SATURN — AFTER PARIVARDHANAI (AP)") and a small exchange box at the chart's top-left; **centre panel**: name, place, date+weekday, AGE (Y-M-D), nakshatra-pada, tithi, yoga, running dhasa + bhukthi dates.
2. **Transit ring** — the current transit planets + transit ascendant drawn *outside* the chart, grouped by sign, `#` retrograde, date-time selectable (default: now, in the chart's zone) at the chart's place. An "अभी / Now" button resets the time.
3. **BP / AP toggle** — BEFORE / AFTER parivartana (sign exchange). All tables change between the two modes. Default: **AP when the age on the analysis date is ≥ 30**, else BP (chosen by the astrologer; the toggle is manual).
4. **Bhava Combination tables** (4 tabs: `1-5-9`, `1-5-7-9`, `BRSSS`, `SPECIAL`) — coloured entries + small legends.
5. **Planet Combination tables** (4 tabs: `1-5-7-9`, `1-5-9`, `SPECIAL`, `PRSSS`) — with a final pink/violet **progression ("Astronomy") column** (always the 9th column in the list tabs).
6. **Colour rules + legends** (meanings in R17, §3.11) — the phaladesh reading depends on these colours.
7. **Vimshottari Dhasa / Bhukthi / Andhiram** section — tabs; end dates with the native's age (Y-M-D); the currently-running row highlighted; a note line explaining the columns.
8. **Print / Save-PDF** — a 5-page A4 sheet (own design): page 1 = invocation header (Ganesh & Saraswati images, हरि ॐ, name, mantra, contact) + basic details + the chart; page 2 = combination + both SPECIAL tables; page 3(+4) = PRSSS/BRSSS + dhasa + **all 81 bhukthis** + andhiram. Footer on every page.
9. **"All Chart" PNG export** — one wide sheet (1680×1080 units rendered at 2× = 3360×2160 px): left = the chart being viewed (with its transit ring); right = the two combination views currently open in the browser (bhava + planet tabs, enlarged for readability); bottom = the running dhasa/bhukthi/andhiram strip.
10. **Bilingual UI** — हिंदी / English toggle (all labels and legends; chart-inner text stays planet-code English by rule).
11. **Privacy** — everything in-app; no accounts, no analytics, no cookies. The only optional network feature is place-search (Open-Meteo geocoding); a desktop port should work fully offline (bundle a place list or manual coordinates).

---

## 2. Current implementation (web)

- **Stack:** Vite (vanilla JS, no framework), static multi-page site, Swiss Ephemeris **WASM** (`swisseph-wasm`); 100% client-side; no backend/database; deploys via GitHub Pages under the custom domain.
- **BNN modules (`src/bnn/`):**

| File | Responsibility |
|---|---|
| `kp.js` | KP New engine: ayanamsa, Placidus bhava-chalit (cusps + planet houses), exchange (parivartana) detection, tithi/yoga indices, `BNN_SETTINGS` |
| `combos.js` | Combination engine (R1–R7 + guru catch): zones, ordering, aspects, parivartana seats, planet & bhava lists (159/1579), progression partners, row-label suffix, `COMBO_SETTINGS` |
| `percent.js` | All percentage formulas + `PERCENT_SETTINGS` |
| `prsss.js` | PRSSS / BRSSS five-level sub-lord chains (Vimshottari proportions) |
| `special.js` | SPECIAL tables (Director, IN-STAR-OF-A, owns/sits→gives, star results) + colour helper |
| `dasha.js` | Vimshottari dhasa / bhukthi / andhiram incl. all settings, age maths, lists |
| `transit.js` | Transit snapshot (ring) |
| `pcp.js` + `pcp-ui.js` | “Special Transit” (PCP): engine + page section — per-planet start leads; calibration `scripts/bnn-calib/pcp-check.mjs`; research log `docs/pcp-research.md` |
| `render.js` | Chart drawing (south/north), centre panel, exchange box, tables UI, tabs, legends |
| `print.js` | The 5-page A4 print sheet (DOM + print CSS) |
| `allchart.js` | The All-Chart PNG sheet (SVG → canvas → PNG) |
| `main.js` | Page wiring: form, state (`values.*`), BP/AP, tabs, buttons, prefill from URL |

- **Shared modules reused:** `astro.js` (rashi names/lords, longitude describe), `geocode.js` (place search), `timeutil.js` (tz/UTC conversion), `birthvalidate.js`, `prefill.js` (URL pre-fill), `i18n.js` (all strings), `mybapuji-strip.js`, `style.css`, self-hosted **Noto Sans Devanagari** font. (A desktop port only needs these + `src/bnn/`.)
- **Commands:** `npm run dev` · `npm run build` · `npm test` (**471 tests** across 35 files) · `node scripts/bnn-calib/combos-check.mjs` (**59/59**), `special-check.mjs` (**69/69**), `dasha-check.mjs` (**27/27**), `transit-check.mjs` (**20/20**), `chart-texts.mjs` (display parity), `ayanamsa-confirm.mjs` (ayanamsa/houses fit).
- Build output ≈ 3.3 MiB including the ephemeris WASM files (`public/wasm/`).

---

## 3. Computational specification (must be reproduced exactly)

### 3.1 Time, ayanamsa, houses
- Input: birth date + local civil time; convert to **UT** using the place's timezone (IANA name or offset; old Indian births use +05:30).
- **Ayanamsa:** Swiss Ephemeris **sidereal mode 44** — name in the wasm package: **"Lahiri VP285"**; value at the reference chart (22-01-1980): **23°35′06″**. It is the *only* built-in that matches the legacy reference within ~1′ (the KP/Krishnamurti modes 5/45 are 5–7′ away — do NOT use them despite the "KP New" label in the spec).
- **Houses:** **Placidus** cusps, computed at **UT + ΔT + 0.5 s** (ΔT from the ephemeris; the +0.5 s is a display-parity fine-tune). The same UT+ΔT(+0.5 s) convention is used for: the dasha Moon, and the transit ring. Legacy match achieved: cusps ≤0.7′, planets ≤0.9′.
- **Planets:** Sun…Saturn ephemeris positions; **Rahu = mean node** (`SE_MEAN_NODE`); Ketu = Rahu + 180°. Sidereal positions with speed flag (for retrograde `#`).
- House n runs from cusp n to cusp n+1 (cusp ranges, wrap-safe). The drawn chart is the **rashi (lagna) chart**, but every table is computed from this bhava-chalit placement.
- Reference input: Betul MP, lat **21.4833**, lon **78.25**, 22-01-1980 20:30:00 IST, male.

### 3.2 Motion & marks
- Direct planets advance through signs forward; retrograde backward. Sun/Moon never retrograde; Rahu/Ketu **always** retrograde (nodes).
- `#` after a planet name = the planet's **natal** retrograde status — it never changes between BP/AP.

### 3.3 Zones (k = 1, 5, 7, 9)
- For a source planet P at longitude L, its zone for offset k is the 30° arc starting at L rotated (k−1) signs **in P's direction of motion** (i.e. k = 1 → [L, L+30°) forward for a direct planet, [L−30°, L] backward for a retrograde one; k = 5 → offset 4 signs; 7 → 6; 9 → 8).
- **Rahu/Ketu** use only **k = 1, 5, 9**, and are **skipped** when they fall in a planet's k=7 zone (in both list variants, per R3).
- Membership uses the **full-precision longitude**; zones are **half-open [start, start+30°)**: a planet exactly at a zone start is inside; exactly at the far end is not.

### 3.4 Order within a combination
- Direct P: order members by `(deg_Q − deg_P) mod 30` ascending. Retrograde P (incl. nodes): `(deg_P − deg_Q) mod 30` ascending. A planet at the same degree as P comes first (key 0). (Values are mod 30 of the full directional delta.)

### 3.5 Special aspects (Mars 4/8, Saturn 3/10)
- Aspect points: PAR = same degree as the caster in the sign counted from the caster's sign as 1, always counted **forward** (even for a retrograde caster). Mars → points at k=4 and k=8 (labels `MAR4`, `MAR8`); Saturn → k=3, k=10 (`SAT3`, `SAT10`).
- An aspect point becomes an **entry in a planet's combination** when that planet lies inside the aspect's influence window **[point − 30°, point + 2°]** (through the zodiac). Entry order key = distance from the planet to the point along the planet's direction, mod 30; its percentage uses the planet-to-planet formula (§3.11).
- In **bhava tables**, an aspect entry joins **only the row of the bhava its point lands in** (by cusp ranges), with the bhava formula on its distance from that bhava's starting cusp.

### 3.6 Parivartana (sign exchange) — BP vs AP
- If A sits in B's sign and B sits in A's sign (e.g. Mercury in Capricorn & Saturn in Virgo), then in **AP mode the two swap seats** — sign, degree AND motion status — before every combination / progression / lordship computation. In **BP mode** nothing is swapped.
- Planet names keep their **natal** `#`; the chart **drawing always shows natal positions**; show the label `MERCURY<>SATURN` and `AFTER/BEFORE PARIVARDHANAI (AP/BP)`.
- PRSSS always uses each planet's **own natal** longitude (both modes).
- No exchange → no AP/BP difference (still show the mode).

### 3.7 Returned-degree catch (guru rule — critical, easy to miss)
- For a planet whose seat came from parivartana: planets sitting **within 1.0° behind the seat degree** (reverse direction) join that planet's combination as a normal member (`caught: true`).
- Reference effect: Sun (0.83° behind the Mercury/Saturn exchange degree) → **SUN-97** is the first entry of Saturn's row in AP and of Mercury's row in BP. Its percentage uses the **bhava formula** (§3.11) — 97 — not the planet formula (which would give 94).
- Setting: `COMBO_SETTINGS.returnedCatchDeg = 1.0`.

### 3.8 The two list variants: 1-5-9 vs 1-5-7-9
- Every planet and every bhava gets two lists:
  - **list1579** = all members from zones {1,5,7,9}; **list159** = the same list with **k=7 zone members removed** (aspect entries and the catch survive; Rahu/Ketu never enter a 7th zone; duplicates are de-duplicated — the legacy software's duplicate cells were acknowledged bugs and are dropped).
- Bhava row B-n = planets in bhavas **n, n+4, n+8** (list159) **plus n+6** (list1579 only). Aspect entries only in the row of the bhava they land on. Never repeat a planet in a row. Sort: percentage descending (stable).

### 3.9 Progression ("Astronomy") column
- For each planet (using its seat's direction) the **first planet met** while moving on in that direction, ignoring zones and sign boundaries. Shown as the last (9th) column of both planet list tabs, pink/violet colour, no header.
- When a planet has no member in its 1-5-9 / 1-5-7-9 zones, this partner stands in as its combination partner for interpretation (guru rule).

### 3.10 Percentage formulas (all fitted — keep constants)
- **Planet→planet / to an aspect point:** `p = 96.65 − 3.147 × d`, d = in-direction degrees (0–30).
- **Planet→bhava (cells, catches, aspect-in-bhava):** `p = 100 × (1 − d / (0.942 × W))`, d = degrees from the bhava's starting cusp, W = bhava width.
- **Row-label suffix `-NN`** (the number after a planet's name in row labels, e.g. `JUP#-91`): `p = round(100 × (1 − d / W))` — the **plain** form, **without** the 0.942 factor. Verified 9/9 per mode (AP: SUN-18 MOO-95 MAR-69 MER-27 JUP-91 VEN-95 SAT#-15 RAH-20 KET-20; BP swaps only the exchanged pair: MER-15 SAT#-27).
- The **SUN-97 catch** uses the bhava form (§3.7).
- Known residuals (report-only, do not tune): a few SAT3/SAT10 and mixed-seat cells differ from the legacy by ±1–3; the legacy also showed duplicate cells that we intentionally clean. Settings live in `PERCENT_SETTINGS` (`p2pBase 96.65`, `p2pPerDegree 3.147`, `p2bWidthFactor 0.942`).

### 3.11 Colours & legend (R17)
- Row label (centre planet / bhava): red `#b3261e` on cream.
- **First entry of a row = blue** (`#1565c0`) — the "main planet": influences that planet/bhava for life, dasha or not (even below 20%).
- Other entries: **green** (`#2e7d32`) if ≥ 20% — active in their own dasha/bhukthi; **orange** (`#ef6c00`) if < 20% — weak, almost ignored.
- **Guru exception:** the planet **Saturn itself** (SAT/SAT#, not its aspects) is **always green** when not first, whatever its percentage.
- Progression column: pink/violet `#8e24aa`; legend dots: brown (row item) / blue / green / orange. Legends (bilingual):
  - Bhava tables: `● भाव · ● मुख्य ग्रह · ● उपग्रह · ● अल्प बलशाली ग्रह`
  - Planet tables: `● केन्द्रीय ग्रह · ● मुख्य ग्रह · ● उपग्रह · ● अल्प बलशाली ग्रह`

### 3.12 PRSSS / BRSSS (sub-lord chains)
- Five levels for a longitude: **[rashi lord, star (nakshatra) lord, sub, sub-sub, sub-sub-sub]**. Each level subdivides the *current* span by the Vimshottari proportions (Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17; sum 120), starting from its own lord. Use exact fractions throughout (no intermediate rounding).
- 27 nakshatras of 360/27°; nakshatra lord cycle = the 9 lords in order from Ketu.
- **PRSSS** = chain of the planet's own natal longitude (both BP and AP); **BRSSS** = chain of the bhava cusp longitude. Expectations in §5 (all five levels must match for PRSSS; for BRSSS the last level can flip at arc-second input precision — first four levels must match).

### 3.13 SPECIAL tables (Lordship / Director)
- **Bhava table columns:** `BHAVA | LORD | PLANETS(A) | IN STAR OF A | LORDSHIP`.
  - LORD = bhava's rashi lord. PLANETS(A) = planets sitting in the bhava (by seat), nearest the starting cusp first, `#` = natal retro.
  - **Lordship (Director)** = the planet giving the bhava's result: an occupant that also sits in the bhava's sign (or a sign owned by the same lord — e.g. Ketu in Aquarius can give the 6th, since Capricorn and Aquarius are both Saturn's); if several qualify, the one nearest the starting cusp; if none, the bhava lord itself.
  - **IN STAR OF A** = planets whose **star lord** is one of the bhava's occupant planets (A); if the bhava is empty, A = the bhava lord.
- **Planet table columns:** `PLANET | Lord | sits → gives | STAR | LORDSHIP`.
  - Lord = houses owned (Rahu/Ketu own none). `sits → gives` = house sat in → houses whose Director is this planet. STAR = `starLord - houseOf(starLord seat)`; LORDSHIP col = houses given by the star lord.
- All computed from the **seat** (AP swaps apply) except the star chains (natal longitude).

### 3.14 Vimshottari dhasa / bhukthi / andhiram
- Dasha Moon = Moon at **UT + ΔT (+0.5 s)**. Starting lord from the Moon's nakshatra (Vimshottari key order: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury — years 7/20/6/10/7/18/16/19/17).
- Balance of the first dasha, birth → first end, expressed in **calendar Y-M-D** (year = 365.25 days; month = year/12; days rounded): reference = **5Y-11M-1D**.
- **Mahadasha ends**: each end = previous end + the lord's full years as **calendar year additions**; ages shown as calendar Y-M-D diffs from birth.
- **Bhukthi length** = `round(dasha_years × 366 × bhukthi_years / 120)` days; the **last bhukthi ends exactly on the mahadasha end**. (366-day year reproduces the legacy bhukthi dates to the day.)
- **Andhiram length** = `floor(bhukthi_nominal_days × andhiram_years / 120)` days, where bhukthi_nominal_days = the same 366-based figure; last andhiram ends on the bhukthi end. (The guide's "~364-day" note is superseded; the 366-based proportional floors reproduce every readable legacy date.)
- First (partial) mahadasha presentation: leading bhukthis before birth are shown as **blank rows**, then the remaining bhukthis with dates (reference: Saturn block = 6 blank rows, then MAR 01-08-1980, RAH 10-06-1983, JUP 23-12-1985).
- Settings (`DASHA_SETTINGS`): `useDeltaT: true`, `deltaTFineTune: 0.5`, `balanceYearDays: 365.25`, `bhukthiYearDays: 366`.

### 3.15 Transit ring
- Planets + Placidus ascendant for a selectable date-time & the chart's place, at **UT + ΔT (+0.5 s)**, sidereal mode 44.
- Outer ring numbers **rounded to arcminute** (e.g. `SAT# 17.19`, `ASC 28.01`); inner chart text truncates instead (two distinct display paths — keep both). Rahu/Ketu: legacy used a slightly different node model (~0.6′ difference; sign/degree agree) — acceptable.

### 3.16 Chart drawing conventions (display parity — verified letter-for-letter)
- Sign cells: red cusp number + truncated degree.minute (`09 11.31` = cusp 9 at 11°31′); planets as `MAR# 21.30` (code + # + truncated deg.min); lagna cell also shows `ASC 12.53`.
- **Minutes are TRUNCATED (floor), never rounded** in the chart text; the +0.5 s cusp fine-tune makes every displayed arcminute match the legacy face exactly.
- South style: 4×4 grid, fixed cell order, centre square for the panel. North style: diamond; house numbers; planets avoid the centre square by shifting to the nearest free side.
- Lagna marked with **two parallel diagonal strokes at the lagna cell's top-right** (current design; earlier straight variants were superseded).
- Exchange box: top-left above the chart, two lines (`MERCURY<>` / `SATURN`), amber bordered.
- Centre panel fields (order): name; place; `dd-mm-yyyy - hh:mm:ss WEEKDAY`; `AGE : YYy-MMm-DDd GENDER`; `NAKSHATRA - pada`; `TITHI`; `YOGA`; `VEN DHASA: dd-mm-yyyy -> dd-mm-yyyy`; `MER BHUKTHI: dd-mm-yyyy -> dd-mm-yyyy`.

### 3.17 Print sheet (Save PDF)
- A4, 5 pages, own design (not a copy of any other software). Page 1: header — Ganesh image (left), हरि ॐ / name / mantra `ॐ ऐं ह्रीं श्रीं क्लीं चामुण्डायै विच्चे नमः` / info@mybapuji.com (centre), Saraswati image (right); BASIC DETAILS grid (Name, Age, DOB, TOB, Place | Lagna, Sign, Star, Tithi, Yoga); the chart (~175 mm wide); parivartana note. Page 2: BHAVA COMBINATION (1-5-7-9) & PLANET COMBINATION (1-5-7-9) + both SPECIAL tables (bhava-first order). Page 3+: PRSSS, BRSSS, DHASA table, all **81 bhukthi blocks**, andhiram. Tables ~12.5 px, coloured like the web; footer `🌿 mybapuji.com · info@mybapuji.com` + tools line on every page. Exact implementation: `src/bnn/print.js` + `@media print` CSS.

### 3.18 "All Chart" PNG
- One SVG 1680×1080, exported at 2× (3360×2160). Header: `<name> — BNN ALL CHART`, parivartana line, `mybapuji.com · BNN चार्ट` + transit time. Left: the currently-viewed chart (748×748 box, with transit ring). Right from x=820: the two combination tables as currently open (bhava tab + planet tab; rows 31 px, font 16, columns fill to ≈1620) + running dhasa strip (cream box). Footer credit line. Filename `BNN-All-Chart-<name>.png`. Implementation: `src/bnn/allchart.js`.

### 3.19 UI details
- Tab orders — bhava: `1-5-9 | 1-5-7-9 | BRSSS | SPECIAL`; planet: `1-5-7-9 | 1-5-9 | SPECIAL | PRSSS`. Defaults: bhava `1-5-9`, planet `1-5-7-9`, chart style south.
- BP/AP toggle above the tables; mode default by age (§1, item 3). Legend under each table (4 dots, §3.11). Dasha note: `अंतिम तिथि — उस समय की आयु · पीली पंक्ति = अभी चल रही दशा/भुक्ति/अंतर`.
- Bilingual switch (हिंदी default / English). Number/date formats as above (dd-mm-yyyy everywhere; age `46Y-8M-8D`).

---

## 4. Constants & settings (single source of truth)

| Setting | Value | Notes |
|---|---|---|
| `BNN_SETTINGS.ayanamsaMode` | `44` | "Lahiri VP285" — do not substitute |
| `BNN_SETTINGS.housesAtDeltaT` | `true` | houses/dasha/transit use UT+ΔT |
| cusp/transit fine-tune | `+0.5 s` | display parity |
| `COMBO_SETTINGS.returnedCatchDeg` | `1.0°` | guru catch (§3.7) |
| `PERCENT_SETTINGS.p2pBase / p2pPerDegree` | `96.65 / 3.147` | planet→planet |
| `PERCENT_SETTINGS.p2bWidthFactor` | `0.942` | planet→bhava |
| label suffix | plain form | `round(100(1−d/W))` |
| `DASHA_SETTINGS.balanceYearDays` | `365.25` | balance → calendar Y-M-D |
| `DASHA_SETTINGS.bhukthiYearDays` | `366` | bhukthi + andhiram figures |
| Vimshottari years | Ke7 Ve20 Su6 Mo10 Ma7 Ra18 Ju16 Sa19 Me17 | sum 120 |

Main shapes: `planets[] = { key, name, short, constName, longitude, rashi, degInSign, retro, speed, bhava }`; `cusps[] = { n, longitude, rashi, degInSign }`; `seats[key] = { key, lon, rashi, degInSign, retro, natalRetro, exchanged }`; combination entry = `{ type:'planet'|'aspect', key|label, zone, distance, percent, natalRetro?, caught? }`.

---

## 5. Reference chart & acceptance test vectors

**Input:** 22-01-1980, 20:30:00, Betul MP (lat 21.4833, lon 78.25, +05:30), male. Exchange pair: **MERCURY<>SATURN**.

**Compute (must match; tolerance ≤ 1 arcminute):**

| Item | Expected |
|---|---|
| Cusps 1–6 (7–12 = +180°) | Leo 12°53.0′ · Virgo 10°54.5′ · Libra 11°31.4′ · Scorpio 12°52.0′ · Sagittarius 13°36.7′ · Capricorn 13°38.4′ |
| Sun | Capricorn 8°09.9′ |
| Moon | Pisces 12°30.7′ |
| Mars# | Leo 21°30.1′ |
| Mercury | Capricorn 8°59.5′ |
| Jupiter# | Leo 15°30.4′ |
| Venus | Aquarius 14°18.8′ |
| Saturn# | Virgo 3°12.8′ |
| Rahu / Ketu | Leo 7°10.1′ / Aquarius 7°10.1′ |
| Tithi / Yoga / Nakshatra | Shukla Shashthi · Shiva · Uttara Bhadrapada-3 |

**AP — planet combinations (1-5-7-9), verified 59/59 vs legacy:**
`JUP#-91 VEN-93,RAH-70` · `SUN-18 SAT#-94,KET-5` · `MOO-95 MAR8-68,RAH-19` · `MAR#-69 JUP#-78,VEN-74,RAH-52` · `MER-27 MAR#-60,JUP#-41,VEN-37,RAH-15` · `VEN-95 JUP#-93,MAR#-74,MER-37,SAT3-19,MOO-8` · `SAT#-15 SUN-97,KET-8` · `RAH-20 MOO-19` · `KET-20 SAT#-8,SUN-5`.
Progression column (AP): JUP→RAH, SUN→SAT, MOO→RAH, MAR→JUP, MER→MAR, VEN→MOO, SAT→KET, RAH→MOO, KET→SAT.

**AP — bhava rows (list159 shown; [1579] adds noted items):**
`B01 JUP#-90,MAR#-67,MER-23,SUN-13,SAT#-10 [1579: +VEN-95 first]` · `B02 KET-15,SAT10-3 [1579: +MOO-94 first]` · `B03 VEN-95` · `B04 MOO-94,MAR4-70,RAH-15` · `B05 = B01` · `B06 KET-15` · `B07 VEN-95,SAT3-1 [1579: +JUP#-90,MAR#-67,MER-23]` · `B08 MOO-94,MAR8-63,RAH-15` · `B09 = B01` · `B10 KET-15` · `B11 VEN-95 [1579: +SUN-13,SAT#-10]` · `B12 MOO-94,RAH-15`.

**BP — planet combinations (1-5-7-9):** `SUN MER-94,KET-5` · `MER SUN-97,KET-8` · `VEN JUP#-93,MAR#-74,SAT#-37,MOO-8` · `SAT MAR#-60,JUP#-41,VEN-37,RAH-15` · `KET MER-8,SUN-5` (others as AP).
**BP — bhava rows:** `B01 JUP#-90,MAR#-67,SAT#-23,SUN-13,MER-10` · `B03 VEN-95,SAT3-27` · `B10 SAT10-30,KET-15` (others per the check script output; run `node scripts/bnn-calib/combos-check.mjs`).

**PRSSS chains (five levels; match all):** JUP = SUN,VEN,VEN,KET,JUP · SUN = SAT,SUN,VEN,SUN,MAR · MOO = JUP,SAT,MAR,MER,MER · MAR = SUN,VEN,JUP,MOO,VEN · MER = SAT,SUN,VEN,JUP,SAT (VEN confirmed for the level that was unreadable in the source screenshot) · VEN = SAT,RAH,MER,SAT,SUN · SAT = MER,SUN,SAT,SAT,MOO · RAH = SUN,KET,RAH,VEN,KET · KET = SAT,RAH,RAH,JUP,MOO.
**BRSSS rows:** B01 SUN,KET,MER,JUP,MER · B02 MER,MOO,MOO,VEN,SUN · B03 VEN,RAH,SAT,VEN,MER · B04 MAR,SAT,MAR,MOO,MER · B05 JUP,VEN,VEN,VEN,SAT · B06 SAT,MOO,RAH,MOO,RAH · B07 SAT,RAH,MER,KET,RAH · B08 JUP,SAT,SUN,VEN,SUN · B09 MAR,KET,MER,MER,VEN · B10 VEN,MOO,RAH,MER,VEN · B11 = MER,RAH,MER,RAH,RAH · B12 MOO,SAT,RAH,SAT,MOO.

**Dasha (end dates; all verified 27/27):**
- Mahadasha: SAT 23-12-1985 → MER 23-12-2002 → KET 23-12-2009 → **VEN 23-12-2029** → SUN 23-12-2035 → MOO 23-12-2045 → MAR 23-12-2052 → RAH 23-12-2070 → JUP 23-12-2086.
- Venus-dasha bhukthis: VEN 26-04-2013, SUN 27-04-2014, MOO 28-12-2015, MAR 27-02-2017, RAH 01-03-2020, JUP 02-11-2022, SAT 04-01-2026, **MER 06-11-2028**, KET 23-12-2029.
- Venus-Mercury andhiram: MER 30-05-2026, KET 29-07-2026, VEN 17-01-2027, SUN 09-03-2027, MOO 03-06-2027, MAR 02-08-2027, JUP 21-05-2028, SAT 06-11-2028 (RAH = 04-01-2028; was cut in the legacy screenshot).

**Transit vector:** 07-10-2026 04:40:03 IST at Betul — outer ring (rounded): SAT# 16.52, MAR 10.53, JUP 26.24, VEN# 13.59, MER 13.56, SUN 19.28, MOO 03.39, ASC 28.01. Second vector (guide): 01-10-2026 ≈12:16 IST — all planets ≤0.63′ against: Moon 13°42′ Taurus, Saturn# 17°19′ Pisces, Rahu 3°28′ Aquarius, Mars 7°37′ & Jupiter 25°24′ Cancer, Ketu 3°28′ Leo, Sun 13°52′ Virgo, Venus 14°10′ & Mercury 6°49′ Libra, asc 5°46′.

**Display parity file:** `scripts/bnn-calib/chart-texts.mjs` pins the chart's visible strings for this chart (truncated arcminutes; +0.5 s fine-tune). A port should reproduce those strings on-screen exactly.

---

## 6. Deliberately open items (do NOT invent rules; keep as report-only)

1. **PCP (special transit window)** — **first version built & live** (2026-10-07): the `/bnn/` page's bottom section **“Special Transit”** (engine `src/bnn/pcp.js`, UI `src/bnn/pcp-ui.js`, check `scripts/bnn-calib/pcp-check.mjs`). Per-planet start-leads decoded empirically (बुध ≈0.15° · गुरु ≈0.17° · शनि ≈0.9° · चंद्र ≈2.44° · सूर्य ≈3.86° · मंगल 5° · शुक्र 6° · केतु ≈13.9° · राहु ≈14.4° — Jupiter-transit rows; some differ for Saturn rows). Calibration vs the legacy tables: **Mars chart 15/15**, overall 27/51; the **retro/station splitting rules are still being decoded** (owner collaboration ongoing). Full research log + open items: `docs/pcp-research.md`.
2. **Gulika (GUL)** — formula not supplied yet; not drawn.
3. **Legacy tabs TR1579 / TR159** — meaning unknown; not built.
4. **3rd/11th relations and the '10' tab** — not built (spec excludes them).
5. **Fitted-percentage residuals** (§3.10) — known, accepted; a handful of cells differ ±1–3 from legacy; do not tune constants.
6. **Day-4/Day-5 फलादेश (interpretation) rules** — a future layer; does not affect computation.

---

## 7. Desktop conversion guidance

**Route A — wrap the existing web app (fastest, lowest risk).** Package the Vite build in a native shell — **Tauri** (small, recommended) or Electron:
- Bundle `dist/` + the ephemeris WASM locally → fully offline.
- Wire buttons: Print → system print dialog (the 5-page sheet already prints correctly; verify page size/margins), PNG export → native save dialog (currently a browser download; keep the same generated bytes).
- Optional: replace place-search with a bundled offline place list (or keep manual lat/lon/tz entry); keep URLs/prefill optional.
- Result: pixel-identical outputs, minimal porting risk.

**Route B — native rewrite.** Choose a stack (C#/WPF, C++/Qt, Python/PySide…), use the official **Swiss Ephemeris native library** and port §3–§5 one-to-one:
- MUST: sidereal mode **44**; UT+ΔT+0.5 s for houses/dasha/transit; truncation vs rounding display rules (§3.15/§3.16); the fitted constants (§4); seat/parivartana/catch logic (§3.6–3.7).
- MUST: pass all acceptance vectors (§5) before considering it done; reproduce the check scripts' outcomes.
- Bundle a Devanagari font (Noto Sans Devanagari), keep the bilingual strings, keep the same colour palette and legends.

**Both routes:** keep AGPL-3.0 licensing and the Swiss Ephemeris credit; no telemetry; keep the file/mantra/contact elements in the print sheet; keep the "Free / no sign-up" spirit.

**Suggested acceptance checklist:** cusps & planets ≤1′ vs §5 · combination tables match §5 (both modes) · label suffixes & colours match · PRSSS/BRSSS rows match · dasha dates match to the day · transit vector matches (rounded) · print produces the 5-page sheet · All-Chart PNG reproduces the same layout at 3360×2160.

---

## Appendix A — ready-to-paste prompt for the coding AI

> You are a senior desktop-software developer. Below/attached: (1) this handover document (BNN-AI-HANDOVER), (2) the full source of a working web implementation (repo `github.com/vasant22/kundli`, BNN parts in `src/bnn/`, spec `docs/bnn-guide.txt`, calibration `docs/bnn-calib-findings.md`, checks `scripts/bnn-calib/`, tests `tests/bnn-*.test.js`).
> **Task:** convert the BNN chart tool into an **offline desktop application** (recommend Tauri/Electron wrap vs native port and proceed with the better fit; if unsure, do the wrap first).
> **Required:** reproduce every computation rule and constant exactly as in §3–§4 of the handover; validate against ALL test vectors in §5 (within stated tolerances) before finishing; keep the bilingual UI, colour rules, print sheet and All-Chart PNG; work fully offline; keep AGPL-3.0 + Swiss Ephemeris credit; no analytics. **Do not invent rules** for the open items in §6 — list them as TODO and ask.
> Work in phases: setup → engine port → validation harness → UI/screens → print/export → packaging. After each phase run the validation checks and report what changed (short summary, PASS/FAIL numbers). Ask me only when truly blocked; otherwise choose sensible defaults and tell me.

## Appendix B — pack contents

- `BNN-AI-HANDOVER.md` (this document)
- `src/` — full source (BNN modules + shared modules + fonts/styles)
- `tests/` — all automated tests incl. fixtures (471 tests)
- `scripts/bnn-calib/` — calibration & verification scripts (the PASS/FAIL checks referenced throughout)
- `docs/bnn-guide.txt`, `docs/bnn-calib-findings.md`, `docs/pcp-research.md` — original requirements guide (v2) + calibration ledger + PCP/Special-Transit research log
- `package.json`, `vite.config.js`, `README.md`, `NOTES.md` — build config + project history (NOTES.md contains the full correction log)

*Prepared 2026-10-07 for the project owner (mybapuji.com). Legacy reference screenshots are private and not included; the numeric reference values above are the portable substitute.*
