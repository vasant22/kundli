// लो-शू ग्रिड — जन्म-तिथि के अंक 4-9-2 / 3-5-7 / 8-1-6 के खानों में रखे जाते हैं;
// साथ में कुआ (Kua) अंक, खाली/दोहराए अंक और आठों रेखाएँ। शुद्ध फलन।

import { reduce } from './core.js';

export const GRID = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

export const LINES = [
  { key: 'mental', hi: 'मानसिक', digits: [4, 9, 2] },
  { key: 'emotional', hi: 'भावनात्मक', digits: [3, 5, 7] },
  { key: 'practical', hi: 'व्यावहारिक', digits: [8, 1, 6] },
  { key: 'thought', hi: 'विचार', digits: [4, 3, 8] },
  { key: 'desire', hi: 'इच्छा', digits: [9, 5, 1] },
  { key: 'action', hi: 'कर्म', digits: [2, 7, 6] },
  { key: 'golden', hi: 'स्वर्ण योग', digits: [4, 5, 6] },
  { key: 'royal', hi: 'राज योग', digits: [2, 5, 8] },
];

/**
 * कुआ अंक। y = जन्म-वर्ष का अंक।
 * पुरुष: reduce(11 − y), 5 हो तो 2 · स्त्री: reduce(4 + y), 5 हो तो 8।
 */
export function kuaNumber(year, gender) {
  if (!year) return null;
  const y = reduce(year);
  if (gender === 'm') {
    const k = reduce(11 - y);
    return k === 5 ? 2 : k;
  }
  if (gender === 'f') {
    const k = reduce(4 + y);
    return k === 5 ? 8 : k;
  }
  return null;
}

/**
 * लो-शू हिसाब। `dob` = core.parseDob का नतीजा, `gender` = 'm' | 'f' | null।
 * भरने वाले अंक: DDMMYYYY के सारे अशून्य अंक + मूलांक (दिन ≥ 10 पर) + भाग्यांक। कुआ अलग मान है, ग्रिड में नहीं।
 */
export function loShu(dob, gender) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  const filled = [];
  const add = (n, why) => {
    if (!(n >= 1 && n <= 9)) return;
    counts[n] += 1;
    filled.push({ n, why });
  };

  for (const ch of dob.digits) {
    const n = Number(ch);
    if (n > 0) add(n, 'dob');
  }
  if (dob.d >= 10) add(dob.mulank, 'mulank');
  add(dob.bhagyank, 'bhagyank');
  // कुआ ग्रिड में नहीं जुड़ता (भारतीय लो-शू पद्धति) — वह अलग मान है, वास्तु/दिशा के लिए
  const kua = kuaNumber(dob.y, gender);

  const missing = [];
  const repeated = [];
  for (let n = 1; n <= 9; n += 1) {
    if (counts[n] === 0) missing.push(n);
    if (counts[n] >= 2) repeated.push({ n, count: counts[n] });
  }

  const lines = LINES.map((l) => {
    const present = l.digits.filter((d) => counts[d] > 0);
    return { ...l, present: present.length, has: present, complete: present.length === 3 };
  });

  return {
    counts,
    grid: GRID.map((row) => row.map((n) => ({ n, count: counts[n] }))),
    missing,
    repeated,
    filled,
    kua,
    lines,
    completeLines: lines.filter((l) => l.complete).map((l) => l.key),
  };
}
