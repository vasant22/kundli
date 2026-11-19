// अंक ज्योतिष का फलादेश-पन्ना — `buildAnkData()` का JSON + text-hi.js के वाक्य → HTML।
// यहाँ कोई नया वाक्य नहीं बनता: सारा पाठ text-hi.js से आता है, सिर्फ़ जोड़ा जाता है।
// अध्याय-क्रम, tone और classes design-kit के हूबहू।

import * as T from './text-hi.js';
import { orb, loshuSvg, gaugeSvg, ringSvg, starfield, NC, BADGE } from './viz.js';

const esc = (s) =>
  String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const TONE_CLASS = { shubh: 's', mishr: 'm', savdhan: 'c' };
/** tone हमेशा रंग + शब्द दोनों */
const tone = (t) => `<span class="tone ${TONE_CLASS[t] || 's'}">${esc(T.TONE[t] || T.TONE.shubh)}</span>`;
// निर्णय (उत्तम/अच्छा/सामान्य/…): रंग tone से, शब्द निर्णय का अपना label
const decTone = (dec) => `<span class="tone ${TONE_CLASS[dec.tone] || 'm'}">${esc(dec.label || '')}</span>`;
const clsTone = (cls) => tone((T.CLS[cls] || {}).tone || 'shubh');
const clsLabel = (cls) => (T.CLS[cls] || {}).label || '';

/** {n} {m} {b} {t} {f} भरो */
function fill(str, v) {
  return String(str || '').replace(/\{(n|m|b|t|f)\}/g, (_, k) => (v[k] === undefined || v[k] === null ? '' : String(v[k])));
}

// अंक हर जगह अंग्रेज़ी (0-9) में — orb, form और तालिकाएँ एक-से दिखें; देवनागरी अंक सिर्फ़ अध्याय-क्रम और पृष्ठ-संख्या में।
const digitsHi = (s) => String(s);
const hiDate = (iso) => {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  if (!y) return '';
  return `${digitsHi(d)} ${T.MONTHS[m - 1] || ''} ${digitsHi(y)}`;
};

const keysHtml = (d) => {
  const m = d.core.mulank;
  const b = d.core.bhagyank;
  const n = d.name.chaldean.namank;
  return `<div class="keys">
    <div class="key">${orb(m, 'sm')}<div><div class="k">मूलांक ${m} · ${esc(d.core.planets.mulank.hi)}</div><div class="v">${esc(T.MULANK[m].title)}</div></div></div>
    <div class="key">${orb(b, 'sm')}<div><div class="k">भाग्यांक ${b} · ${esc(d.core.planets.bhagyank.hi)}</div><div class="v">${esc(T.MULANK[b].title)}</div></div></div>
    <div class="key">${orb(n, 'sm')}<div><div class="k">नामांक ${n} · योग ${d.name.chaldean.compound}</div><div class="v">${esc(T.MULANK[n].title)}</div></div></div>
  </div>`;
};

const luckyChips = (d) => {
  const chips = [];
  for (const n of d.remedy.lucky.numbers) chips.push(`<span class="chip-n good">${n}</span>`);
  chips.push(`<span class="chip-n">${esc(T.MULANK[d.core.mulank].colors)}</span>`);
  for (const day of d.remedy.powerDays) chips.push(`<span class="chip-n good">${esc(day)}</span>`);
  if (d.remedy.careDay) chips.push(`<span class="chip-n care">${esc(d.remedy.careDay)} — सावधानी</span>`);
  return `<div class="chips-l">${chips.join('')}</div>`;
};

const mbText = (d) => {
  const r = d.core.relation;
  if (d.core.mulank === d.core.bhagyank) return T.MB_SAME;
  return T.MB_PAIR[`${r.mulankBhagyank}${r.bhagyankMulank}`] || T.MB_PAIR.mm;
};

const breakdownHtml = (d) => {
  const s = d.name.score;
  const v = { n: s.single, m: d.core.mulank, b: d.core.bhagyank, t: s.total, f: s.first.total };
  const rows = s.breakdown.map((b) => {
    const text = T.BREAKDOWN[b.key] ? fill(T.BREAKDOWN[b.key], v) : b.key;
    const c = b.value > 0 ? 'p' : b.value < 0 ? 'n' : 'z';
    const val = `${b.value > 0 ? '+' : ''}${b.value}`;
    return `<li>${esc(text)}<em class="${c}">${val}</em></li>`;
  });
  rows.push(`<li style="background:var(--dawn);font-weight:700">कुल ${s.raw} ÷ 9 × 10<em class="z">${s.score10}</em></li>`);
  return `<ul class="bd">${rows.join('')}</ul>`;
};

