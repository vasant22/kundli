// combos.js — the combination engine (Phase 4). Guide rules R1–R7:
//   R1 motion direction · R2 zones (k = 1,5,7,9; Ra/Ke: 1,5,9) · R3 members
//   (Ra/Ke are skipped when they land in a 7th zone) · R4 member order
//   ((Q−P) mod 30 forward / (P−Q) mod 30 backward; same degree first) ·
//   R5 Mars 4/8 & Saturn 3/10 aspect entries (point counted always forward;
//   included when the point lies in a zone; order key = distance to the
//   point) · R6 parivartana BP/AP (seat swap incl. motion status) · R7 the
//   Astronomy partner (first planet met in the seat's direction, zones and
//   signs ignored).
// The bhava rows (R12/13 area, Phase 5 tables) are provided here too:
//   row B-n lists planets in bhavas n, n+4, n+8 (list159) plus n+6 (list1579,
//   Ra/Ke skipped there); aspect entries appear only in the row of the bhava
//   they land on (percent = fixed 30° span, 100×(1−d/30); a point ≥30° past the
//   cusp is not listed — Gudiya calibration, 2026-10-08); entries sorted by
//   percentage (closeness) descending.
// Plus the guru's "returned degree" catch (user, 2026-10-07): a planet of a
// parivartana pair also counts planets sitting just behind its seat degree in
// the reverse direction — this is what puts SUN-97 in SAT's AP row / MER's BP
// row in the traditional format (see COMBO_SETTINGS.returnedCatchDeg).
// Spec: docs/bnn-guide.txt. Reference checks: scripts/bnn-calib/combos-check.mjs
import { findExchanges } from './kp.js'
import { aspectToBhavaPercent, planetToBhavaPercent, planetToBhavaPlainPercent, planetToPlanetPercent } from './percent.js'

const norm = (x) => ((x % 360) + 360) % 360

export const COMBO_SETTINGS = Object.freeze({
  // "उल्टी दिशा" catch (guru rule, calibrated on the reference chart): when the
  // planet sits on a degree acquired via parivartana, planets within this many
  // degrees BEHIND it (reverse direction) join its combination. Reference:
  // Sun 0.83° behind the Mercury/Saturn exchange degree → SUN-97 in SAT's AP
  // row and MER's BP row. Percentage uses the bhava-width form (like the
  // aspect entries) — 100 × (1 − d / (0.942 × W)) — which reproduces the
  // reference 97; the plain planet form would give 94 (reported in the check).
  returnedCatchDeg: 1.0,
  // विशेष दृष्टि: पाने वाले ग्रह की ओर से पास की ओर की छूट (डिग्री)। मार्गी पाने वाले
  // के लिए यही notes का "बिंदु से 2° आगे तक" है। config में — अध्याय-32 नियम 42 खुला है।
  // सर के software: 0.27° शामिल, 1.05° व 1.2° बाहर (चार्ट दीपक, x, y) — notes का 2° यहाँ 1° निकला।
  aspectForwardDeg: 1.0,
  // ग्रह-संयोजन: 30° क्षेत्र के बाद की छूट (डिग्री) — सर के software के 8 चार्टों से।
  zoneOverDeg: 1.0,
  zoneUnderDeg: 1.0,
})

// Allowed zone offsets (k−1): k ∈ {1,5,7,9} → {0,4,6,8}; Ra/Ke only {0,4,8}.
const OFFSETS_NORMAL = [0, 4, 6, 8]
const OFFSETS_NODES = [0, 4, 8]
const isNode = (key) => key === 'rahu' || key === 'ketu'

/**
 * Seat positions per mode. BP = natal positions; AP = mutual-exchange pairs
 * swapped (sign, degree AND motion status — R6). `natalRetro` keeps the '#'.
 * `exchanged` marks parivartana-pair planets (the guru catch below uses it).
 */
