// tests/ank-build.test.js — जीवनसाथी-मिलान, मोबाइल, व्यापार-नाम, उपाय-संकेत और
// `buildAnkData` का पूरा JSON: पाँच स्वीकृति-उदाहरण, 1000 यादृच्छिक input (कहीं NaN/undefined/crash
// नहीं) और गति (2 ms से कम प्रति input)।
import { describe, expect, it } from 'vitest';
import { buildAnkData } from '../src/ank/index.js';
import { partnerMatch, mobileCheck, businessNames } from '../src/ank/match.js';
import { remedyBlock, luckyNumbers, GEMS, enemyNumbers } from '../src/ank/remedy.js';
import { parseDob } from '../src/ank/core.js';

const NOW = Date.UTC(2026, 10, 19, 3, 0, 0); // 19-11-2026, 08:30 IST

/** यादृच्छिक पर तय (seeded) — test हर बार एक जैसा चले। */
function prng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

describe('जीवनसाथी-मिलान', () => {
  const A = { mulank: 6, bhagyank: 1 };
  const B = { mulank: 3, bhagyank: 9 };

  it('सूत्र वही (01-ख): 28-08-1991 की दो कॉपी = 100, 15-08-1985 की दो कॉपी = 60', () => {
    // 28-08-1991 → मूलांक 1, भाग्यांक 2; 1↔2 दोनों तरफ़ मित्र
    const S = { mulank: 1, bhagyank: 2 };
    const m = partnerMatch(S, { ...S });
    expect(m.percent).toBe(100);
    expect(m.decision).toBe('uttam');
    expect(m.parts).toEqual({ mulankMulank: 4, bhagyankBhagyank: 4, mulankBhagyank: 4, bhagyankMulank: 4 });

    // 15-08-1985 → 6 और 1 दोनों तरफ़ शत्रु, इसलिए दो पार-जोड़ी 0
    const r = partnerMatch(A, { ...A });
    expect(r.parts).toEqual({ mulankMulank: 4, bhagyankBhagyank: 4, mulankBhagyank: 0, bhagyankMulank: 0 });
    expect(r.percent).toBe(60);
    expect(r.decision).toBe('achha');
  });

  it('A↔B उलटने पर प्रतिशत बराबर', () => {
    const ab = partnerMatch(A, B);
    const ba = partnerMatch(B, A);
    expect(ab.percent).toBe(ba.percent);
    expect(ab.decision).toBe(ba.decision);
    const c = partnerMatch({ mulank: 1, bhagyank: 8 }, { mulank: 5, bhagyank: 2 });
    const d = partnerMatch({ mulank: 5, bhagyank: 2 }, { mulank: 1, bhagyank: 8 });
    expect(c.percent).toBe(d.percent);
  });

  it('प्रतिशत हमेशा 0–100 के बीच, निर्णय की सीमाएँ ठीक', () => {
    for (let a1 = 1; a1 <= 9; a1 += 1) {
      for (let a2 = 1; a2 <= 9; a2 += 1) {
        for (let b1 = 1; b1 <= 9; b1 += 1) {
          for (let b2 = 1; b2 <= 9; b2 += 1) {
            const p = partnerMatch({ mulank: a1, bhagyank: a2 }, { mulank: b1, bhagyank: b2 }).percent;
            expect(p).toBeGreaterThanOrEqual(0);
            expect(p).toBeLessThanOrEqual(100);
          }
        }
      }
    }
  });
});

