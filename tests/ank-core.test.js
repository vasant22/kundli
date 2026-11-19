// tests/ank-core.test.js — अंक ज्योतिष का आधार: reduce/chain, अंक↔ग्रह, मैत्री की
// पूरी 81-कोठरी तालिका (हर कोठरी अलग जाँच), कैल्डियन अक्षर-मान, संयुक्त अंक की
// श्रेणियाँ (10–52) और जन्म-तिथि की जाँच।
import { describe, expect, it } from 'vitest';
import {
  chain,
  reduce,
  digitSum,
  relation,
  pairValue,
  letterValue,
  wordTotal,
  compoundOf,
  classOf,
  PLANETS,
  WEEKDAYS,
  parseDob,
  daysInMonth,
} from '../src/ank/core.js';

/* अपेक्षित मैत्री-तालिका (पंक्ति base, स्तंभ other) — m मित्र · s सम · x शत्रु */
const EXPECTED = [
  'mmmxsxmxm',
  'mmssmssss',
  'mmmsxxmsm',
  'xxsmmmxmx',
  'mxssmmsss',
  'xxsmmmsms',
  'mmmsxsmsm',
  'xxsmmmxmx',
  'mmmsxsmsm',
];

describe('अंक घटाना', () => {
  it('reduce 1–9 तक लाता है, 11/22/33 नहीं रखता', () => {
    expect(reduce(6)).toBe(6);
    expect(reduce(33)).toBe(6);
    expect(reduce(37)).toBe(1);
    expect(reduce(1995)).toBe(6);
    expect(reduce(11)).toBe(2);
    expect(reduce(22)).toBe(4);
    expect(reduce(9)).toBe(9);
  });

  it('chain बीच के सारे जोड़ देता है', () => {
    expect(chain(1995)).toEqual([1995, 24, 6]);
    expect(chain(33)).toEqual([33, 6]);
    expect(chain(15)).toEqual([15, 6]);
    expect(chain(37)).toEqual([37, 10, 1]);
    expect(chain(6)).toEqual([6]);
  });

  it('0 और ग़ैर-संख्या पर नहीं फटता', () => {
    expect(reduce(0)).toBe(0);
    expect(chain(0)).toEqual([0]);
    expect(chain(Number.NaN)).toEqual([]);
    expect(reduce(Number.NaN)).toBe(0);
    expect(digitSum(10000)).toBe(1);
  });
});

describe('अंक → ग्रह', () => {
  it('नौ ग्रह ठीक क्रम में, badge हिंदी अक्षर', () => {
    expect(Object.keys(PLANETS).length).toBe(9);
    expect(PLANETS[1]).toMatchObject({ key: 'sun', hi: 'सूर्य', badge: 'सू' });
    expect(PLANETS[2]).toMatchObject({ key: 'moon', hi: 'चंद्र', badge: 'चं' });
    expect(PLANETS[3]).toMatchObject({ key: 'jupiter', hi: 'गुरु', badge: 'गु' });
    expect(PLANETS[4]).toMatchObject({ key: 'rahu', hi: 'राहु', badge: 'रा' });
    expect(PLANETS[5]).toMatchObject({ key: 'mercury', hi: 'बुध', badge: 'बु' });
    expect(PLANETS[6]).toMatchObject({ key: 'venus', hi: 'शुक्र', badge: 'शु' });
    expect(PLANETS[7]).toMatchObject({ key: 'ketu', hi: 'केतु', badge: 'के' });
    expect(PLANETS[8]).toMatchObject({ key: 'saturn', hi: 'शनि', badge: 'श' });
    expect(PLANETS[9]).toMatchObject({ key: 'mars', hi: 'मंगल', badge: 'मं' });
  });

  it('वार के अपने ग्रह: रवि सूर्य … शनि शनि', () => {
    expect(WEEKDAYS.map((d) => d.number)).toEqual([1, 2, 9, 5, 3, 6, 8]);
    expect(WEEKDAYS.map((d) => d.short)).toEqual([
      'रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि',
    ]);
  });
});