export function seatPositions(planets, mode = 'AP') {
  const seats = {}
  for (const p of planets) {
    seats[p.key] = {
      key: p.key,
      lon: p.longitude,
      rashi: p.rashi,
      degInSign: p.degInSign,
      retro: p.retro,
      natalRetro: p.retro,
      exchanged: false,
    }
  }
  const pairs = findExchanges(planets)
  for (const [aKey, bKey] of pairs) {
    seats[aKey].exchanged = true
    seats[bKey].exchanged = true
  }
  if (mode === 'AP') {
    for (const [aKey, bKey] of pairs) {
      const a = seats[aKey]
      const b = seats[bKey]
      const a0 = { lon: a.lon, rashi: a.rashi, degInSign: a.degInSign, retro: a.retro }
      Object.assign(a, { lon: b.lon, rashi: b.rashi, degInSign: b.degInSign, retro: b.retro })
      Object.assign(b, a0)
    }
  }
  return seats
}

/** In-direction degrees from a seat to a point (0 ≤ d < 360). */
function deltaTo(seat, x) {
  return seat.retro ? norm(seat.lon - x) : norm(x - seat.lon)
}

/**
 * Zone membership + order key for a point against a source seat.
 * Returns null when the point is outside the source's zones.
 */
export function memberOf(seat, x) {
  const d = deltaTo(seat, x)
  const allowed = isNode(seat.key) ? OFFSETS_NODES : OFFSETS_NORMAL
  const off = Math.floor(d / 30)
  if (allowed.includes(off)) return { zone: off + 1, key: d % 30, delta: d }
  // राउंड 62: क्षेत्र-सीमा की छूट (सर के software से) — 30° के बाद zoneOverDeg तक,
  // और क्षेत्र-आरंभ से पहले zoneUnderDeg तक बैठा ग्रह भी उसी क्षेत्र में गिना जाता है।
  for (const o of allowed) {
    let s = d - o * 30
    if (s > 180) s -= 360
    if (s <= -180) s += 360
    if (s > 30 && s < 30 + COMBO_SETTINGS.zoneOverDeg) return { zone: o + 1, key: s, delta: d }
    if (s < 0 && s > -COMBO_SETTINGS.zoneUnderDeg) return { zone: o + 1, key: s, delta: d }
  }
  return null
}

/** Mars 4/8 and Saturn 3/10 aspect points (always counted forward). */
export function aspectPoints(seat) {
  if (seat.key === 'mars') {
    return [
      { label: 'MAR4', from: 'mars', point: norm(seat.lon + 90) },
      { label: 'MAR8', from: 'mars', point: norm(seat.lon + 210) },
    ]
  }
  if (seat.key === 'saturn') {
    return [
      { label: 'SAT3', from: 'saturn', point: norm(seat.lon + 60) },
      { label: 'SAT10', from: 'saturn', point: norm(seat.lon + 270) },
    ]
  }
  return []
}

/**
 * One planet's combination: ordered entries [{ type, key|label, zone,
 * distance, percent }]. Ra/Ke as members are skipped in the source's 7th zone.
 * `opts.cusps` enables the parivartana "returned degree" catch (needs the
 * seat's bhava width; without cusps a 30° width is assumed).
 */