describe('मोबाइल नंबर', () => {
  it('+91 और आगे का 0 हटता है, 10 अंक ही चलते हैं', () => {
    expect(mobileCheck('+91 98765 43210', 6, 1)).toMatchObject({ error: null, number: '9876543210' });
    expect(mobileCheck('09876543210', 6, 1).number).toBe('9876543210');
    expect(mobileCheck('919876543210', 6, 1).number).toBe('9876543210');
    expect(mobileCheck('98765-43210', 6, 1).number).toBe('9876543210');
    expect(mobileCheck('12345', 6, 1)).toMatchObject({ error: 'mobile-length' });
    expect(mobileCheck('', 6, 1)).toMatchObject({ error: 'mobile-length' });
    expect(mobileCheck('98765abc43210xyz', 6, 1).number).toBe('9876543210');
  });

  it('निर्णय: दोनों मित्र शुभ · कोई शत्रु सावधानी · बाक़ी सामान्य', () => {
    const good = mobileCheck('9876543210', 6, 1); // 45 → 9; 6→9 सम, 1→9 मित्र
    expect(good.single).toBe(9);
    expect(good.relMulank).toBe('s');
    expect(good.relBhagyank).toBe('m');
    expect(good.decision).toBe('samanya');
    expect(mobileCheck('1111111111', 6, 1)).toMatchObject({ single: 1, relMulank: 'x', decision: 'savdhani' });
    expect(mobileCheck('9999999999', 6, 1)).toMatchObject({ single: 9 });
  });
});

describe('व्यापार-नाम', () => {
  it('1–3 नाम, वही नाम-स्कोर', () => {
    const r = businessNames(['SHARMA TRADERS', 'RAHUL SHARMA', 'X', 'चौथा नाम'], 6, 1);
    expect(r.length).toBe(3);
    expect(r[0].score10).toBeGreaterThanOrEqual(0);
    expect(r[0]).toHaveProperty('breakdown');
    expect(businessNames([], 6, 1)).toEqual([]);
    expect(businessNames(null, 6, 1)).toEqual([]);
  });
});

describe('उपाय-संकेत', () => {
  it('शुभ अंक — ख़ुद, भाग्यांक, फिर दोनों के मित्र (अधिकतम 5)', () => {
    expect(luckyNumbers(6, 1)).toEqual([6, 1]);
    expect(luckyNumbers(3, 9)).toEqual([3, 9, 1, 2]);
    for (let a = 1; a <= 9; a += 1) {
      for (let b = 1; b <= 9; b += 1) {
        const l = luckyNumbers(a, b);
        expect(l.length).toBeLessThanOrEqual(5);
        expect(l[0]).toBe(a);
        expect(new Set(l).size).toBe(l.length);
      }
    }
  });

  it('रत्न-धातु मूलांक के ग्रह का; बचने वाले शत्रु-ग्रहों के', () => {
    const r = remedyBlock(6, 1, [2, 7]);
    expect(r.stones.wear).toMatchObject({ number: 6, gemHi: 'हीरा', metalHi: 'चाँदी', altGemHi: 'ओपल' });
    expect(r.stones.avoid.map((x) => x.number)).toEqual(enemyNumbers(6));
    expect(GEMS[1].gemHi).toBe('माणिक्य');
    expect(GEMS[9].metalHi).toBe('ताँबा');
  });

  it('साप्ताहिक 7 दिन, power/care और खाली अंकों के उपाय (01-ख)', () => {
    const r = remedyBlock(6, 1, [2, 3, 4, 7]);
    expect(r.weekly.length).toBe(7);
    expect(r.weekly.map((w) => w.dayShort)).toEqual([
      'रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि',
    ]);
    expect(r.weekly.filter((w) => w.kind === 'power').map((w) => w.dayHi)).toEqual([
      'रविवार', 'शुक्रवार',
    ]);
    // सावधानी-दिन अब power से नहीं टकराता: शत्रु 1 का दिन रवि (power) है, इसलिए छोड़कर 2 → सोमवार
    expect(r.careDay).toBe('सोमवार');
    expect(r.careNumber).toBe(2);
    expect(r.weekly.find((w) => w.care).dayHi).toBe('सोमवार');
    expect(r.weekly.find((w) => w.kind === 'care').dayHi).toBe('सोमवार');
    for (const w of r.weekly) {
      if (w.care) expect(w.kind).toBe('care'); // care कभी power दिन पर नहीं
    }
    // उपाय-दिन अंक के ग्रह से: 2 सोम, 7 मंगल, 3 गुरु, 4 शनि
    expect(r.weekly.map((w) => w.missing)).toEqual([
      [], ['missing-2'], ['missing-7'], [], ['missing-3'], [], ['missing-4'],
    ]);
    // एक वार पर दो खाली अंक — 4 और 8 दोनों शनिवार
    const r2 = remedyBlock(6, 1, [4, 8]);
    expect(r2.weekly.find((w) => w.dayKey === 'sat').missing).toEqual(['missing-4', 'missing-8']);
    expect(r2.weekly.filter((w) => w.missing.length).length).toBe(1);
    expect(r.powerDays).toEqual(['शुक्रवार', 'रविवार']); // मूलांक के पहले, फिर भाग्यांक के
  });

  it('शुभ और सावधानी तिथियाँ (1–31)', () => {
    const r = remedyBlock(6, 1, []);
    expect(r.goodDates).toEqual([4, 5, 6, 7, 8, 13, 14, 15, 16, 17, 22, 23, 24, 25, 26, 31]);
    expect(r.careDates).toEqual([1, 2, 10, 11, 19, 20, 28, 29]);
    const p = remedyBlock(3, 9, []);
    expect(p.careDay).toBe('बुधवार');
    expect(p.powerDays).toEqual(['गुरुवार', 'मंगलवार']); // मूलांक 3 पहले, फिर भाग्यांक 9
  });
});

