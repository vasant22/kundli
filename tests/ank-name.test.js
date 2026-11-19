// tests/ank-name.test.js — कैल्डियन नामांक, नाम-स्कोर (mybapuji पद्धति),
// spelling-सुझाव के नियम, नए नाम और check-spellings। साथ में लो-शू और समय-खंड।
import { describe, expect, it } from 'vitest';
import {
  chaldean,
  cleanName,
  scoreName,
  suggestSpellings,
  newNames,
  checkSpellings,
  plausible,
  oneChangeVariants,
  decisionOf,
} from '../src/ank/name.js';
import { loShu, kuaNumber, LINES, GRID } from '../src/ank/loshu.js';
import {
  timeBlock,
  kolkataParts,
  personalYear,
  personalMonth,
  MONTHS_HI,
} from '../src/ank/time.js';
import { parseDob } from '../src/ank/core.js';

describe('कैल्डियन नामांक', () => {
  it('RAHUL SHARMA → 17 + 16 = 33 → 6', () => {
    const c = chaldean('RAHUL SHARMA');
    expect(c.error).toBeNull();
    expect(c.words.map((w) => [w.text, w.total])).toEqual([
      ['RAHUL', 17],
      ['SHARMA', 16],
    ]);
    expect(c.total).toBe(33);
    expect(c.compound).toBe(33);
    expect(c.namank).toBe(6);
    expect(c.cls).toBe('g');
    expect(c.first).toMatchObject({ text: 'RAHUL', total: 17, cls: 'g' });
  });

  it('PRIYA VERMA → 13 + 18 = 31 → 4 (मिश्र)', () => {
    const c = chaldean('PRIYA VERMA');
    expect(c.total).toBe(31);
    expect(c.namank).toBe(4);
    expect(c.cls).toBe('m');
    expect(c.first).toMatchObject({ text: 'PRIYA', total: 13, cls: 'c' });
  });

  it('AMIT KUMAR → 10 + 15 = 25 → 7', () => {
    const c = chaldean('AMIT KUMAR');
    expect(c.total).toBe(25);
    expect(c.namank).toBe(7);
    expect(c.cls).toBe('g');
    expect(c.first.total).toBe(10);
    expect(c.first.cls).toBe('g');
  });

  it('छोटे अक्षर, बीच के निशान और ज़्यादा जगह ठीक हो जाती है', () => {
    expect(cleanName('  rahul   k. sharma ').text).toBe('RAHUL K SHARMA');
    expect(chaldean('rahul sharma').total).toBe(33);
  });

  it('हिंदी नाम (कोई A–Z नहीं) → roman-name error', () => {
    expect(chaldean('राम शर्मा')).toMatchObject({ error: 'roman-name' });
    expect(chaldean('  ')).toMatchObject({ error: 'roman-name' });
    expect(chaldean(undefined)).toMatchObject({ error: 'roman-name' });
    expect(chaldean('राम RAHUL').error).toBeNull();
  });

  it('52 से बड़ा योग 9 घटाकर ≤52 पर आता है', () => {
    const c = chaldean('AZ'); // 1 + 7 = 8
    expect(c.total).toBe(8);
    const big = chaldean('ZZZZZZZZ'); // 7 × 8 = 56 → 47
    expect(big.total).toBe(56);
    expect(big.compound).toBe(47);
    expect(big.cls).toBe('c');
  });
});