describe('मैत्री-तालिका — 81 कोठरियाँ, हर कोठरी अलग', () => {
  const cases = [];
  for (let base = 1; base <= 9; base += 1) {
    for (let other = 1; other <= 9; other += 1) {
      cases.push([base, other, EXPECTED[base - 1][other - 1]]);
    }
  }

  it('कुल 81 जोड़ियाँ जाँची जा रही हैं', () => {
    expect(cases.length).toBe(81);
    expect(new Set(cases.map((c) => c[2]))).toEqual(new Set(['m', 's', 'x']));
  });

  it.each(cases)('base %i → other %i = %s', (base, other, want) => {
    expect(relation(base, other)).toBe(want);
  });

  it('अपना अंक हमेशा मित्र', () => {
    for (let n = 1; n <= 9; n += 1) expect(relation(n, n)).toBe('m');
  });

  it('राहु शनिवत् और केतु मंगलवत्', () => {
    for (let n = 1; n <= 9; n += 1) {
      expect(relation(4, n)).toBe(relation(8, n));
      expect(relation(n, 4)).toBe(relation(n, 8));
      expect(relation(7, n)).toBe(relation(9, n));
      expect(relation(n, 7)).toBe(relation(n, 9));
    }
  });

  it('तालिका एक-तरफ़ा है — उलटा नहीं माना जाता', () => {
    // 1→2 मित्र, पर 2→1 भी मित्र; 1→4 शत्रु पर 4→1 भी शत्रु — मगर 2→3 सम व 3→2 मित्र
    expect(relation(2, 3)).toBe('s');
    expect(relation(3, 2)).toBe('m');
    expect(relation(5, 2)).toBe('x');
    expect(relation(2, 5)).toBe('m');
  });

  it('जोड़ी का अंक दोनों तरफ़ से (0–4)', () => {
    expect(pairValue(6, 6)).toBe(4);
    expect(pairValue(1, 6)).toBe(0); // 1→6 शत्रु, 6→1 शत्रु
    expect(pairValue(3, 4)).toBe(1 + 1); // दोनों तरफ़ सम
    expect(pairValue(5, 2)).toBe(0 + 2); // 5→2 शत्रु, 2→5 मित्र
  });
});

describe('कैल्डियन अक्षर-मान', () => {
  it('नौ समूह ठीक, 9 किसी अक्षर को नहीं', () => {
    const map = {
      A: 1, I: 1, J: 1, Q: 1, Y: 1,
      B: 2, K: 2, R: 2,
      C: 3, G: 3, L: 3, S: 3,
      D: 4, M: 4, T: 4,
      E: 5, H: 5, N: 5, X: 5,
      U: 6, V: 6, W: 6,
      O: 7, Z: 7,
      F: 8, P: 8,
    };
    for (const [ch, v] of Object.entries(map)) expect(letterValue(ch)).toBe(v);
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') expect(letterValue(ch)).toBeLessThan(9);
    expect(Object.keys(map).length).toBe(26);
  });

  it('शब्द-योग', () => {
    expect(wordTotal('RAHUL')).toBe(17);
    expect(wordTotal('SHARMA')).toBe(16);
    expect(wordTotal('PRIYA')).toBe(13);
    expect(wordTotal('VERMA')).toBe(18);
    expect(wordTotal('AMIT')).toBe(10);
    expect(wordTotal('KUMAR')).toBe(15);
  });
});