const lettersHtml = (d) => d.name.chaldean.words
  .map((w) => `<div class="word">${w.letters.map((l) => `<div class="lt"><b>${esc(l.ch)}</b><span style="background:${NC(l.value)}">${l.value}</span></div>`).join('')}<span class="sum">= ${w.total}</span></div>`)
  .join('');

const suggestHtml = (d) => {
  const list = d.name.suggestions;
  const s = d.name.score;
  if (!list.length) {
    const msg = s.score10 >= 8 ? T.SUGGEST.notNeeded : T.SUGGEST.none;
    return `<p class="txt">${esc(msg)}</p>`;
  }
  return `<p class="txt">${esc(T.SUGGEST.intro)}</p>
    <div class="sugg">${list.map((x) => `<div class="sg"><div class="nm">${esc(x.full)}</div><div class="hi">योग ${x.total} · नामांक ${x.single}</div><div class="sc">${x.score10}<small>${esc((T.NAME_DECISION[x.decision] || {}).label || '')}</small></div></div>`).join('')}</div>
    <div class="box dawn" style="margin-top:10px">${esc(T.SUGGEST.caution)}</div>`;
};

const newNamesHtml = (d) => {
  const list = d.name.newNames;
  if (!list.length) return `<p class="txt">${esc(T.SUGGEST.newNone)}</p>`;
  const intro = list[0].fallback ? T.SUGGEST.newFallback : T.SUGGEST.newIntro;
  return `<p class="txt">${esc(intro)}</p>
    <div class="sugg">${list.map((x) => `<div class="sg"><div class="nm">${esc(x.full)}</div><div class="hi">${esc(x.hi || '')}</div><div class="sc">${x.score10}<small>${esc((T.NAME_DECISION[x.decision] || {}).label || '')}</small></div></div>`).join('')}</div>`;
};

const planesHtml = (d) => T.LOSHU_PLANES
  ? Object.entries(T.LOSHU_PLANES).map(([key, txt]) => {
    const line = d.loshu.lines.find((l) => l.key === key);
    const full = line ? line.complete : false;
    const empty = line ? line.present === 0 : false;
    let note = '';
    let label = esc(line.hi);
    if (full) { label = `${esc(line.hi)} ${tone('shubh')}`; note = `<br><span style="font-size:12.5px">${esc(txt.complete)}</span>`; }
    else if (empty && txt.empty) note = `<br><span style="font-size:12.5px">${esc(txt.empty)}</span>`;
    return `<li><span class="dots">${line.digits.map((x) => `<i class="${d.loshu.counts[x] ? '' : 'off'}" style="background:${NC(x)}">${x}</i>`).join('')}</span><span>${label}${note}</span></li>`;
  }).join('')
  : '';

const lostuCountKey = (k) => (k === 0 ? 'missing' : k === 1 ? 'one' : k === 2 ? 'two' : 'many');

const presentRows = (d) => Object.keys(d.loshu.counts)
  .filter((n) => d.loshu.counts[n] > 0)
  .map((n) => `<tr><td>${orb(Number(n), 'xs')}</td><td>${digitsHi(d.loshu.counts[n])} बार</td><td>${esc(T.LOSHU_NUM[n][lostuCountKey(d.loshu.counts[n])])}</td></tr>`)
  .join('');

const missingRows = (d) => d.loshu.missing
  .map((n) => `<tr><td>${orb(n, 'xs')}</td><td>${esc(T.LOSHU_NUM[n].missing)}</td><td>${esc(T.MISSING_UPAY[`missing-${n}`] || '')}</td></tr>`)
  .join('');

const kuaHtml = (d) => {
  const k = d.loshu.kua;
  if (!k) return `<p class="txt">${esc(T.KUA.noGender)}</p><p class="txt"><small>${esc(T.KUA.note)}</small></p>`;
  const info = T.KUA[k] || {};
  const feb = d.core.dob && d.core.dob.month === 2 && d.core.dob.day <= 4;
  return `<div class="box"><b class="h">${esc(T.KUA.title)} ${k} — ${esc((T.KUA.group || {})[info.group] || '')}</b>
    <p class="txt">सबसे अनुकूल दिशा <b>${esc(info.best || '')}</b>${info.good ? `; अन्य अनुकूल: ${esc(info.good)}` : ''}। ${esc(T.KUA.tip)}</p>
    ${feb ? `<p class="txt"><small>${esc(T.KUA.febNote)}</small></p>` : ''}
    <p class="txt"><small>${esc(T.KUA.note)}</small></p></div>`;
};