describe('buildAnkData — पाँच स्वीकृति-उदाहरण', () => {
  it('1. RAHUL SHARMA, 15-08-1985', () => {
    const d = buildAnkData({ name: 'RAHUL SHARMA', dob: '1985-08-15', gender: 'm' }, { nowMs: NOW });
    expect(d.errors).toEqual([]);
    expect(d.core).toMatchObject({ mulank: 6, bhagyank: 1 });
    expect(d.core.chains).toEqual({ mulank: [15, 6], bhagyank: [37, 10, 1] });
    expect(d.core.planets.mulank).toMatchObject({ hi: 'शुक्र', badge: 'शु' });
    expect(d.core.planets.bhagyank).toMatchObject({ hi: 'सूर्य', badge: 'सू' });
    expect(d.core.relation).toEqual({ mulankBhagyank: 'x', bhagyankMulank: 'x' });
    expect(d.name.chaldean.total).toBe(33);
    expect(d.name.first).toMatchObject({ total: 17, cls: 'g' });
    expect(d.name.score).toMatchObject({ score10: 5.6, decision: 'samanya', raw: 5 });
    expect(d.loshu.counts).toEqual({ 1: 3, 2: 0, 3: 0, 4: 0, 5: 2, 6: 1, 7: 0, 8: 2, 9: 1 });
    expect(d.loshu.missing).toEqual([2, 3, 4, 7]);
    expect(d.loshu.kua).toBe(6);
    expect(d.time.personalYear).toBe(6);
    expect(d.time.age).toBe(41);
    expect(d.remedy.lucky.numbers).toEqual([6, 1]);
  });

  it('2. PRIYA VERMA, 03-12-1992 (स्त्री)', () => {
    const d = buildAnkData({ name: 'PRIYA VERMA', dob: '1992-12-03', gender: 'f' }, { nowMs: NOW });
    expect(d.errors).toEqual([]);
    expect(d.core).toMatchObject({ mulank: 3, bhagyank: 9 });
    expect(d.name.chaldean.total).toBe(31);
    expect(d.name.score).toMatchObject({ score10: 0, decision: 'kamzor' });
    expect(d.loshu.counts).toEqual({ 1: 2, 2: 2, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 3 });
    expect(d.loshu.missing).toEqual([4, 5, 6, 7, 8]);
    expect(d.loshu.kua).toBe(7);
    expect(d.time.age).toBe(33);
  });

  it('3. AMIT KUMAR, 29-02-2000 (लीप)', () => {
    const d = buildAnkData({ name: 'AMIT KUMAR', dob: '2000-02-29', gender: 'm' }, { nowMs: NOW });
    expect(d.errors).toEqual([]);
    expect(d.core).toMatchObject({ mulank: 2, bhagyank: 6 });
    expect(d.name.chaldean).toMatchObject({ total: 25, namank: 7, cls: 'g' });
    expect(d.name.first).toMatchObject({ total: 10, cls: 'g' });
    // 01-ग: rel(2,7) अब शत्रु (−3), rel(6,7) मित्र (+2) → 2 → 2.2 कमज़ोर
    expect(d.name.score).toMatchObject({ raw: 2, score10: 2.2, decision: 'kamzor' });
  });

  it('4. ANITA, 29-02-2001 → तिथि-error, crash नहीं', () => {
    const d = buildAnkData({ name: 'ANITA', dob: '2001-02-29', gender: 'f' }, { nowMs: NOW });
    expect(d.errors).toEqual([{ field: 'dob', code: 'dob-invalid', value: '2001-02-29' }]);
    expect(d.core.mulank).toBeNull();
    expect(d.loshu).toBeNull();
    expect(d.time).toBeNull();
    expect(d.remedy).toBeNull();
    expect(d.name.chaldean.total).toBe(12); // A1 N5 I1 T4 A1
    expect(d.name.score).toBeNull();
  });

  it('5. "राम शर्मा" (सिर्फ़ हिंदी) → roman-name error', () => {
    const d = buildAnkData({ name: 'राम शर्मा', dob: '1985-08-15', gender: 'm' }, { nowMs: NOW });
    expect(d.errors).toEqual([{ field: 'name', code: 'roman-name' }]);
    expect(d.name.chaldean).toBeNull();
    expect(d.name.score).toBeNull();
    expect(d.core.mulank).toBe(6); // तिथि ठीक है, सिर्फ़ नाम ग़लत
    expect(d.loshu.kua).toBe(6);
  });

  it('पूरा JSON का ढाँचा ठीक है', () => {
    const d = buildAnkData(
      {
        name: 'RAHUL SHARMA',
        dob: '1985-08-15',
        gender: 'm',
        partner: { name: 'PRIYA VERMA', dob: '1992-12-03' },
        mobile: '+91 98765 43210',
        business: ['SHARMA TRADERS'],
        check: ['RAHUL SHARMA', 'RAHUL SHARMAA'],
      },
      { nowMs: NOW }
    );
    expect(Object.keys(d).sort()).toEqual(
      ['core', 'errors', 'loshu', 'match', 'meta', 'name', 'remedy', 'time'].sort()
    );
    expect(Object.keys(d.name).sort()).toEqual(
      ['chaldean', 'checked', 'first', 'newNames', 'score', 'suggestions'].sort()
    );
    expect(d.meta).toMatchObject({ tz: 'Asia/Kolkata', version: '1.0', today: '2026-11-19' });
    expect(d.match.partner.percent).toBeGreaterThan(0);
    expect(d.match.partner.mulank).toBe(3);
    expect(d.match.mobile.error).toBeNull();
    expect(d.match.business.length).toBe(1);
    expect(d.name.checked.length).toBe(2);
    expect(d.errors).toEqual([]);
  });
});

