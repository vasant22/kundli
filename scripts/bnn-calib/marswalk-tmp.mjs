import SwissEph from 'swisseph-wasm'
const swe = new SwissEph(); await swe.initSwissEph(); swe.set_sid_mode(44,0,0)
const lonAt = (ms) => { const d = new Date(ms); const hour = d.getUTCHours()+d.getUTCMinutes()/60+d.getUTCSeconds()/3600; const jd = swe.julday(d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate(), hour); const jdt = jd+swe.deltat(jd)+0.5/86400; const r = swe.calc_ut(jdt, swe.SE_MARS, swe.SEFLG_SWIEPH|swe.SEFLG_SIDEREAL|swe.SEFLG_SPEED); return { lon: r[0], speed: r[3] } }
const fmt = (ms) => { const d = new Date(ms); const p = (n)=>String(n).padStart(2,'0'); return `${p(d.getUTCDate())}-${p(d.getUTCMonth()+1)}-${d.getUTCFullYear()}` }
console.log('mars 2027 Jan-Apr, weekly (lon, speed):')
for (let t = Date.UTC(2027,0,1); t <= Date.UTC(2027,4,20); t += 7*86400000) { const r = lonAt(t); console.log(fmt(t), r.lon.toFixed(3), r.speed.toFixed(4)) }
console.log('DONE')