describe('नाम-स्कोर', () => {
  it('RAHUL SHARMA (6/1) → 5 → 5.6 सामान्य', () => {
    const s = scoreName('RAHUL SHARMA', 6, 1);
    expect(s.total).toBe(33);
    expect(s.single).toBe(6);
    expect(s.raw).toBe(5);
    expect(s.score10).toBe(5.6);
    expect(s.decision).toBe('samanya');
    expect(s.breakdown.map((b) => b.key)).toEqual([
      'rel-mulank-friend',
      'rel-bhagyank-enemy',
      'compound-shubh',
      'first-shubh',
      'equal-mulank',
    ]);
  });

  it('PRIYA VERMA (3/9) → −0.5 → 0 कमज़ोर', () => {
    const s = scoreName('PRIYA VERMA', 3, 9);
    expect(s.total).toBe(31);
    expect(s.single).toBe(4);
    expect(s.raw).toBe(-0.5);
    expect(s.score10).toBe(0);
    expect(s.decision).toBe('kamzor');
    expect(s.breakdown.map((b) => b.key)).toContain('num48-no-friend');
  });

  it('हर हाल में स्कोर 0–10 के बीच, हिंदी नाम पर error', () => {
    for (let a = 1; a <= 9; a += 1) {
      for (let b = 1; b <= 9; b += 1) {
        const s = scoreName('RAHUL SHARMA', a, b);
        expect(s.error).toBeNull();
        expect(s.score10).toBeGreaterThanOrEqual(0);
        expect(s.score10).toBeLessThanOrEqual(10);
      }
    }
    expect(scoreName('राम', 1, 1)).toMatchObject({ error: 'roman-name' });
    expect(scoreName('RAHUL', 0, 1)).toMatchObject({ error: 'no-core' });
  });

  it('निर्णय की सीमाएँ', () => {
    expect(decisionOf(10)).toBe('uttam');
    expect(decisionOf(8)).toBe('uttam');
    expect(decisionOf(7.9)).toBe('achha');
    expect(decisionOf(6)).toBe('achha');
    expect(decisionOf(5.999)).toBe('samanya');
    expect(decisionOf(4)).toBe('samanya');
    expect(decisionOf(3.9)).toBe('kamzor');
    expect(decisionOf(0)).toBe('kamzor');
  });

  it('5 पूरा होने पर 9 घटाने की जगह 10 पर टिकता है', () => {
    // ऐसा नाम ढूँढो जिसका कच्चा 9 हो → 10.0 उत्तम (कच्चा 9 से ज़्यादा नहीं हो सकता)
    let found = null;
    for (const nm of ['AARAV SHARMA', 'ROHAN SHARMA', 'KARAN SHARMA', 'ADITYA VERMA']) {
      for (let a = 1; a <= 9 && !found; a += 1) {
        for (let b = 1; b <= 9 && !found; b += 1) {
          const s = scoreName(nm, a, b);
          if (s.raw === 9) found = { nm, a, b, s };
        }
      }
    }
    expect(found).not.toBeNull();
    expect(found.s.score10).toBe(10);
    expect(found.s.decision).toBe('uttam');
  });
});

describe('spelling-सुझाव', () => {
  const base = scoreName('RAHUL SHARMA', 6, 1);

  it('एक-बदलाव रूप बनते हैं और गंदे रूप छँटते हैं', () => {
    const v = oneChangeVariants('RAHUL');
    expect(v).toContain('RAAHUL');
    expect(v).toContain('RAHULH');
    expect(v).toContain('RAHULA');
    expect(plausible('AAA', 5)).toBe(false); // तीन एक जैसे
    expect(plausible('RRAMA', 5)).toBe(false); // शुरू में दुगना व्यंजन
    expect(plausible('ASTRH', 5)).toBe(false); // 4+ व्यंजन
    expect(plausible('RAHULSHARMA', 5)).toBe(false); // 3 से ज़्यादा लंबा
  });

  it('हर सुझाव नियम पर खरा: उपनाम वही, स्कोर 6+, मौजूदा से बड़ा, कुल योग पर 2', () => {
    for (const [nm, m, b] of [
      ['RAHUL SHARMA', 6, 1],
      ['PRIYA VERMA', 3, 9],
      ['ANITA', 3, 5],
      ['AMIT KUMAR', 2, 6],
    ]) {
      const current = scoreName(nm, m, b);
      const list = suggestSpellings(nm, m, b);
      expect(list.length).toBeLessThanOrEqual(10);
      const perTotal = new Map();
      for (const s of list) {
        expect(s.score10).toBeGreaterThanOrEqual(6);
        expect(s.score10).toBeGreaterThan(current.score10);
        expect(s.full.endsWith(nm.split(' ').slice(1).join(' '))).toBe(true);
        expect(plausible(s.name, nm.split(' ')[0].length)).toBe(true);
        perTotal.set(s.total, (perTotal.get(s.total) || 0) + 1);
      }
      for (const v of perTotal.values()) expect(v).toBeLessThanOrEqual(2);
      // क्रम: स्कोर घटते, फिर कम बदलाव
      for (let i = 1; i < list.length; i += 1) {
        const prev = list[i - 1];
        const next = list[i];
        expect(prev.score10 > next.score10 || (prev.score10 === next.score10 && prev.changes <= next.changes)).toBe(true);
      }
    }
  });

  it('कोई सुझाव न मिले तो ख़ाली सूची (crash नहीं)', () => {
    expect(Array.isArray(suggestSpellings('PRIYA VERMA', 3, 9))).toBe(true);
    expect(suggestSpellings('राम', 1, 1)).toEqual([]);
    expect(suggestSpellings('', 1, 1)).toEqual([]);
  });
});

