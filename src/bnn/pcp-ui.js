// pcp-ui.js — the "Special Transit" section for the BNN page (legacy PCP).
// Renders: transit-group tabs (All / Rahu-Kethu / Saturn-Guru), the birth
// planet picker, ●1579/●159, a start/end range, a Find button, and the
// per-transit-planet result tables (PLANET | DATE | ASPECT | RETRO).
// Engine: pcp.js (calibrated 15/15 against the legacy Mars table).
import { t } from '../i18n.js'
import { wallTimeToUtc } from '../timeutil.js'
import { computeSpecialTransit } from './pcp.js'

const el = (tag, cls, text) => {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text !== undefined) n.textContent = text
  return n
}

const HI_NAME = {
  sun: 'सूर्य', moon: 'चंद्र', mars: 'मंगल', mercury: 'बुध', jupiter: 'गुरु',
  venus: 'शुक्र', saturn: 'शनि', rahu: 'राहु', ketu: 'केतु',
}
const CODE = {
  sun: 'SUN', moon: 'MOO', mars: 'MAR', mercury: 'MER', jupiter: 'JUP',
  venus: 'VEN', saturn: 'SAT', rahu: 'RAH', ketu: 'KET',
}
const CONST_NAME = {
  sun: 'SE_SUN', moon: 'SE_MOON', mars: 'SE_MARS', mercury: 'SE_MERCURY',
  jupiter: 'SE_JUPITER', venus: 'SE_VENUS', saturn: 'SE_SATURN',
}

const pad = (n) => String(n).padStart(2, '0')
const dateMsToWall = (ms, zone) => {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone, day: '2-digit', month: '2-digit', year: 'numeric',
    }).formatToParts(new Date(ms))
    const g = (k) => parts.find((p) => p.type === k)?.value
    return `${g('day')}-${g('month')}-${g('year')}`
  } catch {
    const d = new Date(ms)
    return `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`
  }
}

/** lonAt(tMs) factory for a planet via the loaded Swiss Ephemeris. */
function makeLonAt(swe, key) {
  const constName = CONST_NAME[key]
  return (ms) => {
    const d = new Date(ms)
    const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600
    const jd = swe.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), hour)
    const jdt = jd + swe.deltat(jd) + 0.5 / 86400
    const r = swe.calc_ut(jdt, swe[constName], swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED)
    return { lon: r[0], speed: r[3] }
  }
}

const GROUPS = ['all', 'nodes', 'sg']

