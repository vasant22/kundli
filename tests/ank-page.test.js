// tests/ank-page.test.js — page, SEO, render और text-कवरेज की जाँच।
// (क) SEO की ज़रूरी चीज़ें (ख) 5 स्वीकृति-उदाहरण page पर (ग) पश्चिमी चिह्न/नाम कहीं नहीं
// (घ) text-hi.js का हर ज़रूरी वाक्य कहीं छपता है (ङ) ग़लत input पर नरम संदेश, crash नहीं।
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildAnkData } from '../src/ank/index.js';
import { renderResult } from '../src/ank/report.js';
import * as T from '../src/ank/text-hi.js';
import { classOf, reduce } from '../src/ank/core.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const NOW = Date.UTC(2026, 10, 19, 3, 0, 0);

const html = read('ank/index.html');

describe('ank page — SEO', () => {
  it('title, description, keywords, canonical, robots, OG', () => {
    expect(html).toContain('<title>अंक ज्योतिष — मूलांक, भाग्यांक, नामांक कैलकुलेटर | Free Numerology in Hindi</title>');
    expect(html).toMatch(/name="description"/);
    expect(html).toMatch(/name="keywords"/);
    expect(html).toMatch(/name="robots" content="index, follow"/);
    expect(html).toContain('rel="canonical" href="https://mybapuji.com/ank-jyotish/"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:url" content="https://mybapuji.com/ank-jyotish/"');
  });

  it('JSON-LD: WebApplication + FAQPage, छह प्रश्न', () => {
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(m).toBeTruthy();
    const data = JSON.parse(m[1]);
    const types = data['@graph'].map((x) => x['@type']);
    expect(types).toContain('WebApplication');
    expect(types).toContain('FAQPage');
    const faq = data['@graph'].find((x) => x['@type'] === 'FAQPage');
    expect(faq.mainEntity.length).toBe(6);
    const app = data['@graph'].find((x) => x['@type'] === 'WebApplication');
    expect(app.inLanguage).toBe('hi-IN');
    expect(app.isAccessibleForFree).toBe(true);
    expect(app.offers.price).toBe('0');
  });

  it('FAQ और परिचय HTML में ही छपे हैं (बिना JS भी पढ़े जाएँ)', () => {
    for (const f of T.FAQ) {
      expect(html).toContain(f.q);
      expect(html).toContain(f.a.slice(0, 40));
    }
    expect(html).toContain(T.SEO_INTRO.lead);
    expect(html).toContain(T.SEO_INTRO.what[0].slice(0, 40));
  });

  it('sitemap.xml में नया URL', () => {
    expect(read('public/sitemap.xml')).toContain('<loc>https://mybapuji.com/ank-jyotish/</loc>');
  });

  it('form HTML में ही है (SEO) — नाम, तिथि, लिंग, बटन', () => {
    expect(html).toContain('id="ank-form"');
    expect(html).toContain('id="f-name"');
    expect(html).toContain('id="f-d"');
    expect(html).toContain('id="f-y"');
    expect(html).toContain('अंक फल देखें');
  });
});