describe('buildAnkData — 1000 यादृच्छिक input', () => {
  const FIRST = ['AARAV', 'PRIYA', 'RAHUL', 'ANITA', 'VIKRAM', 'MEERA', 'AMIT', 'KAVYA', 'ROHAN', 'ISHITA'];
  const LAST = ['SHARMA', 'VERMA', 'GUPTA', 'IYER', 'SINGH', 'NAIR', 'KUMAR', 'JOSHI', ''];

  const walk = (obj, path = '$', bad = []) => {
    if (obj === null || obj === undefined) return bad;
    if (typeof obj === 'number' && Number.isNaN(obj)) bad.push(path);
    if (Array.isArray(obj)) obj.forEach((v, i) => walk(v, `${path}[${i}]`, bad));
    else if (typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) walk(v, `${path}.${k}`, bad);
    }
    return bad;
  };

  it('कहीं NaN नहीं, कहीं crash नहीं, हर JSON सीधा जाता है', () => {
    const rnd = prng(20261119);
    for (let i = 0; i < 1000; i += 1) {
      const name = `${FIRST[Math.floor(rnd() * FIRST.length)]} ${LAST[Math.floor(rnd() * LAST.length)]}`.trim();
      const y = 1950 + Math.floor(rnd() * 66);
      const m = 1 + Math.floor(rnd() * 12);
      const d = 1 + Math.floor(rnd() * 31);
      const p2 = (n) => String(n).padStart(2, '0');
      const dob = `${y}-${p2(m)}-${p2(d)}`;
      const gender = rnd() < 0.45 ? 'm' : rnd() < 0.8 ? 'f' : null;
      const input = { name, dob, gender };
      if (rnd() < 0.4) input.partner = { dob: '1990-01-01' };
      if (rnd() < 0.3) input.mobile = '9876543210';
      if (rnd() < 0.3) input.check = [name];
      if (rnd() < 0.3) input.business = ['A B'];

      let out;
      expect(() => {
        out = buildAnkData(input, { nowMs: NOW });
      }).not.toThrow();

      expect(walk(out)).toEqual([]);
      expect(JSON.parse(JSON.stringify(out))).toEqual(out);
      expect(Array.isArray(out.errors)).toBe(true);

      const validDate = out.errors.every((e) => e.field !== 'dob');
      if (validDate) {
        expect(out.core.mulank).toBeGreaterThanOrEqual(1);
        expect(out.core.mulank).toBeLessThanOrEqual(9);
        expect(out.time.forecast10.length).toBe(10);
        expect(out.time.forecast12.length).toBe(12);
        expect(out.remedy.lucky.numbers.length).toBeGreaterThanOrEqual(2);
        for (const s of out.name.suggestions) {
          expect(s.score10).toBeGreaterThanOrEqual(6);
          expect(Number.isFinite(s.score10)).toBe(true);
        }
      }
    }
  });

  it('गति: 2 ms से कम प्रति input (औसत)', () => {
    const runs = 300;
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < runs; i += 1) {
      buildAnkData(
        { name: 'RAHUL SHARMA', dob: '1985-08-15', gender: 'm', partner: { dob: '1992-12-03' } },
        { nowMs: NOW }
      );
    }
    const t1 = process.hrtime.bigint();
    const avgMs = Number(t1 - t0) / 1e6 / runs;
    expect(avgMs).toBeLessThan(2);
  });
});