export function buildSpecialTransitSection(values, opts) {
  const { getSwe } = opts
  const section = el('div', 'bnn-section bnn-st-section')
  section.append(el('h3', 'bnn-table-title', t('st.title')))
  section.append(el('p', 'bnn-st-intro', t('st.intro')))

  // --- controls -------------------------------------------------------------
  const controls = el('div', 'bnn-st-controls')

  // transit group tabs
  const groupBar = el('div', 'bnn-tabs bnn-st-groups')
  const groupButtons = new Map()
  for (const g of GROUPS) {
    const b = el('button', null, t(`st.group.${g}`))
    b.type = 'button'
    b.addEventListener('click', () => {
      values.stGroup = g
      paintGroup()
    })
    groupButtons.set(g, b)
    groupBar.append(b)
  }
  const paintGroup = () => {
    for (const [g, b] of groupButtons) {
      const on = (values.stGroup || 'sg') === g
      b.classList.toggle('active', on)
      b.setAttribute('aria-pressed', String(on))
    }
  }

  // birth planet picker
  const birthRow = el('div', 'bnn-st-row')
  birthRow.append(el('span', 'bnn-st-label', t('st.birth')))
  const birthWrap = el('span', 'bnn-st-radios')
  const birthButtons = new Map()
  const planetKeys = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu']
  for (const key of planetKeys) {
    const b = el('button', 'bnn-st-chip', `${HI_NAME[key]}`)
    b.type = 'button'
    b.addEventListener('click', () => {
      values.stBirth = key
      paintBirth()
    })
    birthButtons.set(key, b)
    birthWrap.append(b)
  }
  const paintBirth = () => {
    for (const [k, b] of birthButtons) {
      const on = (values.stBirth || 'sun') === k
      b.classList.toggle('active', on)
      b.setAttribute('aria-pressed', String(on))
    }
  }
  birthRow.append(birthWrap)

  // mode + dates + find
  const findRow = el('div', 'bnn-st-row')
  const modeWrap = el('span', 'bnn-st-radios')
  const modeButtons = new Map()
  for (const m of ['1579', '159']) {
    const b = el('button', 'bnn-st-chip', m)
    b.type = 'button'
    b.addEventListener('click', () => {
      values.stMode = m
      paintMode()
    })
    modeButtons.set(m, b)
    modeWrap.append(b)
  }
  const paintMode = () => {
    for (const [m, b] of modeButtons) {
      const on = (values.stMode || '1579') === m
      b.classList.toggle('active', on)
      b.setAttribute('aria-pressed', String(on))
    }
  }
  const startLabel = el('span', 'bnn-st-label', t('st.start'))
  const startInput = document.createElement('input')
  startInput.type = 'date'
  startInput.className = 'bnn-st-date'
  startInput.value = values.stStart || ''
  startInput.addEventListener('change', () => {
    values.stStart = startInput.value
  })
  const endLabel = el('span', 'bnn-st-label', t('st.end'))
  const endInput = document.createElement('input')
  endInput.type = 'date'
  endInput.className = 'bnn-st-date'
  endInput.value = values.stEnd || ''
  endInput.addEventListener('change', () => {
    values.stEnd = endInput.value
  })
  const findBtn = el('button', 'bnn-st-find', t('st.find'))
  findBtn.type = 'button'
  const printBtn = el('button', 'bnn-st-print-btn', t('st.print'))
  printBtn.type = 'button'
  printBtn.addEventListener('click', () => {
    document.getElementById('bnn-st-print')?.remove()
    const sheet = el('div', 'bnn-st-sheet')
    sheet.id = 'bnn-st-print'
    sheet.append(el('h2', null, t('st.title')))
    const meta = el('p', 'bnn-st-sheet-meta',
      `${t('st.birth')}: ${HI_NAME[values.stBirth || 'sun']} · ${values.stMode || '1579'} · ${values.stStart} → ${values.stEnd}`)
    sheet.append(meta)
    sheet.append(results.cloneNode(true))
    document.body.append(sheet)
    document.body.classList.add('bnn-st-printing')
    const cleanup = () => {
      document.body.classList.remove('bnn-st-printing')
      sheet.remove()
    }
    window.addEventListener('afterprint', cleanup, { once: true })
    try {
      window.print()
    } catch {
      cleanup()
    }
  })
  findRow.append(modeWrap, startLabel, startInput, endLabel, endInput, findBtn, printBtn)
  controls.append(groupBar, birthRow, findRow)
  section.append(controls)

  // --- results --------------------------------------------------------------
  const results = el('div', 'bnn-st-results')
  section.append(results)

  const renderRows = (st) => {
    if (!st) return
    const birthCode = CODE[values.stBirth || 'sun']
    results.replaceChildren()
    let any = false
    for (const p of st) {
      if (!p.segments || p.segments.length === 0) {
        continue
      }
      any = true
      const wrap = el('div', 'bnn-st-tablewrap')
      wrap.append(el('div', 'bnn-st-title', `TRANSIT ${p.planet} (${HI_NAME[p.key]})`))
      const table = el('table', 'bnn-table bnn-st-table')
      const head = document.createElement('tr')
      for (const h of ['PLANET', 'DATE', t('st.aspect'), t('st.retro')]) {
        head.append(el('th', null, h))
      }
      table.append(head)
      p.segments.forEach((seg, si) => {
        const pairCls = si % 2 === 0 ? 'pair-a' : 'pair-b'
        const label = `${birthCode}-${seg.k}`
        for (const [aspect, ms] of [['Start', seg.startMs], ['End', seg.endMs]]) {
          const tr = document.createElement('tr')
          tr.className = pairCls
          const retroFlag = seg.flags ? seg.flags[aspect === 'Start' ? 0 : 1] : 'F'
          tr.append(el('td', 'st-label', label), el('td', null, dateMsToWall(ms, values.bnnZone)), el('td', null, aspect), el('td', null, retroFlag))
          table.append(tr)
        }
      })
      wrap.append(table)
      results.append(wrap)
    }
    if (!any) {
      results.append(el('p', 'bnn-st-empty', t('st.none')))
    }
  }

  const doFind = () => {
    const swe = getSwe()
    if (!swe || !values.bnn) return
    const startISO = values.stStart
    const endISO = values.stEnd
    if (!startISO || !endISO) return
    const [sy, sm, sd] = startISO.split('-').map(Number)
    const [ey, em, ed] = endISO.split('-').map(Number)
    let tStartMs
    let tEndMs
    const wallMs = (wall) => {
      try {
        const conv = wallTimeToUtc(wall, values.bnnZone)
        const u = conv.utc
        return Date.UTC(u.year, u.month - 1, u.day, u.hour, u.minute, u.second)
      } catch {
        return Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour || 0, wall.minute || 0, wall.second || 0)
      }
    }
    tStartMs = wallMs({ year: sy, month: sm, day: sd, hour: 0, minute: 0, second: 0 })
    tEndMs = wallMs({ year: ey, month: em, day: ed, hour: 23, minute: 59, second: 59 })
    if (!(tStartMs < tEndMs)) return

    findBtn.disabled = true
    results.replaceChildren(el('p', 'bnn-st-empty', t('st.computing')))
    // let the "computing" paint first
    setTimeout(() => {
      try {
        const birth = values.bnn.planets.find((p) => p.key === (values.stBirth || 'sun'))
        const lonAtFor = (key) => makeLonAt(swe, key)
        const st = computeSpecialTransit(lonAtFor, {
          tStartMs,
          tEndMs,
          zSign: birth.rashi,
          zDeg: birth.degInSign,
          mode: values.stMode || '1579',
          group: values.stGroup || 'sg',
          birthKey: values.stBirth || 'sun',
        })
        // attach the F/R flags (speed sign at the event instant)
        for (const p of st) {
          const lonAt = makeLonAt(swe, p.key)
          for (const seg of p.segments) {
            seg.flags = [lonAt(seg.startMs).speed < 0 ? 'R' : 'F', lonAt(seg.endMs).speed < 0 ? 'R' : 'F']
          }
        }
        values.stResult = st
        renderRows(st)
      } catch (err) {
        console.error('Special Transit failed:', err)
        results.replaceChildren(el('p', 'bnn-st-empty', t('st.none')))
      } finally {
        findBtn.disabled = false
      }
    }, 30)
  }
  findBtn.addEventListener('click', doFind)

  // initial state + first render (defaults: today-in-zone → +1 month)
  const nowWall = values.stStart ? null : nowInZone(values.bnnZone)
  if (!values.stStart && nowWall) {
    values.stStart = `${nowWall.year}-${pad(nowWall.month)}-${pad(nowWall.day)}`
    const end = addMonth(nowWall, 1)
    values.stEnd = `${end.year}-${pad(end.month)}-${pad(end.day)}`
    startInput.value = values.stStart
    endInput.value = values.stEnd
  }
  paintGroup()
  paintBirth()
  paintMode()
  renderRows(values.stResult)

  return section
}

function nowInZone(zone) {
  const now = new Date()
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: zone || undefined, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
    }).formatToParts(now)
    const g = (k) => Number(parts.find((p) => p.type === k)?.value ?? 0)
    return { year: g('year'), month: g('month'), day: g('day') }
  } catch {
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
  }
}

function addMonth(w, n) {
  const d = new Date(Date.UTC(w.year, w.month - 1 + n, w.day))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}