describe('ank page — render', () => {
  const d = buildAnkData(
    {
      name: 'RAHUL SHARMA',
      dob: '1985-08-15',
      gender: 'm',
      partner: { name: 'PRIYA VERMA', dob: '1992-12-03' },
      mobile: '9876543210',
      business: ['Bapuji Herbals'],
    },
    { nowMs: NOW }
  );
  const out = renderResult(d);

  it('तीनों मुख्य अंक page पर वही हैं जो engine देता है', () => {
    expect(out).toContain(`मूलांक ${d.core.mulank}`);
    expect(out).toContain(`भाग्यांक ${d.core.bhagyank}`);
    expect(out).toContain(`नामांक ${d.name.chaldean.namank}`);
    expect(out).toContain(`योग ${d.name.chaldean.compound}`);
    expect(out).toContain('5.6');
  });

  it('तेरह अध्याय, सब खुले', () => {
    const ids = [...out.matchAll(/id="ch-([a-z]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(T.CHAPTERS.map((c) => c.id));
    expect((out.match(/<details class="ch" id="ch-[a-z]+" open>/g) || []).length).toBe(13);
  });

  it('कहीं undefined/NaN/[object Object] नहीं', () => {
    expect(out).not.toContain('undefined');
    expect(out).not.toContain('NaN');
    expect(out).not.toContain('[object Object]');
  });

  it('चित्र inline SVG हैं — कोई <img> नहीं', () => {
    expect(out).not.toContain('<img');
    expect((out.match(/<svg /g) || []).length).toBeGreaterThanOrEqual(4);
  });

  it('PDF-मोड में कवर पहले आता है', () => {
    const p = renderResult(d, { print: true });
    expect(p.trimStart().startsWith('<section class="cover">')).toBe(true);
  });

  it('पाँचों स्वीकृति-उदाहरण page पर ठीक', () => {
    const cases = [
      ['RAHUL SHARMA', '1985-08-15', 'm', 6, 1, 6],
      ['PRIYA VERMA', '1992-12-03', 'f', 3, 9, 4],
      ['AMIT KUMAR', '2000-02-29', 'm', 2, 6, 7],
    ];
    for (const [nm, dob, g, m, b, n] of cases) {
      const dd = buildAnkData({ name: nm, dob, gender: g }, { nowMs: NOW });
      const h = renderResult(dd);
      expect(dd.core.mulank).toBe(m);
      expect(dd.core.bhagyank).toBe(b);
      expect(dd.name.chaldean.namank).toBe(n);
      expect(h).toContain(`मूलांक ${m}`);
      expect(h).toContain(`भाग्यांक ${b}`);
    }
    const bad = buildAnkData({ name: 'ANITA', dob: '2001-02-29' }, { nowMs: NOW });
    expect(bad.errors[0].code).toBe('dob-invalid');
    const hi = buildAnkData({ name: 'राम शर्मा', dob: '1985-08-15' }, { nowMs: NOW });
    expect(hi.errors[0].code).toBe('roman-name');
  });
});

describe('ank page — पश्चिमी चिह्न और नाम कहीं नहीं', () => {
  const files = [
    'ank/index.html',
    'src/ank/core.js',
    'src/ank/name.js',
    'src/ank/loshu.js',
    'src/ank/time.js',
    'src/ank/match.js',
    'src/ank/remedy.js',
    'src/ank/index.js',
    'src/ank/report.js',
    'src/ank/viz.js',
    'src/ank/main.js',
    'src/ank/text-hi.js',
    'src/ank/names.js',
  ];

  it('U+2609–U+2653 (ग्रह/राशि चिह्न) कहीं नहीं', () => {
    for (const f of files) {
      const s = read(f);
      for (const ch of s) {
        const cp = ch.codePointAt(0);
        expect(cp >= 0x2609 && cp <= 0x2653).toBe(false);
      }
    }
  });

  it('"Skill made by", "Powered by", "Author", किसी लेखक का नाम नहीं', () => {
    for (const f of files) {
      const s = read(f).toLowerCase();
      for (const bad of ['skill made', 'powered by', 'author:', 'author =', 'numerology-skill']) {
        expect(s.includes(bad)).toBe(false);
      }
    }
  });

  it('ank page कहीं swisseph/wasm/astro/charts import नहीं करता', () => {
    for (const f of files.filter((x) => x.endsWith('.js'))) {
      const s = read(f);
      expect(/from\s+['"][^'"]*(swisseph|wasm|astro|charts|phal)/.test(s)).toBe(false);
      expect(/import\(['"][^'"]*(swisseph|wasm|astro|charts|phal)/.test(s)).toBe(false);
    }
  });
});

describe('text-hi की हर ज़रूरी entry कहीं छपती है', () => {
  /** ऐसी जन्म-तिथि ढूँढो जिसका (मूलांक, भाग्यांक) यही हो। */
  function dobFor(m, b) {
    for (let y = 1985; y <= 1999; y += 1) {
      for (let mo = 1; mo <= 12; mo += 1) {
        for (let d = 1; d <= 28; d += 1) {
          const pad = (n) => String(n).padStart(2, '0');
          const digits = `${pad(d)}${pad(mo)}${y}`;
          const sum = [...digits].reduce((s, c) => s + Number(c), 0);
          if (reduce(d) === m && reduce(sum) === b) return `${y}-${pad(mo)}-${pad(d)}`;
        }
      }
    }
    return null;
  }

  // नामांक 1–9 सब ढक जाएँ (SHARMA उपनाम के साथ)
  const names = ['ADITYA SHARMA', 'AJAY SHARMA', 'ANSHUL SHARMA', 'ANIRUDH SHARMA', 'ANAND SHARMA',
    'AMAR SHARMA', 'ANIKET SHARMA', 'AMIT SHARMA', 'AARAV SHARMA'];

  it('मूलांक, भाग्यांक, नामांक, संबंध, लो-शू, समय, रत्न, उपाय — सब छपते हैं', () => {
    // जाँची जाने वाली हर बात (label + असली वाक्यांश)
    const needles = [];
    const add = (label, text) => { if (text) needles.push({ label, text }); };
    for (let n = 1; n <= 9; n += 1) {
      add(`MULANK[${n}].swabhav`, T.MULANK[n].swabhav);
      add(`MULANK[${n}].karya`, T.MULANK[n].karya);
      add(`MULANK[${n}].dhan`, T.MULANK[n].dhan);
      add(`MULANK[${n}].sehat`, T.MULANK[n].sehat);
      add(`MULANK[${n}].sambandh`, T.MULANK[n].sambandh);
      add(`MULANK[${n}].dhyan`, T.MULANK[n].dhyan[0]);
      add(`BHAGYANK[${n}]`, T.BHAGYANK[n]);
      add(`NAAMANK[${n}]`, T.NAAMANK[n]);
      add(`LOSHU_NUM[${n}].missing`, T.LOSHU_NUM[n].missing);
      add(`LOSHU_NUM[${n}].many`, T.LOSHU_NUM[n].many);
      add(`LOSHU_NUM[${n}].one`, T.LOSHU_NUM[n].one);
      add(`MISSING_UPAY ${n}`, T.MISSING_UPAY[`missing-${n}`]);
      add(`PERSONAL_YEAR[${n}]`, T.PERSONAL_YEAR[n].t);
      add(`PERSONAL_MONTH[${n}]`, T.PERSONAL_MONTH[n]);
      add(`BUSINESS.nature[${n}]`, T.BUSINESS.nature[n]);
    }
    for (const k of Object.keys(T.KUA).filter((x) => /^[1-9]$/.test(x))) add(`KUA[${k}]`, T.KUA[k].best);
    for (const k of Object.keys(T.MB_PAIR)) add(`MB_PAIR.${k}`, T.MB_PAIR[k].t);
    add('MB_SAME', T.MB_SAME.t);
    for (const k of Object.keys(T.PLANET_UPAY)) add(`PLANET_UPAY.${k}`, T.PLANET_UPAY[k]);
    for (const k of Object.keys(T.GEM_TEXT)) add(`GEM_TEXT.${k}`, T.GEM_TEXT[k]);
    for (const k of Object.keys(T.METAL_TEXT)) add(`METAL_TEXT.${k}`, T.METAL_TEXT[k]);
    for (const k of Object.keys(T.LOSHU_PLANES)) {
      add(`LOSHU_PLANES.${k}.complete`, T.LOSHU_PLANES[k].complete);
      add(`LOSHU_PLANES.${k}.empty`, T.LOSHU_PLANES[k].empty);
    }
    for (const line of T.METHOD) add('METHOD', line);
    for (const [k, v] of T.GLOSSARY) add(`GLOSSARY.${k}`, v);
    for (const f of T.FAQ) add('FAQ', f.a.slice(0, 30));

    const found = new Set();
    const dec = (x) => x.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const scan = (htmlStr) => {
      const plain = dec(htmlStr);
      for (let i = 0; i < needles.length; i += 1) {
        if (found.has(i)) continue;
        const t = needles[i].text;
        if (plain.includes(t) || htmlStr.includes(t)) found.add(i);
      }
    };
    scan(read('ank/index.html')); // FAQ/परिचय स्थिर HTML में

    // (क) सारी 81 (मूलांक, भाग्यांक) जोड़ियाँ
    for (let m = 1; m <= 9; m += 1) {
      for (let b = 1; b <= 9; b += 1) {
        const dob = dobFor(m, b);
        expect(dob).not.toBeNull();
        const dd = buildAnkData({ name: names[(m + b) % names.length], dob, gender: b % 2 ? 'm' : 'f' }, { nowMs: NOW });
        expect(dd.errors).toEqual([]);
        expect(dd.core.mulank).toBe(m);
        expect(dd.core.bhagyank).toBe(b);
        scan(renderResult(dd));
      }
    }
    // (ख) आगे की तिथियाँ (खाली अंक, कुआ, नामांक — सब रास्ते) — सीमित sweep
    const pad = (n) => String(n).padStart(2, '0');
    // तय (seeded) यादृच्छिक तिथियाँ — 1950 से 2015 तक फैली हुई
    let seed = 20261119;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = 0; i < 400; i += 1) {
      const y = 1950 + Math.floor(rnd() * 66);
      const mo = 1 + Math.floor(rnd() * 12);
      const d = 1 + Math.floor(rnd() * 28);
      const dd = buildAnkData({ name: names[i % names.length], dob: `${y}-${pad(mo)}-${pad(d)}`, gender: i % 3 === 0 ? 'f' : 'm' }, { nowMs: NOW });
      if (dd.errors.length) continue;
      scan(renderResult(dd));
    }
    // (ग) partner/mobile/business वाले रास्ते
    scan(renderResult(buildAnkData({
      name: 'RAHUL SHARMA', dob: '1985-08-15', gender: 'm',
      partner: { name: 'PRIYA VERMA', dob: '1992-12-03' }, mobile: '9876543210', business: ['Bapuji Herbals', 'Herbal Shop', 'Ayur Store'],
    }, { nowMs: NOW })));

    const missing = needles.filter((_, i) => !found.has(i)).map((n) => n.label);
    // तीन entry ऐसी हैं जो इस page पर कभी नहीं छप सकतीं — वजह नीचे:
    //  · PLANET_UPAY.rahu / .ketu — सप्ताह के सातों दिनों का अपना ग्रह होता है (रवि…शनि),
    //    राहु/केतु का कोई वार नहीं; उनका उपाय MISSING_UPAY (अंक 4/7) में आ जाता है।
    //  · LOSHU_PLANES.mental.empty — 1900–2100 का हर वर्ष 19xx (9 है) या 20xx (2 है),
    //    इसलिए मानसिक रेखा (4-9-2) कभी पूरी खाली नहीं हो सकती।
    const KNOWN_UNREACHABLE = ['PLANET_UPAY.rahu', 'PLANET_UPAY.ketu', 'LOSHU_PLANES.mental.empty'];
    expect(missing.sort()).toEqual(KNOWN_UNREACHABLE.sort());
  });

  it('संयुक्त अंक 10–52 — हर एक का वाक्य छपता है', () => {
    const base = buildAnkData({ name: 'RAHUL SHARMA', dob: '1985-08-15', gender: 'm' }, { nowMs: NOW });
    for (let k = 10; k <= 52; k += 1) {
      const d = JSON.parse(JSON.stringify(base));
      d.name.chaldean.compound = k;
      d.name.chaldean.cls = classOf(k);
      expect(renderResult(d)).toContain(T.COMPOUND[k]);
    }
    expect(Object.keys(T.COMPOUND).length).toBe(43);
  });

  it('सुझाव/नए नाम के सारे रास्ते (कोई नहीं · fallback · सामान्य) छपते हैं', () => {
    const texts = [T.SUGGEST.none, T.SUGGEST.notNeeded, T.SUGGEST.newIntro, T.SUGGEST.newFallback, T.SUGGEST.intro];
    const seen = [];
    for (const nm of ['RAHUL SHARMA', 'PRIYA VERMA', 'ANITA', 'AMIT KUMAR', 'MEERA IYER', 'SHEETAL']) {
      const h = renderResult(buildAnkData({ name: nm, dob: '1985-08-15', gender: 'f' }, { nowMs: NOW }));
      for (const t of texts) if (h.includes(t)) seen.push(t);
    }
    // 'none' (कोई सुझाव नहीं) और 'newIntro' कम से कम एक बार
    expect(seen).toContain(T.SUGGEST.none);
    expect(seen).toContain(T.SUGGEST.newIntro);
  });

  it('ग़लत input पर नरम संदेश — crash नहीं', () => {
    const bad = buildAnkData({ name: 'राम शर्मा', dob: '1985-08-15', mobile: '123', partner: { dob: '2010-02-30' } }, { nowMs: NOW });
    expect(bad.errors.map((e) => e.code).sort()).toEqual(['dob-invalid', 'mobile-length', 'roman-name']);
    expect(() => renderResult(bad)).not.toThrow();
  });
});

// Claude, 19-11-2026: टास्क 02 के बचे सुधार
import { readFileSync as _rf } from 'node:fs';
describe('अंक page — Claude के अंतिम सुधार', () => {
  const css = _rf(new URL('../src/ank/ank.css', import.meta.url), 'utf8');
  const js = _rf(new URL('../src/ank/main.js', import.meta.url), 'utf8');
  const rep = _rf(new URL('../src/ank/report.js', import.meta.url), 'utf8');
  it('print में wrapper की padding हटती है, ताकि कवर पूरे पन्ने पर आए (body ही .ank है)', () => {
    expect(css).toMatch(/body\.ank-doc \.wrap\{padding:0!important/);
    expect(css).not.toMatch(/body\.ank-doc \.ank \.wrap/);
  });
  it('print में सप्ताह 4 स्तंभ, महीने 4 स्तंभ', () => {
    expect(css).toMatch(/\.ank \.week\{grid-template-columns:repeat\(4,1fr\)!important\}/);
    expect(css).toMatch(/\.ank \.months\{grid-template-columns:repeat\(4,1fr\)!important\}/);
  });
  it('बटन दबाने पर फल तक scroll; report में अंक अंग्रेज़ी digits में', () => {
    expect(js).toMatch(/scrollIntoView/);
    expect(rep).toMatch(/const digitsHi = \(s\) => String\(s\);/);
  });
  it('स्कोर-शीर्षक में निर्णय का label (उत्तम/अच्छा/सामान्य/कमज़ोर), tone का शब्द नहीं', () => {
    expect(rep).toMatch(/NAME_DECISION\[s\.decision\] \|\| \{\}\)\.label/);
  });
});
describe('निर्णय-pill में निर्णय का शब्द', () => {
  const rep = _rf(new URL('../src/ank/report.js', import.meta.url), 'utf8');
  it('मिलान/मोबाइल/व्यापार में tone(dec.tone) नहीं, decTone(dec)', () => {
    expect(rep).not.toMatch(/tone\(dec\.tone\)/);
    expect((rep.match(/decTone\(dec\)/g) || []).length).toBe(3);
  });
});
describe('spelling-सुझाव के साथ सावधानी', () => {
  const rep = _rf(new URL('../src/ank/report.js', import.meta.url), 'utf8');
  it('SUGGEST.caution छपता है; बिना सुझाव के SCORE_NOTE दोबारा नहीं', () => {
    expect(rep).toMatch(/T\.SUGGEST\.caution/);
    expect((rep.match(/T\.SCORE_NOTE/g) || []).length).toBe(1);
  });
});