const yearsHtml = (d) => d.time.forecast10
  .map((y, i) => `<div class="yr${i === 0 ? ' now' : ''}"><div class="y">${digitsHi(y.year)}</div><div class="n" style="background:${NC(y.personalYear)}">${y.personalYear}</div><div class="l">${esc((T.PERSONAL_YEAR[y.personalYear] || {}).label || '')}</div><div class="a">${esc(T.AGE_LABEL)} ${digitsHi(y.age)}</div></div>`)
  .join('');

const monthsHtml = (d) => d.time.forecast12
  .map((m) => `<div class="mo">${orb(m.personalMonth, 'xs')}<div><b>${esc(T.MONTHS[m.month - 1])} ${digitsHi(String(m.year).slice(2))}</b>${esc(T.PERSONAL_MONTH[m.personalMonth] || '')}</div></div>`)
  .join('');

const weekHtml = (d) => d.remedy.weekly
  .map((w) => {
    const kind = T.DAY_KIND[w.kind] || T.DAY_KIND.normal;
    const upay = T.PLANET_UPAY[w.planet.key] || '';
    const mz = w.missing.map((k) => `<div class="mz">${esc(T.MISSING_UPAY[k] || '')}</div>`).join('');
    return `<div class="day ${w.kind}" style="--c:${NC(w.number)}"><div class="dn">${esc(w.dayHi)} ${orb(w.number, 'xs')}</div><span class="tone ${TONE_CLASS[kind.tone]}">${esc(kind.label)}</span><p>${esc(upay)}</p>${mz}</div>`;
  })
  .join('');

const gemsHtml = (d) => {
  const wear = d.remedy.stones.wear;
  const avoid = d.remedy.stones.avoid;
  return `<div class="box dawn gem"><span class="stone" style="background:${NC(wear.number)}"></span><div>
    <b class="h">${esc(T.GEM_TEXT[wear.gemKey] || wear.gemHi)} · ${esc(T.METAL_TEXT[wear.metalKey] || wear.metalHi)}</b>
    ${wear.altGemKey ? `<p class="txt"><small>उपरत्न: ${esc(T.GEM_TEXT[wear.altGemKey] || wear.altGemHi)}</small></p>` : ''}
    <p class="txt">${esc(T.GEM_CAUTION)}</p>
    ${avoid.length ? `<p class="txt"><b>${esc(T.GEM_AVOID)}</b> ${avoid.map((a) => esc(a.gemHi)).join(', ')}</p>` : ''}
  </div></div>`;
};

const partnerHtml = (d) => {
  const p = d.match.partner;
  if (!p) return `<p class="txt">${esc(T.PARTNER.none)}</p><p class="txt"><a href="https://mybapuji.com/kundli-milan/">${esc(T.PARTNER.kundliLink)} →</a></p>`;
  if (p.error) return `<p class="txt">${esc(T.ERR.partnerDob)}</p>`;
  const dec = T.MATCH_DECISION[p.decision] || T.MATCH_DECISION.samanya;
  const parts = T.PARTNER.parts || {};
  const rows = Object.entries(p.parts).map(([k, v]) => `<tr><td>${esc(parts[k] || k)}</td><td>${v} / 4</td></tr>`).join('');
  return `<div class="box"><b class="h">${esc(T.PARTNER.title)}: ${esc(p.name || '')}</b>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:5mm;align-items:center;margin-top:2mm">
      <div>${ringSvg(p.percent)}</div>
      <div>${decTone(dec)} <p class="txt" style="margin-top:2mm">${esc(dec.t)}</p></div>
    </div>
    <table style="margin-top:3mm"><thead><tr><th>जोड़ी</th><th>अंक</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="txt" style="margin-top:2mm"><small>${esc(T.PARTNER.intro)} ${esc(T.PARTNER.note)}</small></p>
  </div>`;
};

