# Panchang — Formula Reference (Phase 1)

Status: **Phase 1 deliverable.** Internal technical reference for the Panchang feature
(homepage widget + full page at `kundli.mybapuji.com/panchang/`). Every formula below was
either (a) confirmed against the reference site **https://panchang.astrosage.com/panchang/aajkapanchang**
(AstroSage "Today Panchang", New Delhi) and cross-checked with **Drik Panchang**
(https://www.drikpanchang.com/panchang/day-panchang.html, geoname-id=1261481), or (b) is a
textbook-standard formula already in use by the existing kundli engine. Items still uncertain are
flagged **[FLAG]** with what to verify and how.

Calibration dataset (regenerate with `scripts/panchang-calib/fetch-astrosage.mjs`):
- `scripts/panchang-calib/astrosage.json` — 50 AstroSage records (Sep 2026 week; all 12 sankranti
  boundaries of 2026 + early 2027; adhika-maasa month sample).
- `scripts/panchang-calib/astrosage-hi.json` — the Hindi rendering of one full day (i18n strings).
- `scripts/panchang-calib/probe-sankranti.mjs` — sankranti-time & rise/set probe (Swiss Ephemeris).
- `scripts/panchang-calib/probe-pravishte.mjs` — brute-force check of smooth candidate rules for
  the Bengali day-count (proves no simple time-offset formula fits; the stateful rule below does).
- Raw HTML cache: workspace `.openclaw/tmp/panchang-calib/` (not committed).

All calculations: **sidereal, Lahiri ayanamsa, Swiss Ephemeris (existing WASM build)**, computed for
the place's local timezone at the place's **sunrise** unless noted.

---

## 0. Conventions used by the reference page (must match)

1. **"Today's" Panchang = the values in force at today's sunrise**, each with its end time.
   If an element changes again before the NEXT sunrise, the next element is shown too
   (usually 1–2 elements per limb). Elements still running at the next sunrise are not shown
   today (they become the next day's first element). Verified: Sep 29, 2026, Yoga = "Vyagatha
   upto 06:12:55, Harshana upto 27:20:03" (Vyagatha ends 14 s after sunrise; Harshana runs past
   midnight to 03:20:03 next day, shown in "hours past midnight" format); Apr 20, 2026, Tithi =
   "Tritiya upto 07:30:31, Chaturthi upto 28:17:56" (two tithis before the next sunrise).
2. **Time format**: `HH:MM:SS` local; if an end time falls after civil midnight but before the
   next sunrise, it is expressed as `24+H:MM:SS` ("hours past midnight" convention; e.g.
   `27:20:03` = 03:20:03 the next calendar day). The reference site shows these for first AND
   second elements alike (e.g. Tithi "24:15:26" on Apr 14, 2026).
3. One further reference quirk: Tithi can read "upto Full Night" (e.g. Mar 13, 2026) — [FLAG]
   rendering TBD in Phase 3 (element spans the whole night; display "Full Night" text).
4. Weekday names in "Day": Sanskrit-style (Ravivara, Somavara, Mangalavara, Budhavara, Guruvara,
   Shukravara, Shanivara). Reference shows "Mangalavara" for Tuesday.
5. The user-facing page must show **hindi / English** pairs for everything except chart-internals
   (chart text stays English-only per existing project rule; East chart gets its own bilingual
   caption).

## 1. Tithi — STANDARD

- Angle = (Moon longitude − Sun longitude) mod 360°; each tithi = 12°.
- Index = floor(angle / 12) + 1 → 1..30. **Shukla** paksha = 1..15, **Krishna** = 16..30
  (16 = Krishna Pratipada … 30 = Amavasya).
- End time: bisection on (Moon − Sun) angle vs time (find when floor(angle/12) increments).
- Fixtures: Sep 29, 2026 → Tritiya (Krishna), ends 17:11:53; Apr 20, 2026 → two tithis
  (Tritiya 07:30:31; Chaturthi 28:17:56).
- Source: standard pañcāṅga definition (Muhūrta texts; identical on both reference sites).

## 2. Nakshatra — REUSE astro.js + add end time

- Moon longitude only; 27 × 13°20′. Existing `describeLongitude()` already yields the nakshatra
  (1..27) and pada; the panchang needs the same bisection helper as §1 for the END time.
- Fixtures: Sep 29, 2026 → Ashwini ends 09:04:04. (Moon sign shown separately under "Sun and Moon".)

## 3. Yoga — STANDARD

- Angle = (Sun longitude + Moon longitude) mod 360°; 27 yogas × 13°20′.
- Names (standard list, 1..27): Vishkambha, Priti, Ayushman, Saubhagya, Shobhana, Atiganda,
  Sukarman, Dhriti, Shula, Ganda, Vriddhi, Dhruva, Vyaghata, Harshana, Vajra, Siddhi, Vyatipata,
  Variyana, Parigha, Shiva, Siddha, Sadhya, Shubha, Shukla, Brahma, Indra, Vaidhriti.
  (Reference site spellings vary slightly — "Vyagatha", "Harshana"; use theirs in UI where seen.)
- End time by bisection; applies convention §0.2 for >24 h ends. Fixture: Sep 29, 2026 as above.

## 4. Karana — STANDARD (verified placement)

- Karana = half-tithi (6° of the tithi angle) → 60 halves per lunar month; 11 names:
  **7 movable**: Bava, Balava, Kaulava, Taitila, Gara, Vanija, Vishti (cycle in this order);
  **4 fixed**: Kimstughna, Shakuni, Chatushpada, Naga.
- Placement (verified — n = half-tithi index 1..60 counting from Shukla Pratipada 1st half):
  - n = 1 → **Kimstughna** (Shukla Pratipada 1st half)
  - n = 2..57 → movable[(n − 2) mod 7] (56 halves = exactly 8 cycles)
  - n = 58 → **Shakuni** (Krishna Chaturdashi 2nd half)
  - n = 59 → **Chatushpada** (Amavasya 1st half)
  - n = 60 → **Naga** (Amavasya 2nd half)
  - Vishti therefore appears 8 times; both reference sites agree (e.g. Sep 29, 2026: "Vanij upto
    06:15:25, Vishti upto 17:11:53"; Apr 20, 2026 → include both karanas of both tithis).

## 5. Sunrise-based day boundary — CONFIRMED

- All limbs anchored to the sunrise-to-sunrise window of the place: "today" = value at today's
  sunrise; second elements included when they end before the NEXT sunrise; extended `24+H` format
  for ends between midnight and next sunrise (§0.2). Sun/moon rise/set are computed for the place
  (Phase 2).

## 6. Samvat years — CONFIRMED with fixtures

Increment day for all three = **Chaitra Shukla Pratipada** as rendered by the reference
(i.e. the new-year flip happens on the day of the Chaitra new moon per the display convention):
- Verified: Mar 19, 2026 → Shaka 1947 / Vikram 2082 / Kali 5126; Mar 20, 2026 → **Shaka 1948 /
  Vikram 2083 / Kali 5127**. (Chaitra Pratipada 2026: tithi began 06:55 Mar 19, ended 04:50
  Mar 20 — the flip landed on **Mar 20**, i.e. the first sunrise-day after the conjunction.)
  Implementation rule to reproduce this: flip = first date whose sunrise follows the moment of
  the Chaitra new moon (Moon = Sun). **[FLAG]** exact edge convention for years where Pratipada
  starts/ends near sunrise to be re-verified in Phase 3 with 2025/2027 fixtures.
- Offsets (constant between flips): **Vikram = Shaka + 135**; **Kali = Shaka + 3179** (verified on
  every calibration record, incl. Kali 5127 in Sep 2026 and Mar 2027 records).

## 7. Samvatsara (60-year cycle) name — CONFIRMED

- Name index over Shaka year: `idx = (Shaka + 12) mod 60`; if idx = 0 → 60.
  Verified: Shaka 1946 → Krodhi (#38), 1947 → Vishvavasu (#39), **1948 → Parabhava (#40)** —
  Drik's own data attribute for Sep 29, 2026 literally reads `1948 40`, and both sites print
  "Parābhava" for Shaka 1948.
- The 60 names (1..60, standard cycle; Hindi forms are the traditional list — transliteration
  where no common Hindi form exists; final Hindi spellings to be set in i18n Phase 6):
  Prabhava, Vibhava, Shukla, Pramoda, Prajapati, Angirasa, Shrimukha, Bhava, Yuva, Dhata,
  Ishvara, Bahudhanya, Pramathi, Vikrama, Vrisha, Chitrabhanu, Svabhanu, Tarana, Parthiva, Vyaya,
  Sarvajit, Sarvadhari, Virodhi, Vikriti, Khara, Nandana, Vijaya, Jaya, Manmatha, Durmukha,
  Hemalamba, Vilambi, Vikari, Sharvari, Plava, Shubhakrit, Shobhakrit, Krodhi, Vishvavasu,
  Parabhava, Plavanga, Kilaka, Saumya, Sadharana, Virodhikrit, Paridhavi, Pramadi, Ananda,
  Rakshasa, Anala, Pingala, Kalayukta, Siddharthi, Raudra, Durmati, Dundubhi, Rudhirodgari,
  Raktaksha, Krodhana, Akshaya.

## 8. Pravishte / Gate (Bengali solar day-count) — REVERSE-ENGINEERED, matches AstroSage

Value = the day number of the running **Bengali (Bangabda) solar month** (Boishakh…Chaitra),
computed for the page's place. Both reference sites display a single number ("13" on
Sep 29, 2026 = Ashwin 13). The exact display arithmetic was reverse-engineered from ~120 fetched
dates across 2026–2027; the stateful rule that reproduces **AstroSage** is:

1. Compute all sankranti moments (Sun entering each sidereal rashi, Lahiri) and their local dates.
2. For date `t`, take `s` = the sankranti that starts the running month, `s_prev` = the previous
   sankranti. Let `Δ = (s.date − s_prev.date)` in whole days, and `span = (s_next.date − s.date)`.
3. **Display rule:**
   - If `Δ ≥ 31` ("long previous month"): month day 1 = `s.date` and the value = `(t − s.date) + 1`.
     - **Extra:** if the month spans 32 dates (`span = 32`), the value "2" repeats once:
       value(t) = `(t − s.date) + 1` for `t ≤ s.date+1`, else `(t − s.date)`
       (fixture: Jul 16, 2026 = 1, Jul 17 = 2, Jul 18 = 2, Jul 19 = 3 … Aug 16 = 31).
   - If `Δ ≤ 30`: month day 1 = `s.date + 1` with value 2; on `s.date` itself the value continues
     the old month: `Δ + 1` (usually 30/31); afterwards value = `(t − s.date) + 1`
     (fixtures: Apr 14, 2026 = 31 → Apr 15 = 2 → Apr 16 = 3; Oct 17 = 31 → Oct 18 = 2;
     Jan 14 = 30 → Jan 15 = 2; May 15 = 1 (Δ=31 case) → May 16 = 2).
4. **[FLAG] known divergences between references** (documented, not coded around):
   - Drik uses the same shape but shows clean values (`…31, 32, 1` for span-32 months) and starts
     some months at "1" where AstroSage continues the old count (Oct 17, 2026: Drik "1",
     AstroSage "31"); Drik also prints a literal "0" before some boundaries (Feb 12 / Mar 14, 2026).
   - AstroSage itself glitches on the Jul 17, 2027 boundary ("33" on one date; reset one day
     early). 2027 (Jul 16–17) is excluded from the close-match fixtures; noted for the user.
   - We follow **AstroSage** (the site this feature mirrors) for all clean fixtures.
5. Bengali month name itself is not part of the reference display (only the number + Amanta/
   Purnimanta lunar months are). If we add a "Bengali month name" caption later, use the
   sidereal-solar mapping (Boishakh = Sun in Mesha, etc.) — Bengali/Odia calendars.

## 9. Amanta and Purnimanta lunar months — CONFIRMED

- **Amanta month name** = determined by the sidereal solar sign in which its starting new moon
  falls (equivalently: sign the Sun occupies during that lunar month):
  Meena→Chaitra, Mesha→Vaishakha, Vrishabha→Jyeshtha, Mithuna→Ashadha, Karka→Shravana,
  Simha→Bhadrapada, Kanya→Ashwin, Tula→Kartika, Vrischika→Margashirsha, Dhanu→Pausha,
  Makara→Magha, Kumbha→Phalguna.
  Fixtures: Sep 2026 (Sun in Kanya → **Bhadrapada**, started at the Sep 11 new moon while Sun was
  in Simha ✓); Mar 20, 2026 → Chaitra; Apr 20 → Vaishakha.
- **Purnimanta month** = the Amanta name of the lunar month in which the NEXT full moon falls —
  i.e. Amanta X before X's Purnima; X+1 after. Fixtures: Sep 24 (before Sep 26 full moon) →
  Purnimanta Bhadrapada; Sep 27–30 (after it) → Ashwin. May 20–Jun 13, 2026 → "**Jyeshtha (Adhik)**"
  on BOTH Amanta and Purnimanta lines during the intercalary month (lunar month with no
  sankranti, named for the following month + "(Adhik)").
- **Adhika Maasa**: a lunar month (new moon to new moon) containing no sankranti is intercalary;
  display `"<Month> (Adhik)"` (Amanta and Purnimanta both). Nija months follow.
  Fixture: **Adhika Jyeshtha = May 16 – Jun 15, 2026** (both sites).

## 10. Ritu (season) — CONFIRMED

Six ritus, each = 2 sidereal solar months; keyed on the Sun's current sidereal sign:
- Meena/Mesha → **Vasanta**; Vrishabha/Mithuna → **Grishma**; Karka/Simha → **Varsha**;
  Kanya/Tula → **Sharad**; Vrischika/Dhanu → **Hemanta**; Makara/Kumbha → **Shishira**.
- Fixtures: Sep 29, 2026 (Sun in Kanya) → Sharad ✓; Mar–Apr 2026 (Meena/Mesha) → Vasanta ✓;
  Jan 15, 2026 (Makara) → Shishir ✓.

## 11. Muhurat / Kaal windows — tables VERIFIED on all 7 weekdays (AstroSage + Drik)

All windows below start at sunrise of the date and use **equal divisions of the local
sunrise→sunset day length**.

### 11a. 8-part of daytime (standard; verified ×7 days)
| Window | Sun | Mon | Tue | Wed | Thu | Fri | Sat |
|---|---|---|---|---|---|---|---|
| **Rahu Kaal** (8th-part #) | 8 | 2 | 7 | 5 | 6 | 4 | 3 |
| **Yamaganda** (#)        | 5 | 4 | 3 | 2 | 1 | 7 | 6 |
| **Gulika Kaal** (#)      | 7 | 6 | 5 | 4 | 3 | 2 | 1 |
Part n = [sunrise + (n−1)·D/8, sunrise + n·D/8], D = day length.
Fixture (Tue, Sep 29, 2026, D = 11:57:22): Rahu 15:10:42→16:40:22 ✓; Yamaganda 09:12:01→10:41:41 ✓;
Gulika 12:11:22→13:41:02 ✓.

### 11b. 15-part of daytime (muhūrtas; verified ×7 days vs AstroSage, subset vs Drik)
| Window (duration = D/15) | Sun | Mon | Tue | Wed | Thu | Fri | Sat |
|---|---|---|---|---|---|---|---|
| **Kulika** (#)                | 14 | 12 | 10 | 8 | 6 | 4 | 2 |
| **Kantaka / Mrityu** (#)      | 6 | 4 | 2 | 14 | 12 | 10 | 8 |
| **Kalavela / Ardhayaam** (#)  | 8 | 6 | 4 | 2 | 14 | 12 | 10 |
| **Yamaghanta** (#)            | 10 | 8 | 6 | 4 | 2 | 14 | 12 |
| **Dushta Muhurtas** (= Durmuhūrta set, 1–2 windows) | {14} | {9,12} | {4} | {8} | {6,12} | {4,9} | {1,2} |
| **Abhijit** (always)          | 8 | 8 | 8 | 8 | 8 | 8 | 8 |
Part n = [sunrise + (n−1)·D/15, sunrise + n·D/15]. **Abhijit = the 8th of 15 parts = centered on the
arithmetic midday (sunrise+sunset)/2** — verified: Tue Sep 29: 11:47:27→12:35:16, midpoint 12:11:21.5
= (06:12:41+18:10:03)/2 ✓.
Verified examples (Tue): Kulika 13:23:06→14:10:55; Kantaka 07:00:30→07:48:19; Kalavela 08:36:09→
09:23:58; Yamaghanta 10:11:48→10:59:37; Dushta 08:36:09→09:23:58; (Mon also shows the second
Dushta window 14:59:28→15:47:25; Sat shows both 06:11:08→06:59:18, 06:59:18→07:47:28.)
**[FLAG]** The four Kulika/Kantaka/Kalavela/Yamaghanta tables are reverse-engineered to match the
five published sources (they are consistent across all 7 weekdays on both sites where published;
classical attribution: vernacular Muhūrta tables — flag for the user in the README; numbers not
changed without a published source).

Notes:
- "Dushta Muhurtas" = the classical Durmuhūrta muhūrtas (1 or 2 per day); "Kalavela = Ardhayaam"
  shown as one line ("Kalavela / Ardhayaam").
- All windows are computed from sunrise/sunset of the day (Phase 2 accuracy matters!).
- Reference renders: "From HH:MM:SS To HH:MM:SS" (English) / "से … तक" (Hindi).

## 12. Disha Shoola — CONFIRMED (fixed weekday lookup)

| Day | Sun | Mon | Tue | Wed | Thu | Fri | Sat |
|---|---|---|---|---|---|---|---|
| Direction | West | East | North | North | South | West | East |
Verified on 7+ dates incl. Tue → North (Sep 29, 2026), Sun → West, Mon → East, Fri → West.
Source: standard Muhūrta table, matches both reference sites.

## 13. Tara Bala — CONFIRMED (3 full-day lists matched AstroSage exactly)

- Reuse the 9-Tara grouping from `src/ashtakoot.js` (Tara koota table; count t = ((current − janma)
  mod 27) + 1; t → {Janma, Sampat, Vipat, Kshema, Pratyari, Sadhaka, Vadha, Mitra, Parama Mitra}).
- The "Tara Bala" list on the reference = all janma nakshatras whose Tara for today's Moon-facing
  count lands in **{1 Janma, 2 Sampat, 4 Kshema, 6 Sadhaka, 8 Mitra, 9 Parama Mitra}** — i.e. all
  except **Vipat (3), Pratyari (5), Vadha (7)** (18 of 27 per day). Direction verified with
  Sep 24 / Sep 27 / Sep 29, 2026 fixtures (100% list match; the site's transliterations like
  "Satabisha"/"Kritika" are cosmetic).
- Output: full list of nakshatra names (bilingual), not a score.

## 14. Chandra Bala — CONFIRMED (3 days matched)

- Favorable rashi distances from the Moon's current sign: **{1, 3, 6, 7, 10, 11}**
  (same-month = 1). The list = all rashi names `i` such that ((Moon sign − i) mod 12) + 1 ∈ that set
  → 6 signs per day. Fixtures: Sep 29 (Moon Mesha) → Mesha, Mithuna, Karka, Tula, Vrischika, Kumbha ✓;
  Sep 24 → Mesha, Vrishabha, Simha, Kanya, Dhanu, Kumbha ✓; Sep 27 → Vrishabha, Mithuna, Kanya, Tula,
  Makara, Meena ✓.

## 15. East Indian (Bengali/Odia) chart layout — DECODED from the reference's own code

AstroSage draws three chart styles on `<canvas>` (`/dist/js/draw-chart.js`;
`Chart_Type 0/1/2` = North / South / East). Decoded East layout (sign-fixed, like South Indian;
normalized square, grid lines at 1/3 and ~2/3 in both axes, four corner cells split by diagonals →
12 fixed sign regions + unused center):

```
+----------------+----------------+----------------+
|  2 Vrishabha   |                |  12 Meena      |
| (upper-left ▲) |  1 Mesha       |  (top-right ▲) |
|   3 Mithuna    |  (top-centre)  |  11 Kumbha     |
| (left of diag) |                | (right of diag)|
+----------------+----------------+----------------+
|  4 Karka       |                |  10 Makara     |
|  (left-centre) |   (centre —    |  (right-centre)|
|                |   unused)      |                |
+----------------+----------------+----------------+
|  5 Simha       |  7 Tula        |  8 Vrischika   |
| (upper-left)   | (bottom-centre)|  (bottom ▲)    |
|   6 Kanya      |                |  9 Dhanu       |
| (lower-left)   |                | (right of diag)|
+----------------+----------------+----------------+
```

- Signs run **counter-clockwise from Mesha at top-centre**: Mesha → Vrishabha → Mithuna → Karka →
  Simha → Kanya → Tula → Vrischika → Dhanu → Makara → Kumbha → Meena.
- Lagna marker ("Asc") and planets are placed in their sign's cell (sign-fixed chart, like South
  Indian; NOT house-fixed like North Indian).
- Source: reverse-engineered from the reference's chart-drawing code (coordinates tables +
  `DrawLinesofEastChart`), Dec 2025-era build fetched Sep 29, 2026. Visual double-check scheduled
  in Phase 8 (render our version side-by-side with the reference's East tab).
- **[FLAG]** cross-check against a printed Bengali pañjikā chart before release (the code-decode is
  solid; a second source is desirable).

## 16. Data-source provenance (fetched 2026-09-29)

- AstroSage Today Panchang (reference): https://panchang.astrosage.com/panchang/aajkapanchang
  (+ `?date=DD-MM-YYYY`, `&language=hi`); 50 dates parsed into `astrosage.json`.
- Drik Panchang day panchang (cross-check): https://www.drikpanchang.com/panchang/day-panchang.html?date=…&geoname-id=1261481
  (New Delhi). Dawn/sunset/rise/set comparisons, Durmuhūrta/Rahu/Gulika/Yamaganda/Abhijit, Shaka/
  Kali/Pravishte cross-checks.
- Sankranti moments & rise/set: computed locally with the project's Swiss Ephemeris (probe
  scripts), cross-checked against the sites' values to ±1 min (rise/set within ~20 s; identical
  day-length to the second vs AstroSage on Sep 29, 2026).

## 17. Flags / open items carried into later phases

1. Pravishte edge cases & the two reference sites' divergence (see §8) — we follow AstroSage;
   keep the fixture list + this note for the user.
2. Samvat flip edge convention (Pratipada near sunrise) — verify 2025 & 2027 flips in Phase 3.
3. "upto Full Night" tithi rendering — decide in Phase 3.
4. Kulika/Kantaka/Kalavela/Yamaghanta classical attribution — cite vernacular Muhūrta source in
   README; numbers verified empirically ×7 days ×2 sites; do not change without a source.
5. East Indian chart cross-check vs a printed pañjikā (Phase 8).
6. Modern planets (Uranus/Neptune/Pluto): the reference DOES plot them in its charts
   (Asc Su Mo Ma Me Ju Ve Sa Ra Ke Ur Ne Pl) but the user's prompt says optional sub-section only.
   Default: skip in the planetary table; note in Phase 8 decision.