describe('buildAnkData — ग़लत input पर साफ़ errors', () => {
  it('खाली input, null, undefined', () => {
    for (const bad of [undefined, null, {}, { name: '' }, { dob: '' }, 'text', 42]) {
      const d = buildAnkData(bad, { nowMs: NOW });
      expect(d.errors.length).toBeGreaterThan(0);
      expect(d.core.mulank).toBeNull();
    }
  });

  it('ग़लत partner/mobile/check पर error, बाक़ी हिसाब चलता रहता है', () => {
    const d = buildAnkData(
      {
        name: 'RAHUL SHARMA',
        dob: '1985-08-15',
        partner: { dob: '2010-02-30' },
        mobile: '123',
        check: ['राम'],
      },
      { nowMs: NOW }
    );
    expect(d.errors.map((e) => e.code).sort()).toEqual(['dob-invalid', 'mobile-length', 'roman-name'].sort());
    expect(d.core.mulank).toBe(6);
    expect(d.match.partner.error).toBe('dob-invalid');
    expect(d.match.mobile.error).toBe('mobile-length');
    expect(d.name.checked[0].error).toBe('roman-name');
  });

  it('बिना gender भी चलता है (कुआ नहीं)', () => {
    const d = buildAnkData({ name: 'RAHUL SHARMA', dob: '1985-08-15' }, { nowMs: NOW });
    expect(d.errors).toEqual([]);
    expect(d.loshu.kua).toBeNull();
    expect(d.loshu.counts[6]).toBe(1); // सिर्फ़ मूलांक, कुआ नहीं
  });

  it('nowMs बिना दिए भी चलता है', () => {
    const d = buildAnkData({ name: 'RAHUL SHARMA', dob: '1985-08-15', gender: 'm' });
    expect(d.time.forecast10.length).toBe(10);
    expect(d.meta.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('parseDob सीधा भी सही', () => {
    expect(parseDob('1992-12-03')).toMatchObject({ ok: true, mulank: 3, bhagyank: 9 });
  });
});
