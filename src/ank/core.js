// अंक ज्योतिष का आधार — अंक घटाना (reduce/chain), अंक↔ग्रह तालिका,
// बृहत् पराशर होरा शास्त्र की नैसर्गिक मैत्री (राहु शनिवत्, केतु मंगलवत्),
// कैल्डियन अक्षर-मान और संयुक्त अंक (10–52) की श्रेणी।
// सब शुद्ध फलन — कोई DOM, कोई बाहरी निर्भरता नहीं।

export const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** अंक → ग्रह। dayHi = उपाय वाला वार (राहु शनिवार, केतु मंगलवार)। */
export const PLANETS = {
  1: { key: 'sun', hi: 'सूर्य', badge: 'सू', dayKey: 'sun', dayHi: 'रविवार' },
  2: { key: 'moon', hi: 'चंद्र', badge: 'चं', dayKey: 'mon', dayHi: 'सोमवार' },
  3: { key: 'jupiter', hi: 'गुरु', badge: 'गु', dayKey: 'thu', dayHi: 'गुरुवार' },
  4: { key: 'rahu', hi: 'राहु', badge: 'रा', dayKey: 'sat', dayHi: 'शनिवार' },
  5: { key: 'mercury', hi: 'बुध', badge: 'बु', dayKey: 'wed', dayHi: 'बुधवार' },
  6: { key: 'venus', hi: 'शुक्र', badge: 'शु', dayKey: 'fri', dayHi: 'शुक्रवार' },
  7: { key: 'ketu', hi: 'केतु', badge: 'के', dayKey: 'tue', dayHi: 'मंगलवार' },
  8: { key: 'saturn', hi: 'शनि', badge: 'श', dayKey: 'sat', dayHi: 'शनिवार' },
  9: { key: 'mars', hi: 'मंगल', badge: 'मं', dayKey: 'tue', dayHi: 'मंगलवार' },
};

/** वार (रवि=0 … शनि=6) → उस दिन का अपना ग्रह-अंक। */
export const WEEKDAYS = [
  { key: 'sun', hi: 'रविवार', short: 'रवि', number: 1 },
  { key: 'mon', hi: 'सोमवार', short: 'सोम', number: 2 },
  { key: 'tue', hi: 'मंगलवार', short: 'मंगल', number: 9 },
  { key: 'wed', hi: 'बुधवार', short: 'बुध', number: 5 },
  { key: 'thu', hi: 'गुरुवार', short: 'गुरु', number: 3 },
  { key: 'fri', hi: 'शुक्रवार', short: 'शुक्र', number: 6 },
  { key: 'sat', hi: 'शनिवार', short: 'शनि', number: 8 },
];

/** मैत्री: m = मित्र, s = सम, x = शत्रु। */
export const REL = { FRIEND: 'm', NEUTRAL: 's', ENEMY: 'x' };
export const REL_HI = { m: 'मित्र', s: 'सम', x: 'शत्रु' };

const F = 'm';
const S = 's';
const E = 'x';

/* 81 कोठरियाँ — बृहत् पराशर की नैसर्गिक मैत्री; राहु (4) और केतु (7) दोनों के
   मित्र 5, 6, 8 और शत्रु 1, 2, 9 (प्रकाशित भारतीय अंक-ज्योतिष के अनुसार), अपना अंक मित्र। */
export const RELATION_TABLE = [
  /* base 1 */ [F, F, F, E, S, E, E, E, F],
  /* base 2 */ [F, F, S, E, F, S, E, S, S],
  /* base 3 */ [F, F, F, S, E, E, F, S, F],
  /* base 4 */ [E, E, S, F, F, F, S, F, E],
  /* base 5 */ [F, E, S, F, F, F, F, S, S],
  /* base 6 */ [E, E, S, F, F, F, F, F, S],
  /* base 7 */ [E, E, S, S, F, F, F, F, E],
  /* base 8 */ [E, E, S, F, F, F, F, F, E],
  /* base 9 */ [F, F, F, E, E, S, E, S, F],
];

/** एक संख्या के अंकों का जोड़। */
export function digitSum(n) {
  let x = Math.abs(Math.trunc(n));
  let s = 0;
  while (x > 0) {
    s += x % 10;
    x = Math.floor(x / 10);
  }
  return s;
}

/** बीच के सारे जोड़: 1995 → [1995, 24, 6]। */
export function chain(n) {
  if (!Number.isFinite(n)) return [];
  let x = Math.abs(Math.trunc(n));
  const out = [x];
  while (x > 9) {
    x = digitSum(x);
    out.push(x);
  }
  return out;
}

/** अंकों का जोड़ बार-बार, जब तक 1–9 न हो (11/22/33 नहीं रखते)। */
export function reduce(n) {
  const c = chain(n);
  return c.length ? c[c.length - 1] : 0;
}

