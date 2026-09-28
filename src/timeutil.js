// timeutil.js — local birth time → UTC conversions (Phase 4).
// Uses the browser's built-in timezone database via Intl.DateTimeFormat, so
// historical rules work automatically (e.g. India's 1942–45 wartime +06:30),
// plus an optional manual UTC-offset override for very old births.
// Julian Day (UT) is produced via the Swiss Ephemeris `julday` function.

// "+05:30" | "-8" | "5:30" → minutes east of UTC; null if not an offset.
export function parseUtcOffset(text) {
  const m = /^([+-]?)(\d{1,2})(?::([0-5]\d))?$/.exec(String(text).trim())
  if (!m) return null
  const sign = m[1] === '-' ? -1 : 1
  const minutes = sign * (Number(m[2]) * 60 + Number(m[3] ?? 0))
  if (minutes < -12 * 60 || minutes > 14 * 60) return null
  return minutes
}

// 330 → "+05:30"; -480 → "-08:00"
export function formatUtcOffset(minutes) {
  const sign = minutes < 0 ? '-' : '+'
  const abs = Math.abs(minutes)
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

// Is this a usable IANA time zone name for Intl? ("Asia/Kolkata", "UTC", …)
export function isValidTimeZone(name) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: name })
    return true
  } catch {
    return false
  }
}

// The time zone's actual offset (minutes east of UTC) at a UTC instant.
export function offsetAt(utcMs, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = {}
  for (const p of dtf.formatToParts(new Date(utcMs))) parts[p.type] = p.value
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  )
  return Math.round((asUtc - utcMs) / 60000)
}

// Local wall-clock time in a zone → the UTC instant (ms).
// Iterated, because the zone's offset depends on the instant itself (DST).
// For skipped/ambiguous local times (the DST-change hours) this settles on
// the neighbouring hour's interpretation — the same as common libraries.
function wallInZoneToUtcMs(year, month, day, hour, minute, second, timeZone) {
  const wallMs = Date.UTC(year, month - 1, day, hour, minute, second)
  let guess = wallMs
  for (let i = 0; i < 3; i++) {
    const next = wallMs - offsetAt(guess, timeZone) * 60000
    if (next === guess) break
    guess = next
  }
  return guess
}

// Convert a birth wall-clock time to UTC.
// `zone` may be an IANA name ("Asia/Kolkata") or a fixed offset ("+05:30").
// Returns { utc: {year,month,day,hour,minute,second}, offsetMinutes, offsetText }.
export function wallTimeToUtc(birth, zone) {
  const { year, month, day, hour, minute, second } = birth
  const fixed = parseUtcOffset(zone)
  let utcMs
  let offsetMinutes
  if (fixed !== null) {
    utcMs = Date.UTC(year, month - 1, day, hour, minute, second) - fixed * 60000
    offsetMinutes = fixed
  } else {
    utcMs = wallInZoneToUtcMs(year, month, day, hour, minute, second, zone)
    offsetMinutes = offsetAt(utcMs, zone)
  }
  const dt = new Date(utcMs)
  return {
    utc: {
      year: dt.getUTCFullYear(),
      month: dt.getUTCMonth() + 1,
      day: dt.getUTCDate(),
      hour: dt.getUTCHours(),
      minute: dt.getUTCMinutes(),
      second: dt.getUTCSeconds(),
    },
    offsetMinutes,
    offsetText: formatUtcOffset(offsetMinutes),
  }
}

// Julian Day (UT) using the Swiss Ephemeris
// `julday(year, month, day, hourDecimal)` function (pass it in — the WASM
// engine lives in astro.js).
export function toJulianDay(utc, julday) {
  const hourDecimal = utc.hour + utc.minute / 60 + utc.second / 3600
  return julday(utc.year, utc.month, utc.day, hourDecimal)
}