const mobileHtml = (d) => {
  const m = d.match.mobile;
  if (!m) return '';
  if (m.error) return `<p class="txt">${esc(T.ERR.mobileLength)}</p>`;
  const dec = T.MOBILE_DECISION[m.decision] || T.MOBILE_DECISION.samanya;
  return `<div class="box"><b class="h">${esc(T.MOBILE.title)}: ${esc(m.number)} → योग ${m.total} → ${m.single} ${decTone(dec)}</b>
    <p class="txt">${esc(dec.t)}</p><p class="txt"><small>${esc(T.MOBILE.intro)} ${esc(T.MOBILE.pick)}</small></p></div>`;
};

const businessHtml = (d) => {
  const list = d.match.business;
  if (!list.length) return '';
  return `<h3>${esc(T.BUSINESS.title)}</h3><p class="txt">${esc(T.BUSINESS.intro)}</p>
    <table><thead><tr><th>नाम</th><th>योग</th><th>नामांक</th><th>स्कोर</th><th>निर्णय</th></tr></thead><tbody>
    ${list.map((b) => {
      if (b.error) return `<tr><td>${esc(b.input)}</td><td colspan="4">${esc(T.ERR.romanName)}</td></tr>`;
      const dec = T.NAME_DECISION[b.decision] || T.NAME_DECISION.samanya;
      return `<tr><td><b>${esc(b.name)}</b></td><td>${b.total}</td><td>${b.single}</td><td>${b.score10}</td><td>${decTone(dec)}</td></tr>
        <tr><td colspan="5"><small>${esc(T.BUSINESS.nature[b.single] || '')}</small></td></tr>`;
    }).join('')}
    </tbody></table>`;
};

const checkedHtml = (d) => {
  const list = d.name.checked;
  if (!list.length) return '';
  return `<h3>${esc(T.SUGGEST.checkedTitle)}</h3>
    <table><thead><tr><th>spelling</th><th>योग</th><th>नामांक</th><th>स्कोर</th></tr></thead><tbody>
    ${list.map((c) => `<tr><td>${esc(c.input)}</td><td>${c.total ?? '—'}</td><td>${c.single ?? '—'}</td><td>${c.score10 ?? '—'}</td></tr>`).join('')}
    </tbody></table>`;
};

/** एक अध्याय */
function chapter(id, d, body) {
  const meta = T.CHAPTERS.find((c) => c.id === id) || { title: id, intro: '' };
  const n = T.CHAPTERS.indexOf(meta);
  const nums = ['१', '२', '३', '४', '५', '६', '७', '८', '९', '१०', '११', '१२', '१३'];
  return `<details class="ch" id="ch-${id}" open>
    <summary><span class="num">${nums[n]}</span><b>${esc(meta.title)}</b></summary>
    <div class="body"><p class="txt" style="color:var(--muted);font-size:13px">${esc(meta.intro)}</p>${body}</div>
  </details>`;
}

/** कवर — सिर्फ़ PDF के पहले पन्ने पर (screen पर CSS छिपा देती है) */
export function coverHtml(d) {
  const [y, mo, day] = String(d.meta.today || '').split('-');
  const s = d.name.score || {};
  return `<section class="cover">
    <svg class="stars" viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true">${starfield()}</svg>
    <div class="top"><div class="csite">mybapuji.com</div><div class="om">॥ श्री गणेशाय नमः ॥</div></div>
    <div class="yantra">${loshuSvg(d.loshu ? d.loshu.counts : {}, 'dark', 270)}</div>
    <h1>${esc(T.COVER.title)}</h1>
    <div class="sub">${esc(T.COVER.sub)}</div>
    <div class="name">${esc(d.name.chaldean.text)}</div>
    <div class="birth">जन्म-तिथि ${esc(hiDate(d.core.dob.iso))}${d.core.gender ? ` · ${esc(T.FORM.genderOpts[d.core.gender] || '')}` : ''}</div>
    <div class="ckeys">
      <div class="ck">${orb(d.core.mulank)}<div class="k">मूलांक</div></div>
      <div class="ck">${orb(d.core.bhagyank)}<div class="k">भाग्यांक</div></div>
      <div class="ck">${orb(d.name.chaldean.namank)}<div class="k">नामांक (${d.name.chaldean.compound})</div></div>
      <div class="ck"><div class="score">${s.score10 ?? '—'}<small style="font-size:11pt;color:#C9CEE8">/10</small></div><div class="k">नाम-स्कोर · ${esc((T.NAME_DECISION[s.decision] || {}).label || '')}</div></div>
    </div>
    <div class="foot">${esc(T.COVER.madeOn)} ${esc(hiDate(d.meta.today))} · ${esc(T.COVER.footer)}</div>
  </section>`;
}

