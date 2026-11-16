// sadesati.js — साढ़ेसाती और ढैया, birth to 100 years.
//
// Rule (classical gochara of Saturn from the natal Moon):
//   साढ़ेसाती = Saturn transiting the 12th, 1st or 2nd sign from the natal Moon
//               (three phases, ~7½ years in total)
//   ढैया     = Saturn in the 4th or the 8th from the natal Moon (~2½ years)
//
// The scan is a real ephemeris scan (Swiss Ephemeris, sidereal Lahiri): state
// is sampled every `stepDays` and each change is bisected down to the minute,
// so retrograde re-entries (Saturn slipping back over a sign boundary) appear
// as separate phases — exactly as they happen.

import { norm360 } from './frame.js'

export const MS_DAY = 86400000
export const JD_UNIX_EPOCH = 2440587.5

export const msToJd = (ms) => ms / MS_DAY + JD_UNIX_EPOCH
export const jdToMs = (jd) => (jd - JD_UNIX_EPOCH) * MS_DAY

export const SADESATI_HOUSES = [12, 1, 2]
export const DHAIYA_HOUSES = [4, 8]

// Which "state" is Saturn in, seen from the natal Moon?
export function saturnPhase(satRashi, moonRashi) {
  const house = ((satRashi - moonRashi + 12) % 12) + 1
  if (house === 12) {
    return { key: 'sadesati', phase: 12, phaseIndex: 1, hi: 'साढ़ेसाती — प्रथम चरण (चंद्र से 12वाँ)', en: 'Sade Sati — phase 1 (12th from Moon)' }
  }
  if (house === 1) {
    return { key: 'sadesati', phase: 1, phaseIndex: 2, hi: 'साढ़ेसाती — द्वितीय चरण (जन्म-चंद्र की राशि पर)', en: 'Sade Sati — phase 2 (on the natal Moon sign)' }
  }
  if (house === 2) {
    return { key: 'sadesati', phase: 2, phaseIndex: 3, hi: 'साढ़ेसाती — तृतीय चरण (चंद्र से 2रा)', en: 'Sade Sati — phase 3 (2nd from Moon)' }
  }
  if (house === 4 || house === 8) {
    return {
      key: 'dhaiya',
      phase: house,
      phaseIndex: 1,
      hi: house === 4 ? 'ढैया — चंद्र से चौथे में शनि' : 'ढैया — चंद्र से आठवें में शनि',
      en: house === 4 ? 'Dhaiya — Saturn in the 4th from the Moon' : 'Dhaiya — Saturn in the 8th from the Moon',
    }
  }
  return { key: 'none', phase: null, phaseIndex: 0, hi: 'सामान्य गोचर', en: 'No Sade Sati' }
}

export function saturnRashiAt(swe, jd) {
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED
  const r = swe.calc_ut(jd, swe.SE_SATURN, flags)
  return Math.floor(norm360(r[0]) / 30) % 12
}

const sameState = (a, b) => a.key === b.key && a.phase === b.phase

