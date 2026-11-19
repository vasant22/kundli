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

/** एक बदलाव वाले रूप (सिर्फ़ पहले शब्द पर)। */
export function oneChangeVariants(word) {
  const w = String(word).toUpperCase();
  const out = [];
  const add = (v) => {
    if (v && v !== w && /^[A-Z]+$/.test(v)) out.push(v);
  };

  // स्वर-जोड़े (सब बड़े अक्षरों में — छोटा अक्षर आया तो रूप बेकार है)
  add(w.replace(/A(?!A)/g, 'AA'));
  add(w.replace(/AA/g, 'A'));
  add(w.replace(/I(?!E)/g, 'EE'));
  add(w.replace(/EE/g, 'I'));
  add(w.replace(/U(?!O)/g, 'OO'));
  add(w.replace(/OO/g, 'U'));
  add(w.replace(/E(?!E)/g, 'EE'));

  // व्यंजन-जोड़े
  add(w.replace(/T(?!H)/g, 'TH'));
  add(w.replace(/D(?!H)/g, 'DH'));
  add(w.replace(/S(?!H)/g, 'SH'));
  add(w.replace(/C/g, 'K'));
  add(w.replace(/K/g, 'C'));
  add(w.replace(/V/g, 'W'));
  add(w.replace(/W/g, 'V'));
  add(w.replace(/PH/g, 'F'));
  add(w.replace(/F/g, 'PH'));

  // अंत के जोड़
  add(`${w}A`);
  add(`${w}H`);
  add(`${w}Y`);

  // अंत का i → ee / y
  if (w.endsWith('I')) {
    add(`${w.slice(0, -1)}EE`);
    add(`${w.slice(0, -1)}Y`);
  }

  // स्वर के बाद व्यंजन दुगना (हर जगह अलग-अलग)
  for (let i = 1; i < w.length; i += 1) {
    if (!isVowel(w[i]) && isVowel(w[i - 1])) {
      add(w.slice(0, i + 1) + w[i] + w.slice(i + 1));
    }
  }
  return [...new Set(out)];
}

/** रूप ठीक है? तीन एक जैसे अक्षर, शुरू में दुगना व्यंजन, 4+ व्यंजन, 3 से ज़्यादा लंबा — हटाओ। */
export function plausible(word, baseLength) {
  if (!word || word.length < 2) return false;
  if (/(.)\1\1/.test(word)) return false;
  if (/^([^AEIOU])\1/.test(word)) return false;
  if (/[^AEIOU]{4}/.test(word)) return false;
  if (word.length > baseLength + 3) return false;
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
    for (const variant of list) {
      if (!plausible(variant, first.length)) continue;
      if (byName.has(variant)) continue;
      const c = candidate(variant, surname, mulank, bhagyank, changes);
      if (c) byName.set(variant, c);
    }
  };

  const firstPass = oneChangeVariants(first);
  take(firstPass, 1);

  const best = [...byName.values()]
    .sort((a, b) => b.score10 - a.score10 || a.total - b.total || a.name.localeCompare(b.name))
    .slice(0, 30);
  for (const b of best) {
    take(oneChangeVariants(b.name), 2);
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

/** नए नाम: सूची से लिंग के हिसाब से छाँटो, स्कोर 7+, सबसे अच्छे सबसे पहले। */
export function newNames(surname, gender, mulank, bhagyank, limit = 10) {
  const g = gender === 'm' || gender === 'f' ? gender : null;
  const out = [];
  for (const entry of NAMES) {
    const name = String(entry.n || '').toUpperCase();
    if (!name) continue;
    const eg = entry.g || 'u';
    if (g && eg !== 'u' && eg !== g) continue;
    const full = surname ? `${name} ${surname}` : name;
    const s = scoreName(full, mulank, bhagyank);
    if (s.error || s.score10 < 7) continue;
    out.push({
      name,
      full,
      gender: eg,
      total: s.total,
      compound: s.compound,
      single: s.single,
      cls: s.cls,
      score10: s.score10,
      decision: s.decision,
    });
  }
  out.sort((a, b) => b.score10 - a.score10 || a.total - b.total || a.name.localeCompare(b.name));
  return out.slice(0, limit);
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