describe('नए नाम और check-spellings', () => {
  it('लिंग के हिसाब से छँटाई, स्कोर 7+', () => {
    const list = newNames('SHARMA', 'm', 1, 9);
    expect(list.length).toBeGreaterThan(0);
    for (const n of list) {
      expect(n.score10).toBeGreaterThanOrEqual(7);
      expect(n.gender === 'u' || n.gender === 'm').toBe(true);
      expect(n.full.endsWith('SHARMA')).toBe(true);
    }
    expect(list[0].score10).toBeGreaterThanOrEqual(list[list.length - 1].score10);
    const f = newNames('SHARMA', 'f', 1, 9);
    for (const n of f) expect(n.gender === 'u' || n.gender === 'f').toBe(true);
  });

  it('1–5 spellings का स्कोर, हिंदी पर error', () => {
    const r = checkSpellings(['RAHUL SHARMA', 'RAHUL SHARMAA', 'राम शर्मा'], 6, 1);
    expect(r.length).toBe(3);
    expect(r[0]).toMatchObject({ input: 'RAHUL SHARMA', error: null, score10: 5.6 });
    expect(r[2]).toMatchObject({ error: 'roman-name' });
    expect(checkSpellings(Array(9).fill('RAHUL'), 6, 1).length).toBe(5);
    expect(checkSpellings([], 6, 1)).toEqual([]);
    expect(checkSpellings(null, 6, 1)).toEqual([]);
  });
});

describe('लो-शू', () => {
  it('कुआ अंक — हाथ से गिने उदाहरण', () => {
    expect(kuaNumber(1985, 'm')).toBe(6); // y=5 → 11−5 = 6
    expect(kuaNumber(1985, 'f')).toBe(9); // 4+5 = 9
    expect(kuaNumber(1990, 'm')).toBe(1); // y=1 → 10 → 1
    expect(kuaNumber(1991, 'm')).toBe(9); // y=2 → 9
    expect(kuaNumber(1996, 'f')).toBe(2); // y=7 → 11 → 2
    expect(kuaNumber(1985, null)).toBeNull();
  });

  it('कुआ में 5 आए तो पुरुष 2, स्त्री 8', () => {
    // y = 6 वाला वर्ष → 11−6 = 5 → 2; 4+6 = 10 → 1 (स्त्री नहीं 5)
    expect(kuaNumber(1995, 'm')).toBe(2); // y=6
    // ऐसा वर्ष जिसमें स्त्री का 5 आए: 4+y = 5 या 14 → y=1 (4+1=5 → 8) या y=10 (नहीं)
    expect(kuaNumber(1990, 'f')).toBe(8); // y=1 → 5 → 8
  });

  it('PRIYA VERMA का ग्रिड — गिनती, खाली और कुआ', () => {
    const dob = parseDob('1992-12-03');
    const l = loShu(dob, 'f');
    expect(l.counts).toEqual({ 1: 2, 2: 2, 3: 1, 4: 0, 5: 0, 6: 0, 7: 1, 8: 0, 9: 3 });
    expect(l.missing).toEqual([4, 5, 6, 8]);
    expect(l.kua).toBe(7);
    expect(l.repeated).toEqual([
      { n: 1, count: 2 },
      { n: 2, count: 2 },
      { n: 9, count: 3 },
    ]);
    expect(l.grid.length).toBe(3);
    expect(l.grid.flat().map((c) => c.n)).toEqual([4, 9, 2, 3, 5, 7, 8, 1, 6]);
  });

  it('दिन 10 से कम हो तो मूलांक अलग से नहीं जुड़ता', () => {
    const dob = parseDob('1992-12-03');
    const withMulank = loShu({ ...dob, d: 15, mulank: 6 }, 'f').counts[6];
    const withoutMulank = loShu(dob, 'f').counts[6];
    expect(withMulank).toBeGreaterThanOrEqual(withoutMulank);
  });

  it('लिंग न दिया हो तो कुआ नहीं', () => {
    const dob = parseDob('1985-08-15');
    expect(loShu(dob, null).kua).toBeNull();
    expect(loShu(dob, 'm').kua).toBe(6);
  });

  it('आठ रेखाएँ और स्वर्ण/राज योग', () => {
    expect(LINES.length).toBe(8);
    expect(GRID.flat()).toEqual([4, 9, 2, 3, 5, 7, 8, 1, 6]);
    const dob = parseDob('1985-08-15');
    const l = loShu(dob, 'm');
    const golden = l.lines.find((x) => x.key === 'golden');
    expect(golden.digits).toEqual([4, 5, 6]);
    expect(typeof golden.complete).toBe('boolean');
    for (const line of l.lines) expect(line.present).toBe(line.has.length);
  });
});