// Full scan: birth → birth + years.
export function computeSadesati(swe, { moonRashi, birthMs, years = 100, stepDays = 1, nowMs = Date.now() }) {
  const startJd = msToJd(birthMs)
  const endJd = startJd + years * 365.25
  const stateAt = (jd) => saturnPhase(saturnRashiAt(swe, jd), moonRashi)

  const raw = [] // every contiguous state run, including "none"
  let jd = startJd
  let curState = stateAt(jd)
  let curStartJd = jd
  while (jd < endJd) {
    const nextJd = Math.min(jd + stepDays, endJd)
    const nextState = stateAt(nextJd)
    if (!sameState(curState, nextState)) {
      let lo = jd
      let hi = nextJd
      for (let i = 0; i < 26; i++) {
        const mid = (lo + hi) / 2
        if (sameState(stateAt(mid), curState)) lo = mid
        else hi = mid
      }
      const boundaryJd = (lo + hi) / 2
      raw.push({ ...curState, fromJd: curStartJd, toJd: boundaryJd })
      curStartJd = boundaryJd
      curState = nextState
    }
    jd = nextJd
  }
  raw.push({ ...curState, fromJd: curStartJd, toJd: endJd })

  // Merge the runs into periods: a साढ़ेसाती period keeps all three phases
  // together even when Saturn wobbles across a boundary.
  const periods = []
  for (const run of raw) {
    if (run.key === 'none') continue
    const last = periods[periods.length - 1]
    const fromMs = jdToMs(run.fromJd)
    const toMs = jdToMs(run.toJd)
    if (last && last.kind === run.key && Math.abs(last.toMs - fromMs) < 1) {
      last.toMs = toMs
      last.phases.push({ phase: run.phase, fromMs, toMs, hi: run.hi, en: run.en })
    } else {
      periods.push({
        kind: run.key,
        label: run.key === 'sadesati' ? 'साढ़ेसाती' : 'ढैया',
        labelEn: run.key === 'sadesati' ? 'Sade Sati' : 'Dhaiya',
        fromMs,
        toMs,
        phases: [{ phase: run.phase, fromMs, toMs, hi: run.hi, en: run.en }],
      })
    }
  }

  // Cycles: a साढ़ेसाती that pauses for a few months (Saturn slipping into the
  // 11th and coming back) is still ONE cycle for a reader. Gaps up to a year are
  // merged; the individual segments stay available in `phases`.
  const cycleOf = (list) => {
    const out = []
    for (const p of list) {
      const last = out[out.length - 1]
      // ढैया के दो रूप (चौथा / आठवाँ) अलग गिने जाते हैं — उन्हें आपस में मत मिलाओ
      const samePhase = !last || last.kind === 'sadesati' || last.phases[last.phases.length - 1].phase === p.phases[0].phase
      if (last && samePhase && p.fromMs - last.toMs <= 365 * MS_DAY) {
        last.toMs = p.toMs
        last.phases.push(...p.phases)
        last.segments.push({ fromMs: p.fromMs, toMs: p.toMs })
      } else {
        out.push({
          kind: p.kind,
          label: p.label,
          labelEn: p.labelEn,
          fromMs: p.fromMs,
          toMs: p.toMs,
          phases: [...p.phases],
          segments: [{ fromMs: p.fromMs, toMs: p.toMs }],
        })
      }
    }
    return out
  }

  // चक्र के चरण: हर चरण = शनि का उस राशि में **पहला प्रवेश** → अगली राशि में
  // **पहला प्रवेश** (टास्क 05-ग). इसलिए चरण कभी overlap नहीं करते; वक्री से
  // लौटना अलग `notes` में जाता है, चरण की तारीख़ में नहीं.
  const cleanCycle = (c) => {
    const runs = raw
      .map((r) => ({ ...r, fromMs: jdToMs(r.fromJd), toMs: jdToMs(r.toJd) }))
      .filter((r) => r.toMs > c.fromMs + 1 && r.fromMs < c.toMs - 1)
      .sort((a, b) => a.fromMs - b.fromMs)
    const kindRuns = runs.filter((r) => r.key === c.kind)
    const order = c.kind === 'sadesati' ? SADESATI_HOUSES : [c.phases[0].phase]
    const present = new Set(kindRuns.map((r) => r.phase))
    const firstPhase = kindRuns[0]?.phase ?? c.phases[0].phase
    const seq = order.filter((ph) => present.has(ph))
    const use = seq.slice(Math.max(0, seq.indexOf(firstPhase)))
    const firstEntry = (phase) => kindRuns.find((r) => r.phase === phase)?.fromMs ?? null
    const phases = []
    for (let i = 0; i < use.length; i++) {
      const start = i === 0 ? c.fromMs : firstEntry(use[i])
      const next = use[i + 1] ? firstEntry(use[i + 1]) : null
      const end = next && next > start ? next : c.toMs
      if (!(end > start)) continue
      phases.push({ phase: use[i], fromMs: start, toMs: end, hi: runHi(c.kind, use[i]).hi, en: runHi(c.kind, use[i]).en })
    }
    // अंतराल (शनि बाहर): "पीछे लौटा" या "आगे गया, फिर लौटा" — राशि से तय
    const trio = c.kind === 'sadesati'
      ? [(moonRashi + 11) % 12, moonRashi, (moonRashi + 1) % 12]
      : [(moonRashi + c.phases[0].phase - 1) % 12]
    const first = trio[0], last = trio[trio.length - 1]
    const notes = []
    for (let i = 1; i < kindRuns.length; i++) {
      const gap = kindRuns[i].fromMs - kindRuns[i - 1].toMs
      if (gap <= 30 * MS_DAY) continue
      const rashi = saturnRashiAt(swe, msToJd((kindRuns[i - 1].toMs + kindRuns[i].fromMs) / 2))
      const dir = rashi === (first + 11) % 12 ? 'back' : rashi === (last + 1) % 12 ? 'forward' : 'pause'
      notes.push({ fromMs: kindRuns[i - 1].toMs, toMs: kindRuns[i].fromMs, rashi, dir })
    }
    return { ...c, phases, notes }
  }
  const runHi = (kind, phase) => {
    if (kind === 'sadesati') return saturnPhase(phase, moonRashi)
    return saturnPhase(phase, moonRashi)
  }

  const sadesati = periods.filter((p) => p.kind === 'sadesati')
  const dhaiya = periods.filter((p) => p.kind === 'dhaiya')
  const sadesatiCycles = cycleOf(sadesati).map(cleanCycle)
  const dhaiyaCycles = cycleOf(dhaiya).map(cleanCycle)
  const running = periods.find((p) => nowMs >= p.fromMs && nowMs < p.toMs) ?? null
  const upcoming = periods.find((p) => p.fromMs > nowMs) ?? null

  return {
    moonRashi,
    sadesati,
    dhaiya,
    // merged view (a pause of a few months does not end the cycle)
    sadesatiCycles,
    dhaiyaCycles,
    current: running
      ? {
          ...running,
          runningPhase: running.phases.find((ph) => nowMs >= ph.fromMs && nowMs < ph.toMs) ?? running.phases[running.phases.length - 1],
        }
      : null,
    next: upcoming,
    // the next Saturn sign change, useful for the "अगले 2 वर्ष" line
    scannedUntilMs: jdToMs(endJd),
  }
}