export function planetCombination(planetKey, seats, opts = {}) {
  const seat = seats[planetKey]
  const entries = []
  for (const other of Object.values(seats)) {
    if (other.key === planetKey) continue
    const m = memberOf(seat, other.lon)
    if (!m) continue
    if (isNode(other.key) && m.zone === 7) continue // R3
    // पास की ओर की छूट वाला ग्रह, परिवर्तन वाली सीट पर — उसे गुरु का "returned degree"
    // नियम (नीचे) अपने प्रतिशत के साथ जोड़ता है।
    if (m.key < 0 && seat.exchanged) continue
    entries.push({
      type: 'planet',
      key: other.key,
      zone: m.zone,
      distance: m.key,
      percent: planetToPlanetPercent(Math.max(0, m.key)),
      natalRetro: other.natalRetro,
    })
  }
  // R5 (राउंड 62, Claude 30-10-2026 — सर के software के 5 चार्टों से मिलान):
  // दृष्टि-बिंदु को एक "आभासी ग्रह" मानें। वह इस ग्रह की सूची में तभी आता है जब
  // बिंदु इस ग्रह के *अपने पहले* 30° क्षेत्र में हो — क्षेत्र ग्रह की अपनी गति की
  // दिशा में (मार्गी: आगे; वक्री व राहु-केतु: पीछे; AP में परिवर्तन वाली सीट की
  // गति)। 5/7/9 क्षेत्र में पड़ा बिंदु नहीं गिना जाता। पास की ओर
  // aspectForwardDeg तक की छूट (बिंदु ग्रह से इतना पीछे हो तब भी) — क्रम में सबसे पहले।
  // बिंदु स्वयं सदा सीधा गिना जाता है (aspectPoints) — अध्याय-07 नियम 9 सिर्फ़ दृष्टि
  // डालने वाले पर लागू है।
  for (const caster of Object.values(seats)) {
    for (const ap of aspectPoints(caster)) {
      if (ap.from === planetKey) continue
      const d = deltaTo(seat, ap.point)
      let key
      if (d <= 30) key = d
      else if (d >= 360 - COMBO_SETTINGS.aspectForwardDeg) key = d - 360 // पास की ओर छूट
      else continue
      entries.push({
        type: 'aspect',
        label: ap.label,
        from: ap.from,
        distance: key,
        percent: planetToPlanetPercent(Math.max(0, key)),
      })
    }
  }
  // Guru's "returned degree" catch (user 2026-10-07): after a parivartana the
  // planet "returns to its own place but takes the other's degree" — planets
  // sitting within `returnedCatchDeg` BEHIND that acquired degree (reverse
  // direction) join the combination. Kept out of the ordinary zone rules.
  if (seat.exchanged) {
    for (const other of Object.values(seats)) {
      if (other.key === planetKey) continue
      const back = norm(seat.lon - other.lon)
      if (back <= 0 || back > COMBO_SETTINGS.returnedCatchDeg) continue
      if (entries.some((e) => e.type === 'planet' && e.key === other.key)) continue
      let width = 30
      if (opts.cusps) {
        const b = bhavaIndexOf(seat.lon, opts.cusps)
        const a = opts.cusps[b - 1].longitude
        const c = opts.cusps[b % 12].longitude
        width = norm(c - a) || 360
      }
      entries.push({
        type: 'planet',
        key: other.key,
        zone: 1,
        distance: back,
        percent: planetToBhavaPercent(back, width),
        caught: true,
        natalRetro: other.natalRetro,
      })
    }
  }
  entries.sort((a, b) => a.distance - b.distance)
  return entries
}

/**
 * All nine planet combinations for a mode. Returns per planet
 * { list159, list1579 } — 1579 is the full list (zones 1-5-7-9);
 * 159 keeps only the 1-5-9-zone members (7th-zone members drop, aspects stay).
 * (159/1579 split verified against the user's software screenshots.)
 * `opts.cusps` is passed through for the returned-degree catch.
 */
export function planetCombinations(planets, mode = 'AP', opts = {}) {
  const seats = seatPositions(planets, mode)
  const out = {}
  for (const p of planets) {
    const full = planetCombination(p.key, seats, opts)
    out[p.key] = {
      list1579: full,
      list159: full.filter((e) => e.type === 'aspect' || e.zone !== 7),
    }
  }
  return out
}

/** R7 — the first planet met along the seat's direction (zones/signs ignored). */
export function astronomyPartner(planetKey, seats) {
  const seat = seats[planetKey]
  let best = null
  for (const other of Object.values(seats)) {
    if (other.key === planetKey) continue
    const d = deltaTo(seat, other.lon)
    if (d === 0) return other.key // same degree meets first
    if (!best || d < best.d) best = { key: other.key, d }
  }
  return best ? best.key : null
}

export function astronomyPartners(planets, mode = 'AP') {
  const seats = seatPositions(planets, mode)
  const out = {}
  for (const p of planets) out[p.key] = astronomyPartner(p.key, seats)
  return out
}

