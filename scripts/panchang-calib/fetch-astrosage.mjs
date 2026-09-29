// Fetch AstroSage daily-panchang values for a list of dates, parse the fields we
// calibrate against, and write them to scripts/panchang-calib/astrosage.json.
// Usage: node scripts/panchang-calib/fetch-astrosage.mjs [dd-mm-yyyy ...]
// Default set = all month boundaries + a full week sample (2026–2027) used in the
// Phase-1 formula work. Raw HTML is cached under .openclaw/tmp/panchang-calib/raw/
// (workspace tmp, not committed).
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const OUT = new URL('./astrosage.json', import.meta.url).pathname
const RAW_DIR = path.join(os.homedir(), '.openclaw-autoclaw/workspace/.openclaw/tmp/panchang-calib/raw')
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36'

const DEFAULT_DATES = [
  // week sample (all weekdays)
  '24-09-2026', '25-09-2026', '26-09-2026', '27-09-2026', '28-09-2026', '29-09-2026', '30-09-2026',
  // 2026 boundaries (2–3 days around each sankranti)
  '15-01-2026', '11-02-2026', '12-02-2026', '13-02-2026', '14-02-2026', '15-03-2026', '16-03-2026',
  '13-04-2026', '14-04-2026', '15-04-2026', '16-04-2026', '17-04-2026', '14-05-2026', '15-05-2026', '16-05-2026',
  '14-06-2026', '15-06-2026', '16-06-2026', '15-07-2026', '16-07-2026', '17-07-2026', '18-07-2026',
  '15-08-2026', '16-08-2026', '17-08-2026', '18-08-2026', '16-09-2026', '17-09-2026', '18-09-2026',
  '16-10-2026', '17-10-2026', '18-10-2026', '19-10-2026', '15-11-2026', '16-11-2026', '17-11-2026',
  '15-12-2026', '16-12-2026', '17-12-2026', '13-01-2027', '14-01-2027', '15-01-2027', '16-01-2027',
  // adhika maasa 2026 sample
  '20-05-2026', '25-05-2026', '01-06-2026', '08-06-2026', '13-06-2026',
]

const LABELS = ['Tithi', 'Nakshatra', 'Karana', 'Paksha', 'Yoga', 'Day', 'Sun Rise', 'Sun Set', 'Moon Sign',
  'Moon Rise', 'Moon Set', 'Ritu', 'Shaka Samvat', 'Vikram Samvat', 'Kali Samvat', 'Pravishte / Gate',
  'Month Purnimanta', 'Month Amanta', 'Day Duration', 'Dushta Muhurtas', 'Kulika', 'Kantaka / Mrityu',
  'Rahu Kaal', 'Kalavela / Ardhayaam', 'Yamaghanta', 'Yamaganda', 'Gulika Kaal', 'Abhijit', 'Disha Shoola',
  'Tara Bala', 'Chandra Bala']

function clean(v) {
  return v
    .replace(/title='[^']*'/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function val(html, label) {
  const pat = new RegExp(
    `<b[^>]*>\\s*(?:<a[^>]*>\\s*)?(?:<u>\\s*)?${label.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*(?:</u>\\s*)?(?:</a>\\s*)?</b>\\s*</div>\\s*<div class="col-xs-7 col-sm-8">(.*?)</div>`,
    's'
  )
  const m = html.match(pat)
  return m ? clean(m[1]) : null
}

async function fetchOne(date, lang = 'en') {
  fs.mkdirSync(RAW_DIR, { recursive: true })
  const fn = path.join(RAW_DIR, `${date}${lang === 'en' ? '' : '_' + lang}.html`)
  if (fs.existsSync(fn) && fs.statSync(fn).size > 50000) return fs.readFileSync(fn, 'utf8')
  const url = `https://panchang.astrosage.com/panchang/aajkapanchang?date=${date}&language=${lang}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  const html = await res.text()
  fs.writeFileSync(fn, html)
  await new Promise((r) => setTimeout(r, 600))
  return html
}

const dates = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_DATES
const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
for (const d of dates) {
  const html = await fetchOne(d)
  const rec = { _date: d }
  const title = html.match(/<title>Today Panchang: ([^<]+)<\/title>/)
  rec._title = title ? title[1] : ''
  for (const l of LABELS) rec[l] = val(html, l)
  out[d] = rec
  console.log(d, '->', rec.Tithi)
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1))
console.log('saved', OUT, Object.keys(out).length, 'records')
