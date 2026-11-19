// नाम के अंक — कैल्डियन अक्षर-मान से नामांक, mybapuji का नाम-स्कोर (0–10),
// spelling-सुधार के सुझाव और नए नाम चुनना। सब शुद्ध फलन, कोई DOM नहीं।
// स्कोर की हर कड़ी का key अंग्रेज़ी code में आता है — हिंदी वाक्य text-file से जुड़ेंगे।

import {
  reduce,
  classOf,
  compoundOf,
  relation,
  letterValue,
} from './core.js';
import { NAMES } from './names.js';

/** नाम साफ़ करो: सिर्फ़ A–Z, बड़े अक्षर; बाक़ी अक्षर जगह बन जाते हैं। */
export function cleanName(name) {
  if (typeof name !== 'string') return { words: [], text: '' };
  const words = name
    .toUpperCase()
    .replace(/[^A-Z]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return { words, text: words.join(' ') };
}

/** एक शब्द का पूरा हिसाब: अक्षर-मान, योग, संयुक्त, एकल, श्रेणी। */
export function wordInfo(word) {
  const letters = [...String(word).toUpperCase()].map((ch) => ({ ch, value: letterValue(ch) }));
  const total = letters.reduce((s, l) => s + l.value, 0);
  return {
    text: String(word).toUpperCase(),
    letters,
    total,
    compound: compoundOf(total),
    single: reduce(total),
    cls: classOf(total),
  };
}

/**
 * कैल्डियन नामांक। नाम में एक भी A–Z न हो तो `{ error: 'roman-name' }`।
 * `first` = पहले शब्द का अलग हिसाब (उपनाम छोड़कर)।
 */
export function chaldean(name) {
  const { words, text } = cleanName(name);
  if (!words.length) return { error: 'roman-name', text, words: [] };
  const w = words.map(wordInfo);
  const total = w.reduce((s, x) => s + x.total, 0);
  const single = reduce(total);
  const first = w[0];
  return {
    error: null,
    text,
    words: w,
    total,
    compound: compoundOf(total),
    single,
    cls: classOf(total),
    namank: single,
    first: {
      text: first.text,
      total: first.total,
      compound: first.compound,
      single: first.single,
      cls: first.cls,
    },
  };
}

const REL_KEY = { m: 'friend', s: 'sama', x: 'enemy' };
const CLS_KEY = { g: 'shubh', m: 'mishr', c: 'chunauti' };

/** नाम-स्कोर (mybapuji पद्धति, 0–10)। हर पंक्ति breakdown में `{ key, value }`। */
export function scoreName(name, mulank, bhagyank) {
  const c = chaldean(name);
  if (c.error) return { error: c.error };
  if (!(mulank >= 1 && mulank <= 9) || !(bhagyank >= 1 && bhagyank <= 9)) {
    return { error: 'no-core' };
  }
  const namank = c.namank;
  const breakdown = [];
  const push = (key, value) => {
    if (value) breakdown.push({ key, value });
  };

  const relM = relation(mulank, namank);
  const relB = relation(bhagyank, namank);
  const relMPoints = { m: 3, s: 1, x: -3 }[relM] || 0;
  const relBPoints = { m: 2, s: 0.5, x: -2 }[relB] || 0;
  breakdown.push({ key: `rel-mulank-${REL_KEY[relM]}`, value: relMPoints });
  breakdown.push({ key: `rel-bhagyank-${REL_KEY[relB]}`, value: relBPoints });

  const compPoints = { g: 2, m: 0, c: -2 }[c.cls] ?? 0;
  breakdown.push({ key: `compound-${CLS_KEY[c.cls]}`, value: compPoints });

  const firstPoints = { g: 1, m: 0, c: -1 }[c.first.cls] ?? 0;
  breakdown.push({ key: `first-${CLS_KEY[c.first.cls]}`, value: firstPoints });

  if (namank === mulank) push('equal-mulank', 1);
  else if (namank === bhagyank) push('equal-bhagyank', 1);

  if ((namank === 4 || namank === 8) && relM !== 'm' && relB !== 'm') {
    push('num48-no-friend', -1);
  }

  const raw = breakdown.reduce((s, b) => s + b.value, 0);
  const score10 = Math.min(10, Math.max(0, Math.round((raw / 9) * 100) / 10));
  return {
    error: null,
    name: c.text,
    total: c.total,
    compound: c.compound,
    single: namank,
    cls: c.cls,
    first: c.first,
    raw: Math.round(raw * 10) / 10,
    score10,
    decision: decisionOf(score10),
    breakdown,
  };
}

/** 8+ उत्तम · 6+ अच्छा · 4+ सामान्य · बाक़ी कमज़ोर। */
export function decisionOf(score10) {
  if (score10 >= 8) return 'uttam';
  if (score10 >= 6) return 'achha';
  if (score10 >= 4) return 'samanya';
  return 'kamzor';
}

const VOWELS = 'AEIOU';
const isVowel = (ch) => VOWELS.includes(ch);

/** शब्द के भीतर के 'A' को 'AA' करो; अंत का A वैसा ही रहता है। */
function stretchA(w) {
  let out = '';
  for (let i = 0; i < w.length; i += 1) {
    const ch = w[i];
    const isLast = i === w.length - 1;
    out += ch === 'A' && !isLast && w[i + 1] !== 'A' ? 'AA' : ch;
  }
  return out;
}

/**
 * एक बदलाव वाले रूप (सिर्फ़ पहले शब्द पर), साथ में बदलाव का भेद:
 * `v` = स्वर-खिंचाव · `c` = व्यंजन-बदलाव · `s` = अंत में +A.
 */
export function variantList(word) {
  const w = String(word).toUpperCase();
  const map = new Map();
  const add = (v, kind) => {
    if (!v || v === w || !/^[A-Z]+$/.test(v)) return;
    const prev = map.get(v);
    if (prev === 'c') return;
    map.set(v, kind === 'c' || !prev ? kind : prev);
  };

  // स्वर-जोड़े (सब बड़े अक्षरों में — छोटा अक्षर आया तो रूप बेकार है)
  // अंत का A नहीं खिंचता — PRIYA → PRIYAA नहीं बनता
  add(stretchA(w), 'v');
  add(w.replace(/AA/g, 'A'), 'v');
  add(w.replace(/I(?!E)/g, 'EE'), 'v');
  add(w.replace(/EE/g, 'I'), 'v');
  add(w.replace(/U(?!O)/g, 'OO'), 'v');
  add(w.replace(/OO/g, 'U'), 'v');
  add(w.replace(/E(?!E)/g, 'EE'), 'v');

  // व्यंजन-जोड़े
  add(w.replace(/T(?!H)/g, 'TH'), 'c');
  add(w.replace(/D(?!H)/g, 'DH'), 'c');
  add(w.replace(/S(?!H)/g, 'SH'), 'c');
  add(w.replace(/C/g, 'K'), 'c');
  add(w.replace(/K/g, 'C'), 'c');
  add(w.replace(/V/g, 'W'), 'c');
  add(w.replace(/W/g, 'V'), 'c');
  add(w.replace(/PH/g, 'F'), 'c');
  add(w.replace(/F/g, 'PH'), 'c');

  // अंत में +A — सिर्फ़ जब शब्द व्यंजन पर ख़त्म हो (RAHUL → RAHULA; PRIYA → कुछ नहीं)
  if (!isVowel(w[w.length - 1])) add(`${w}A`, 's');

  // अंत का I → EE / Y
  if (w.endsWith('I')) {
    add(`${w.slice(0, -1)}EE`, 'v');
    add(`${w.slice(0, -1)}Y`, 'k');
  }

  // स्वर के बाद व्यंजन दुगना (हर जगह अलग-अलग)
  for (let i = 1; i < w.length; i += 1) {
    if (!isVowel(w[i]) && isVowel(w[i - 1])) {
      add(w.slice(0, i + 1) + w[i] + w.slice(i + 1), 'c');
    }
  }
  return [...map.entries()].map(([v, kind]) => ({ w: v, kind }));
}

/** सिर्फ़ रूपों की सूची (पुराने रास्ते के लिए)। */
export function oneChangeVariants(word) {
  return variantList(word).map((v) => v.w);
}

/** रूप ठीक है? तीन एक जैसे अक्षर, शुरू में दुगना व्यंजन, 4+ व्यंजन, 3 से ज़्यादा लंबा — हटाओ। */
export function plausible(word, baseLength) {
  if (!word || word.length < 2) return false;
  if (/(.)\1\1/.test(word)) return false;
  if (/^([^AEIOU])\1/.test(word)) return false;
  if (/[^AEIOU]{4}/.test(word)) return false;
  if (word.length > baseLength + 3) return false;
  // दो बार "AA" — मानवीय नहीं
  if ((word.match(/AA/g) || []).length >= 2) return false;
  // AAH / EEH / OOH / YH / HH पर अंत — मानवीय नहीं
  if (/(AAH|EEH|OOH|YH|HH)$/.test(word)) return false;
  return true;
}

function splitName(name) {
  const { words } = cleanName(name);
  if (!words.length) return null;
  return { first: words[0], surname: words.slice(1).join(' ') };
}

function candidate(variant, surname, mulank, bhagyank, changes) {
  const full = surname ? `${variant} ${surname}` : variant;
  const s = scoreName(full, mulank, bhagyank);
  if (s.error) return null;
  return {
    name: variant,
    full,
    total: s.total,
    compound: s.compound,
    single: s.single,
    cls: s.cls,
    score10: s.score10,
    decision: s.decision,
    changes,
  };
}

/**
 * spelling-सुधार के सुझाव — सिर्फ़ पहले शब्द में बदलाव, उपनाम वही।
 * सिर्फ़ वे रूप जिनका स्कोर 6+ है और मौजूदा नाम से बड़ा है; एक ही योग के अधिकतम 2।
 */
export function suggestSpellings(name, mulank, bhagyank, limit = 10) {
  const parts = splitName(name);
  if (!parts) return [];
  const base = scoreName(name, mulank, bhagyank);
  if (base.error) return [];
  const { first, surname } = parts;
  const byName = new Map();

  const take = (list, changes) => {
    for (const v of list) {
      const variant = v.w;
      if (!plausible(variant, first.length)) continue;
      if (byName.has(variant)) continue;
      const c = candidate(variant, surname, mulank, bhagyank, changes);
      if (c) byName.set(variant, c);
    }
  };

  take(variantList(first), 1);

  // दूसरा बदलाव: दोनों सिर्फ़ स्वर-खिंचाव न हों — कम से कम एक व्यंजन-बदलाव रहे
  const best = [...byName.values()]
    .sort((a, b) => b.score10 - a.score10 || a.total - b.total || a.name.localeCompare(b.name))
    .slice(0, 30);
  for (const b of best) {
    const firstKind = variantList(first).find((v) => v.w === b.name)?.kind || 'c';
    for (const v of variantList(b.name)) {
      if (firstKind !== 'c' && v.kind !== 'c') continue;
      take([v], 2);
    }
  }

  const sorted = [...byName.values()].sort(
    (a, b) =>
      b.score10 - a.score10 ||
      a.changes - b.changes ||
      a.name.length - b.name.length ||
      a.name.localeCompare(b.name)
  );

  const kept = [];
  const perTotal = new Map();
  for (const c of sorted) {
    if (c.score10 < 6 || c.score10 <= base.score10) continue;
    const used = perTotal.get(c.total) || 0;
    if (used >= 2) continue;
    perTotal.set(c.total, used + 1);
    kept.push(c);
    if (kept.length >= limit) break;
  }
  return kept;
}

/**
 * नए नाम: सूची से लिंग के हिसाब से छाँटो। पहले वे जिनका स्कोर 6+ है और मौजूदा नाम से बड़ा है;
 * ऐसे 3 से कम मिलें तो सबसे अच्छे 5 (स्कोर कितना भी हो) `fallback: true` के साथ।
 */
export function newNames(surname, gender, mulank, bhagyank, baseScore = null, limit = 10) {
  const g = gender === 'm' || gender === 'f' ? gender : null;
  const all = [];
  for (const entry of NAMES) {
    const name = String(entry.n || '').toUpperCase();
    if (!name) continue;
    const eg = entry.g || 'u';
    if (g && eg !== 'u' && eg !== g) continue;
    const full = surname ? `${name} ${surname}` : name;
    const s = scoreName(full, mulank, bhagyank);
    if (s.error) continue;
    all.push({
      name,
      full,
      gender: eg,
      total: s.total,
      compound: s.compound,
      single: s.single,
      cls: s.cls,
      score10: s.score10,
      decision: s.decision,
      fallback: false,
    });
  }
  all.sort((a, b) => b.score10 - a.score10 || a.total - b.total || a.name.localeCompare(b.name));

  const primary = all.filter((n) => n.score10 >= 6 && (baseScore === null || n.score10 > baseScore));
  if (primary.length >= 3) return primary.slice(0, limit);
  return all.slice(0, 5).map((n) => ({ ...n, fallback: true }));
}

/** उपयोगकर्ता की दी हुई 1–5 spellings का स्कोर। */
export function checkSpellings(list, mulank, bhagyank) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const raw of list.slice(0, 5)) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const s = scoreName(raw, mulank, bhagyank);
    out.push({
      input: raw.trim(),
      error: s.error || null,
      name: s.name || cleanName(raw).text,
      total: s.total ?? null,
      single: s.single ?? null,
      cls: s.cls ?? null,
      score10: s.score10 ?? null,
      decision: s.decision || null,
    });
  }
  return out;
}