describe('समय-खंड', () => {
  const now = Date.UTC(2026, 10, 19, 3, 0, 0); // 19-11-2026, 08:30 IST

  it('कोलकाता की तारीख़ (IST, कोई DST नहीं)', () => {
    expect(kolkataParts(now).iso).toBe('2026-11-19');
    expect(kolkataParts(Date.UTC(2026, 10, 19, 19, 0, 0)).iso).toBe('2026-11-20');
    expect(kolkataParts(Date.UTC(2026, 10, 19, 18, 29, 0)).iso).toBe('2026-11-19');
  });

  it('व्यक्तिगत वर्ष और मास', () => {
    expect(personalYear(8, 15, 2026)).toBe(6); // 8+6+1 = 15 → 6
    expect(personalMonth(8, 15, 2026, 11)).toBe(8); // 6+11 = 17 → 8
    expect(MONTHS_HI[10]).toBe('नवंबर');
  });

  it('आयु और जन्मदिन बीता या नहीं', () => {
    const t = timeBlock(parseDob('1985-08-15'), now);
    expect(t.today).toBe('2026-11-19');
    expect(t.age).toBe(41);
    expect(t.birthdayPassed).toBe(true);
    const t2 = timeBlock(parseDob('1992-12-03'), now);
    expect(t2.age).toBe(33);
    expect(t2.birthdayPassed).toBe(false);
    expect(t2.daysToBirthday).toBeGreaterThan(0);
    expect(t2.daysToBirthday).toBeLessThanOrEqual(366);
  });

  it('10 वर्ष और 12 महीने — महीना पार होने पर वर्ष आगे', () => {
    const t = timeBlock(parseDob('1985-08-15'), now);
    expect(t.forecast10.length).toBe(10);
    expect(t.forecast10[0]).toMatchObject({ year: 2026, age: 41, personalYear: 6 });
    expect(t.forecast10[9].year).toBe(2035);
    expect(t.forecast12.length).toBe(12);
    expect(t.forecast12[0]).toMatchObject({ year: 2026, month: 11 });
    expect(t.forecast12[1]).toMatchObject({ year: 2026, month: 12 });
    expect(t.forecast12[2]).toMatchObject({ year: 2027, month: 1 });
    for (const m of t.forecast12) {
      expect(m.personalMonth).toBeGreaterThanOrEqual(1);
      expect(m.personalMonth).toBeLessThanOrEqual(9);
    }
  });

  it('29 फ़रवरी का जन्मदिन ग़ैर-लीप वर्ष में भी बेझिझक', () => {
    const t = timeBlock(parseDob('2000-02-29'), now);
    expect(t.age).toBe(26);
    expect(t.birthdayPassed).toBe(true);
    expect(t.forecast10.length).toBe(10);
  });
});