/** पंक्ति base, स्तंभ other — मित्र/सम/शत्रु। */
export function relation(base, other) {
  const row = RELATION_TABLE[base - 1];
  return row ? row[other - 1] || null : null;
}

/** मित्र 2 · सम 1 · शत्रु 0 (मिलान के जोड़े के लिए)। */
export const REL_VALUE = { m: 2, s: 1, x: 0 };
export function relationValue(base, other) {
  const r = relation(base, other);
  return r ? REL_VALUE[r] : 0;
}

/** दोनों तरफ़ से जोड़ी का अंक (0–4)। */
export function pairValue(a, b) {
  return relationValue(a, b) + relationValue(b, a);
}

/** कैल्डियन अक्षर-मान (9 किसी अक्षर को नहीं)। */
export const LETTERS = (() => {
  const map = {};
  const groups = {
    1: 'AIJQY',
    2: 'BKR',
    3: 'CGLS',
    4: 'DMT',
    5: 'EHNX',
    6: 'UVW',
    7: 'OZ',
    8: 'FP',
  };
  for (const [v, chars] of Object.entries(groups)) {
    for (const ch of chars) map[ch] = Number(v);
  }
  return map;
})();

/** अक्षर का मान; अक्षर न हो तो 0। */
export function letterValue(ch) {
  return LETTERS[String(ch).toUpperCase()] || 0;
}

/** शब्द का चाल्डियन योग। */
export function wordTotal(word) {
  let t = 0;
  for (const ch of String(word).toUpperCase()) t += letterValue(ch);
  return t;
}

const SINGLE_CLASS = { 1: 'g', 2: 'm', 3: 'g', 4: 'c', 5: 'g', 6: 'g', 7: 'm', 8: 'c', 9: 'm' };

const COMPOUND_CLASS = (() => {
  const g = [10, 15, 17, 19, 21, 23, 24, 25, 27, 32, 33, 34, 36, 37, 41, 42, 45, 46, 50, 51];
  const m = [14, 20, 30, 31, 39, 40, 48, 49];
  const c = [11, 12, 13, 16, 18, 22, 26, 28, 29, 35, 38, 43, 44, 47, 52];
  const map = {};
  for (const n of g) map[n] = 'g';
  for (const n of m) map[n] = 'm';
  for (const n of c) map[n] = 'c';
  return map;
})();

export const CLASS_KEYS = { g: 'shubh', m: 'mishr', c: 'chunauti' };
export const CLASS_HI = { g: 'शुभ', m: 'मिश्र', c: 'चुनौती' };

/** योग को 52 या उससे नीचे लाओ (9 घटाते हुए)। */
export function compoundOf(sum) {
  const n0 = Math.abs(Math.trunc(sum));
  if (!Number.isFinite(n0) || n0 <= 0) return 0;
  let n = n0;
  while (n > 52) n -= 9;
  return n;
}

/** संयुक्त (या एकल) अंक की श्रेणी: g/m/c, ग़लत पर null। */
export function classOf(sum) {
  const n = compoundOf(sum);
  if (!n) return null;
  return n < 10 ? SINGLE_CLASS[n] || null : COMPOUND_CLASS[n] || null;
}

/** अंक का ग्रह-विवरण (ग़लत पर null)। */
export function planetOf(n) {
  return PLANETS[n] || null;
}

/** वार का नाम → क्रमांक (रविवार 0 … शनिवार 6)। */
export function weekdayIndex(key) {
  return WEEKDAYS.findIndex((d) => d.key === key);
}

/** किसी महीने के दिन (लीप-वर्ष सहित)। */
export function daysInMonth(y, m) {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * जन्म-तिथि 'YYYY-MM-DD' पढ़ो और जाँचो।
 * असली तारीख़ ही चले (31-04, 30-02, ग़ैर-लीप 29-02 → error), वर्ष 1900–2100।
 */
export function parseDob(dob) {
  if (typeof dob !== 'string') return { ok: false, error: 'dob-format' };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob.trim());
  if (!m) return { ok: false, error: 'dob-format' };
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1900 || y > 2100) return { ok: false, error: 'dob-range', y };
  if (mo < 1 || mo > 12) return { ok: false, error: 'dob-invalid', y, m: mo, d };
  if (d < 1 || d > daysInMonth(y, mo)) return { ok: false, error: 'dob-invalid', y, m: mo, d };
  const dd = pad2(d);
  const mm = pad2(mo);
  const yyyy = String(y);
  const digits = dd + mm + yyyy;
  const total = digits.split('').reduce((s, ch) => s + Number(ch), 0);
  const mulank = reduce(d);
  const bhagyank = reduce(total);
  return {
    ok: true,
    y,
    m: mo,
    d,
    iso: `${yyyy}-${mm}-${dd}`,
    dd,
    mm,
    yyyy,
    digits,
    total,
    mulank,
    bhagyank,
    chains: { mulank: chain(d), bhagyank: chain(total) },
  };
}