/** पूरा result: summary + chips + 13 अध्याय (+ कवर) */
export function renderResult(d, opts = {}) {
  // अधूरा data (ग़लत तारीख़/हिंदी नाम) — कुछ मत छापो, crash भी नहीं
  if (!d || !d.core || !d.core.mulank || !d.name || !d.name.chaldean || !d.name.score || !d.loshu || !d.time || !d.remedy) {
    return '';
  }
  const print = !!opts.print;
  const m = d.core.mulank;
  const b = d.core.bhagyank;
  const s = d.name.score || {};
  const mb = mbText(d);
  const py = d.time.personalYear;
  const pyInfo = T.PERSONAL_YEAR[py] || {};
  const chapters = [];

  chapters.push(chapter('nazar', d, `
    ${keysHtml(d)}
    <div class="row2" style="margin-top:14px">
      <div class="box"><b class="h">मूलांक ↔ भाग्यांक ${tone(mb.tone)}</b>${esc(mb.t)}</div>
      <div class="box dawn"><b class="h">शुभ अंक · रंग · दिन</b>${luckyChips(d)}</div>
    </div>`));

  chapters.push(chapter('swabhav', d, `
    <h3>मूलांक ${m} — ${esc(T.MULANK[m].title)}</h3>
    <p class="txt"><small>इन तारीख़ों पर जन्म: ${esc(T.MULANK[m].dates)}</small></p>
    <p class="txt">${esc(T.MULANK[m].swabhav)}</p>
    <div class="row2">
      <div class="box"><b class="h">आपकी शक्तियाँ</b><ul style="margin-left:18px;font-size:13.5px;line-height:1.8">${T.MULANK[m].shakti.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="box dawn"><b class="h">ध्यान रखें</b><ul style="margin-left:18px;font-size:13.5px;line-height:1.8">${T.MULANK[m].dhyan.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>
    <h3>भाग्यांक ${b} — जीवन की दिशा</h3>
    <p class="txt">${esc(T.BHAGYANK[b])}</p>
    <h3>नामांक ${d.name.chaldean.namank}</h3>
    <p class="txt">${esc(T.NAAMANK[d.name.chaldean.namank])}</p>`));

  chapters.push(chapter('naam', d, `
    <div class="letters">${lettersHtml(d)}</div>
    <div class="eq">${d.name.chaldean.words.map((w) => w.total).join(' + ')} = <span class="big">${d.name.chaldean.total}</span> → ${orb(d.name.chaldean.namank, 'xs')} नामांक ${clsTone(d.name.chaldean.cls)}</div>
    <p class="txt" style="margin-top:14px">${d.name.chaldean.total < 10 ? esc(T.SINGLE_TOTAL) : `<b>संयुक्त अंक ${d.name.chaldean.compound}:</b> ${esc(T.COMPOUND[d.name.chaldean.compound] || '')}`}</p>
    <h3>स्कोर का हिसाब — ${s.score10} / 10 <span class="tone ${TONE_CLASS[(T.NAME_DECISION[s.decision] || {}).tone] || 'm'}">${esc((T.NAME_DECISION[s.decision] || {}).label || '')}</span></h3>
    ${breakdownHtml(d)}
    <p class="txt" style="margin-top:8px"><small>${esc(T.SCORE_NOTE)}</small></p>
    <p class="txt"><small>${esc(T.LETTER_TABLE_NOTE)}</small></p>`));

  chapters.push(chapter('sudhar', d, `
    <h3>spelling-सुझाव</h3>${suggestHtml(d)}
    <h3>नए नाम (आपके उपनाम के साथ)</h3>${newNamesHtml(d)}
    ${checkedHtml(d)}`));

  chapters.push(chapter('loshu', d, `
    <p class="txt">${esc(T.LOSHU_INTRO)}</p>
    <div class="loshu-wrap"><div>${loshuSvg(d.loshu.counts, 'light', 230)}</div><ul class="planes">${planesHtml(d)}</ul></div>
    ${kuaHtml(d)}
    <h3>भरे हुए अंक</h3>
    <table><thead><tr><th>अंक</th><th>कितनी बार</th><th>अर्थ</th></tr></thead><tbody>${presentRows(d)}</tbody></table>
    <h3>खाली अंक और उनके उपाय</h3>
    <table><thead><tr><th>अंक</th><th>कमी</th><th>सरल उपाय</th></tr></thead><tbody>${missingRows(d)}</tbody></table>`));

  chapters.push(chapter('karya', d, `
    <h3>करियर</h3><p class="txt">${esc(T.MULANK[m].karya)}</p>
    <h3>धन</h3><p class="txt">${esc(T.MULANK[m].dhan)}</p>
    <h3>व्यापार के नाम का स्वभाव</h3><p class="txt">${esc(T.BUSINESS.nature[d.name.chaldean.namank] || '')}</p>`));

  chapters.push(chapter('sehat', d, `<p class="txt">${esc(T.MULANK[m].sehat)}</p>`));

  chapters.push(chapter('sambandh', d, `
    <p class="txt">${esc(T.MULANK[m].sambandh)}</p>
    ${partnerHtml(d)}`));

  chapters.push(chapter('samay', d, `
    <p class="txt">${esc(T.PY_INTRO)}</p>
    <div class="years">${yearsHtml(d)}</div>
    <h3>इस वर्ष: व्यक्तिगत वर्ष ${py} — ${esc(pyInfo.label || '')} ${tone(pyInfo.tone)}</h3>
    <p class="txt">${esc(pyInfo.t || '')}</p>
    <h3>अगले 12 महीने</h3>
    <div class="months">${monthsHtml(d)}</div>`));

  chapters.push(chapter('ratna', d, `
    ${gemsHtml(d)}
    <h3>${esc(T.LUCKY.numbers)} · ${esc(T.LUCKY.colors)} · ${esc(T.LUCKY.days)}</h3>
    ${luckyChips(d)}
    <p class="txt" style="margin-top:6px"><small>${esc(T.LUCKY.numbersNote)}</small></p>
    <h3>${esc(T.LUCKY.goodDates)}</h3>
    <div class="chips-l">${d.remedy.goodDates.map((x) => `<span class="chip-n good">${digitsHi(x)}</span>`).join('')}</div>
    <h3>${esc(T.LUCKY.careDates)}</h3>
    <div class="chips-l">${d.remedy.careDates.map((x) => `<span class="chip-n care">${digitsHi(x)}</span>`).join('')}</div>`));

  chapters.push(chapter('upay', d, `
    <p class="txt">${esc(T.WEEKLY_INTRO)}</p>
    <div class="week">${weekHtml(d)}</div>`));

  if (d.match.mobile || d.match.business.length) {
    chapters.push(chapter('mobile', d, `${mobileHtml(d)}${businessHtml(d)}`));
  }

  chapters.push(chapter('paddhati', d, `
    ${T.METHOD.map((p) => `<p class="txt">${esc(p)}</p>`).join('')}
    <h3>शब्दकोश</h3>
    <table><thead><tr><th>शब्द</th><th>अर्थ</th></tr></thead><tbody>
    ${T.GLOSSARY.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join('')}
    </tbody></table>
    <p class="foot-note">${esc(T.FOOTER_NOTE)}</p>`));

  const chips = T.CHAPTERS.filter((c) => c.id !== 'mobile' || d.match.mobile || d.match.business.length)
    .map((c, i) => `<a class="${i === 0 ? 'on' : ''}" href="#ch-${c.id}">${esc(c.title)}</a>`).join('');

  return `${coverHtml(d)}
  <nav class="chipbar" aria-label="अध्याय">${chips}</nav>
  <div class="summary">
    <div>
      <div class="nm">${esc(d.name.chaldean.text)}</div>
      <div class="dt">${esc(hiDate(d.core.dob.iso))}${d.core.gender ? ` · ${esc(T.FORM.genderOpts[d.core.gender] || '')}` : ''} · ${esc(T.AGE_LABEL)} ${digitsHi(d.time.age)}</div>
      <div class="trio">
        <div>${orb(m)}मूलांक</div>
        <div>${orb(b)}भाग्यांक</div>
        <div>${orb(d.name.chaldean.namank)}नामांक</div>
        <div>${orb(py)}वर्ष ${digitsHi(d.time.forecast10[0].year)}</div>
      </div>
      <div class="pdfrow"><button class="btn" type="button" data-pdf>📄 PDF सहेजें</button><button class="btn ghost" type="button" data-copy>link कॉपी करें</button></div>
    </div>
    <div class="gauge">${gaugeSvg(s.score10, 'dark')}</div>
  </div>
  ${print ? '' : ''}
  ${chapters.join('\n')}`;
}