// ---------------------------------------------------------------------------
// Bhava combination rows (B-01 … B-12)
// ---------------------------------------------------------------------------

/** The bhava (1–12) containing a longitude, from the cusp ranges. */
export function bhavaIndexOf(lon, cusps) {
  const list = cusps.map((c) => c.longitude)
  for (let i = 0; i < 12; i++) {
    let a = list[i]
    let b = list[(i + 1) % 12]
    if (b <= a) b += 360
    let x = lon
    if (x < a) x += 360
    if (x >= a && x < b) return i + 1
  }
  return 12
}

/**
 * The old face's row-label suffix: { bhava, value } — the planet's closeness
 * to its own bhava in the plain form (no 0.942 factor). Natal position used
 * in both modes.
 */
export function labelSuffix(lon, cusps) {
  const b = bhavaIndexOf(lon, cusps)
  const a = cusps[b - 1].longitude
  const c = cusps[b % 12].longitude
  const d = norm(lon - a)
  const w = norm(c - a) || 360
  return { bhava: b, value: Math.round(planetToBhavaPlainPercent(d, w)) }
}

/**
 * Rows for both tabs. Returns { [n]: { list159, list1579 } } — each list is
 * ordered by closeness (percentage) descending. Aspect entries appear only in
 * the row of the bhava they land on (fixed 30° span; a point ≥30° past the
 * cusp is not listed — guru, 2026-10-08); in list1579 Ra/Ke in the n+6 bhava
 * are skipped.
 */
export function bhavaCombinations(planets, cusps, mode = 'AP') {
  const seats = seatPositions(planets, mode)
  const cuspList = cusps.map((c) => c.longitude)
  const bhavaOf = (lon) => bhavaIndexOf(lon, cusps)

  // Precompute entries for every bhava: planets + landed aspects.
  const perBhava = Array.from({ length: 13 }, () => [])
  for (const other of Object.values(seats)) {
    const b = bhavaOf(other.lon)
    const d = norm(other.lon - cuspList[b - 1])
    const w = norm(cuspList[b % 12] - cuspList[b - 1]) || 360
    perBhava[b].push({
      type: 'planet',
      key: other.key,
      distance: d,
      percent: planetToBhavaPercent(d, w),
      natalRetro: other.natalRetro,
    })
  }
  for (const caster of Object.values(seats)) {
    for (const ap of aspectPoints(caster)) {
      const b = bhavaOf(ap.point)
      const d = norm(ap.point - cuspList[b - 1])
      // Guru rule (2026-10-08, Gudiya check): the aspect is listed only while
      // the point sits within the fixed 30° span past the cusp; its percent is
      // 100×(1 − d/30) — NOT the planet width form. Points further out (like
      // B01's MAR4, d≈33°) are dropped instead of showing a negative percent.
      if (d >= 30) continue
      perBhava[b].push({
        type: 'aspect',
        label: ap.label,
        from: ap.from,
        distance: d,
        percent: aspectToBhavaPercent(d),
      })
    }
  }
  for (const list of perBhava) list.sort((a, b) => b.percent - a.percent)

  const bh = (n) => ((n - 1) % 12) + 1
  // Planets from the row's bhava set; aspect entries ONLY in the row of the
  // bhava they land on (row n == landed bhava).
  const planetsOf = (set) => set.flatMap((b) => perBhava[b]).filter((e) => e.type === 'planet')
  const aspectsOf = (n) => perBhava[n].filter((e) => e.type === 'aspect')
  const out = {}
  for (let n = 1; n <= 12; n++) {
    const set159 = [n, bh(n + 4), bh(n + 8)]
    const extra = bh(n + 6)
    const base = [...planetsOf(set159), ...aspectsOf(n)]
    const list159 = base.slice().sort((a, b) => b.percent - a.percent)
    const list1579 = [...base, ...planetsOf([extra]).filter((e) => !isNode(e.key))]
    list1579.sort((a, b) => b.percent - a.percent)
    out[n] = { list159, list1579 }
  }
  return out
}
