// मिलान — जीवनसाथी का प्रतिशत, मोबाइल नंबर और व्यापार-नाम की जाँच।
// जोड़ी का अंक दोनों तरफ़ के संबंध से बनता है (मित्र 2 · सम 1 · शत्रु 0, कुल 0–4)।

import { relation, pairValue, reduce } from './core.js';
import { scoreName } from './name.js';

const DECISION = (p) => (p >= 75 ? 'uttam' : p >= 55 ? 'achha' : p >= 40 ? 'samanya' : 'samajhdari');

/** दो कुंडलियों के मूलांक/भाग्यांक से मिलान-प्रतिशत (0–100, पूर्णांक)। */
export function partnerMatch(a, b) {
  const pMM = pairValue(a.mulank, b.mulank);
  const pBB = pairValue(a.bhagyank, b.bhagyank);
  const pMB = pairValue(a.mulank, b.bhagyank);
  const pBM = pairValue(a.bhagyank, b.mulank);
  // भार: मूलांक-मूलांक 35 · भाग्यांक-भाग्यांक 25 · मूलांक-भाग्यांक 20 · भाग्यांक-मूलांक 20
  const percent = Math.round((35 * pMM + 25 * pBB + 20 * pMB + 20 * pBM) / 4);
  return {
    percent,
    decision: DECISION(percent),
    parts: { mulankMulank: pMM, bhagyankBhagyank: pBB, mulankBhagyank: pMB, bhagyankMulank: pBM },
    relations: {
      aMulankToB: relation(a.mulank, b.mulank),
      bMulankToA: relation(b.mulank, a.mulank),
      aBhagyankToB: relation(a.bhagyank, b.bhagyank),
      bBhagyankToA: relation(b.bhagyank, a.bhagyank),
    },
  };
}

/** मोबाइल: सिर्फ़ अंक, +91 / आगे का 0 हटाकर ठीक 10 अंक। */
export function mobileCheck(mobile, mulank, bhagyank) {
  const raw = mobile === null || mobile === undefined ? '' : String(mobile).trim();
  let d = raw.replace(/\D+/g, '');
  if (d.length === 13 && d.startsWith('091')) d = d.slice(3);
  else if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length !== 10) return { error: 'mobile-length', input: raw, digits: d };

  const total = [...d].reduce((s, ch) => s + Number(ch), 0);
  const single = reduce(total);
  const relM = mulank ? relation(mulank, single) : null;
  const relB = bhagyank ? relation(bhagyank, single) : null;
  const decision = relM === 'm' && relB === 'm' ? 'shubh'
    : relM === 'x' || relB === 'x' ? 'savdhani'
      : 'samanya';
  return {
    error: null,
    number: d,
    total,
    single,
    relMulank: relM,
    relBhagyank: relB,
    decision,
  };
}

/** व्यापार/दुकान के 1–3 नाम — वही नाम-स्कोर। */
export function businessNames(list, mulank, bhagyank) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const raw of list.slice(0, 3)) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const s = scoreName(raw, mulank, bhagyank);
    out.push({
      input: raw.trim(),
      error: s.error || null,
      name: s.name || '',
      total: s.total ?? null,
      compound: s.compound ?? null,
      single: s.single ?? null,
      cls: s.cls ?? null,
      score10: s.score10 ?? null,
      decision: s.decision || null,
      breakdown: s.breakdown || [],
    });
  }
  return out;
}