describe('संयुक्त अंक की श्रेणी (10–52)', () => {
  const SHUBH = [10, 15, 17, 19, 20, 21, 23, 24, 25, 27, 32, 33, 34, 36, 37, 41, 42, 45, 46, 50, 51];
  const MISHR = [14, 30, 31, 39, 40, 48, 49];
  const CHUNAUTI = [11, 12, 13, 16, 18, 22, 26, 28, 29, 35, 38, 43, 44, 47, 52];

  it.each(SHUBH)('%i शुभ है', (n) => expect(classOf(n)).toBe('g'));
  it.each(MISHR)('%i मिश्र है', (n) => expect(classOf(n)).toBe('m'));
  it.each(CHUNAUTI)('%i चुनौती है', (n) => expect(classOf(n)).toBe('c'));

  it('10–52 की हर संख्या ठीक एक श्रेणी में — कुल 43', () => {
    expect(SHUBH.length + MISHR.length + CHUNAUTI.length).toBe(43);
    const all = [...SHUBH, ...MISHR, ...CHUNAUTI].sort((a, b) => a - b);
    expect(all).toEqual(Array.from({ length: 43 }, (_, i) => i + 10));
    expect(new Set(all).size).toBe(43);
  });

  it('10 से नीचे एकल श्रेणी', () => {
    expect([1, 3, 5, 6].every((n) => classOf(n) === 'g')).toBe(true);
    expect([2, 7, 9].every((n) => classOf(n) === 'm')).toBe(true);
    expect([4, 8].every((n) => classOf(n) === 'c')).toBe(true);
  });

  it('52 से बड़ा योग — 9 घटाते जाओ', () => {
    expect(compoundOf(53)).toBe(44);
    expect(compoundOf(61)).toBe(52);
    expect(classOf(53)).toBe('c'); // 44 चुनौती
    expect(compoundOf(33)).toBe(33);
    expect(compoundOf(9)).toBe(9);
    expect(compoundOf(0)).toBe(0);
  });
});

describe('जन्म-तिथि', () => {
  it('15-08-1985 → मूलांक 6, भाग्यांक 1', () => {
    const d = parseDob('1985-08-15');
    expect(d.ok).toBe(true);
    expect(d.mulank).toBe(6);
    expect(d.total).toBe(37);
    expect(d.bhagyank).toBe(1);
    expect(d.chains.mulank).toEqual([15, 6]);
    expect(d.chains.bhagyank).toEqual([37, 10, 1]);
    expect(d.iso).toBe('1985-08-15');
  });

  it('लीप-वर्ष का 29 फ़रवरी चलता है', () => {
    const d = parseDob('2000-02-29');
    expect(d.ok).toBe(true);
    expect(d.mulank).toBe(2);
    expect(d.bhagyank).toBe(6);
  });

  it('ग़ैर-लीप 29-02, 31-04, 30-02 — साफ़ error, crash नहीं', () => {
    expect(parseDob('2001-02-29')).toMatchObject({ ok: false, error: 'dob-invalid' });
    expect(parseDob('1985-04-31')).toMatchObject({ ok: false, error: 'dob-invalid' });
    expect(parseDob('1990-02-30')).toMatchObject({ ok: false, error: 'dob-invalid' });
    expect(parseDob('1900-02-29')).toMatchObject({ ok: false, error: 'dob-invalid' });
  });

  it('वर्ष 1900–2100 के बाहर', () => {
    expect(parseDob('1899-12-31')).toMatchObject({ ok: false, error: 'dob-range' });
    expect(parseDob('2101-01-01')).toMatchObject({ ok: false, error: 'dob-range' });
    expect(parseDob('1900-01-01').ok).toBe(true);
    expect(parseDob('2100-12-31').ok).toBe(true);
  });

  it('ग़लत रूप, खाली, undefined', () => {
    expect(parseDob('15-08-1985')).toMatchObject({ ok: false, error: 'dob-format' });
    expect(parseDob('1985-8-15')).toMatchObject({ ok: false, error: 'dob-format' });
    expect(parseDob('')).toMatchObject({ ok: false, error: 'dob-format' });
    expect(parseDob(undefined)).toMatchObject({ ok: false, error: 'dob-format' });
  });

  it('महीनों के दिन', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 1)).toBe(31);
  });
});
