#!/usr/bin/env node
// scripts/ank-calib/oracle-compare.mjs — अंक-ज्योतिष के अंकों का जाँच-यंत्र (oracle) से मिलान।
//
// Oracle एक बाहरी zip है जिसका licence नहीं है, इसलिए उसे सिर्फ़ यहाँ, सिर्फ़ जाँच के लिए
// चलाया जाता है — उसका code/text/नाम-सूची कहीं नहीं पढ़ी जाती और repo में नहीं आती।
// zip: ~/.openclaw-autoclaw/workspace/reference-only/numerology-skill-oracle/
// output: .openclaw-tmp/ank-oracle/ (gitignored)
//
// मिलान सिर्फ़ इन खंडों में (बाक़ी जान-बूझकर नहीं — वे हमारी अपनी पद्धति हैं):
//   मूलांक · भाग्यांक · कैल्डियन कुल/संयुक्त/एकल/श्रेणी · पहले नाम का योग ·
//   लो-शू गिनती/खाली (बिना gender) · कुआ (gender के साथ) · व्यक्तिगत वर्ष · व्यक्तिगत मास

import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAnkData } from '../../src/ank/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const PY = '/opt/homebrew/bin/python3.12';
const ZIP = join(
  process.env.HOME || '',
  '.openclaw-autoclaw/workspace/reference-only/numerology-skill-oracle/numerology-skill-original.zip'
);
const WORK = join(REPO, '.openclaw-tmp/ank-oracle');
const SRC = join(WORK, 'numerology');

/** 40 जोड़ियाँ — पुरुष/स्त्री, 1–3 शब्द, दिन 1–31, लीप-वर्ष, 1950–2015। */
const CASES = [
  ['RAHUL SHARMA', '1985-08-15', 'm'],
  ['PRIYA VERMA', '1992-12-03', 'f'],
  ['AMIT KUMAR', '2000-02-29', 'm'],
  ['ANITA', '2001-04-30', 'f'],
  ['VIKRAM', '1978-01-01', 'm'],
  ['MEERA IYER', '1963-07-19', 'f'],
  ['ROHAN GUPTA', '1999-11-11', 'm'],
  ['KAVYA NAIR', '1994-06-07', 'f'],
  ['ISHITA SINGH', '1988-03-31', 'f'],
  ['AARAV JOSHI', '2015-12-31', 'm'],
  ['SUNIL', '1950-05-05', 'm'],
  ['RADHA SHARMA', '1955-09-09', 'f'],
  ['MANOJ TIWARI', '1967-10-10', 'm'],
  ['DEEPA KULKARNI', '1972-02-29', 'f'],
  ['ARJUN REDDY', '1996-01-26', 'm'],
  ['NEHA AGARWAL', '1990-08-28', 'f'],
  ['PAWAN MISHRA', '1983-04-17', 'm'],
  ['SHREYA DAS', '1997-07-04', 'f'],
  ['KIRAN PATEL', '1975-11-23', 'm'],
  ['LATA CHAUHAN', '1959-12-12', 'f'],
  ['MOHAN LAL VERMA', '1961-03-15', 'm'],
  ['SITA RAM YADAV', '1953-06-21', 'm'],
  ['GEETA DEVI', '1949-09-02', 'f'],
  ['HARI OM', '1985-02-28', 'm'],
  ['UMA SHANKAR', '1970-04-04', 'm'],
  ['JAYA BACHCHAN', '1948-04-09', 'f'],
  ['RAMESH', '2004-10-31', 'm'],
  ['SHEETAL', '2010-01-09', 'f'],
  ['ABHISHEK', '1993-05-13', 'm'],
  ['DIVYA', '1995-09-30', 'f'],
  ['NITIN', '1981-06-06', 'm'],
  ['POOJA', '1989-03-03', 'f'],
  ['RAVI KISHAN', '1966-08-08', 'm'],
  ['TARA', '2008-02-29', 'f'],
  ['YOGESH', '1979-07-27', 'm'],
  ['ANJALI', '1998-11-19', 'f'],
  ['SURAJ', '2002-12-24', 'm'],
  ['KAMLA', '1957-10-02', 'f'],
  ['VIJAY KUMAR SINGH', '1969-01-31', 'm'],
  ['PADMA', '1987-05-25', 'f'],
];

function ensureOracle() {
  if (!existsSync(SRC)) {
    if (!existsSync(ZIP)) throw new Error(`oracle zip नहीं मिला: ${ZIP}`);
    mkdirSync(WORK, { recursive: true });
    execFileSync('unzip', ['-o', '-q', ZIP, '-d', WORK]);
  }
  if (!existsSync(PY)) throw new Error(`python3.12 नहीं मिला: ${PY}`);
}

function runOracle(name, dob, gender, file) {
  // gender न दें तो oracle लो-शू में कुआ नहीं जोड़ता — गिनती/खाली उसी से मिलाते हैं
  const args = [
    'numerology/scripts/numerology.py',
    '--name',
    name,
    '--dob',
    dob,
    '--system',
    'parashara',
    '--suggest',
    '0',
    '--no-new-names',
    '--out',
    file,
  ];
  if (gender) args.splice(5, 0, '--gender', gender);
  execFileSync(PY, args, { cwd: WORK, stdio: ['ignore', 'ignore', 'ignore'] });
  return JSON.parse(readFileSync(file, 'utf8'));
}

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function main() {
  ensureOracle();
  const nowMs = Date.now();
  const rows = [];
  const totals = new Map();
  const fail = [];
  const exempt = [];

  const check = (section, label, ours, theirs, ctx) => {
    const key = `${section}`;
    const t = totals.get(key) || { ok: 0, bad: 0 };
    if (eq(ours, theirs)) t.ok += 1;
    else {
      t.bad += 1;
      fail.push({ section, label, ours, theirs, ...ctx });
    }
    totals.set(key, t);
  };

  CASES.forEach(([name, dob, gender], i) => {
    const n0 = String(i + 1).padStart(2, '0');
    // बिना gender: लो-शू गिनती/खाली (कुआ नहीं) · gender के साथ: कुआ अलग
    const o = runOracle(name, dob, null, join(WORK, `case-${n0}.json`));
    const og = runOracle(name, dob, gender, join(WORK, `case-${n0}-g.json`));
    const d = buildAnkData({ name, dob, gender }, { nowMs });
    const ctx = { case: i + 1, name, dob, gender };

    check('मूलांक', ctx.name, d.core.mulank, o.vedic.mulank, ctx);
    check('भाग्यांक', ctx.name, d.core.bhagyank, o.vedic.bhagyank, ctx);
    check('नाम कुल योग', name, d.name.chaldean.total, o.chaldean_name.total, ctx);
    check('नाम संयुक्त', name, d.name.chaldean.compound, o.chaldean_name.compound, ctx);
    check('नामांक (एकल)', name, d.name.chaldean.namank, o.chaldean_name.single, ctx);
    // 20 की श्रेणी हमने जान-बूझकर मिश्र रखी है (Cheiro) — oracle उसे शुभ कहता है; यही एक अपवाद है
    if (d.name.chaldean.compound === 20) exempt.push({ name, dob, compound: 20 });
    else check('नाम श्रेणी', name, d.name.chaldean.cls, o.chaldean_name.class, ctx);
    check('पहले नाम का योग', name, d.name.first.total, o.chaldean_first_name.total, ctx);
    check('लो-शू गिनती', name, d.loshu.counts, o.lo_shu.counts, ctx);
    check('लो-शू खाली', name, d.loshu.missing, o.lo_shu.missing, ctx);
    check('कुआ', name, d.loshu.kua, og.lo_shu.kua, ctx);
    check('व्यक्तिगत वर्ष', name, d.time.personalYear, o.personal_year_now, ctx);
    // मूलांक-भाग्यांक संबंध अब नहीं मिलाया — वह हमारी अपनी तालिका है (01-ग)

    const yOurs = new Map(d.time.forecast10.map((y) => [y.year, y.personalYear]));
    for (const y of o.year_forecast) {
      check('व्यक्तिगत वर्ष (10)', `${name} ${y.year}`, yOurs.get(y.year), y.personal_year, ctx);
    }
    const mOurs = new Map(d.time.forecast12.map((m) => [`${m.year}-${m.month}`, m.personalMonth]));
    for (const m of o.month_forecast) {
      check('व्यक्तिगत मास (12)', `${name} ${m.year}-${m.month}`, mOurs.get(`${m.year}-${m.month}`), m.personal_month, ctx);
    }

    rows.push({ ...ctx, mulank: d.core.mulank, bhagyank: d.core.bhagyank, name: 1 });
  });

  // सारांश
  let ok = 0;
  let bad = 0;
  console.log('\nखंड-दर-खंड मिलान (40 नाम+तिथियाँ):');
  for (const [section, t] of totals) {
    ok += t.ok;
    bad += t.bad;
    const pct = ((t.ok / (t.ok + t.bad)) * 100).toFixed(1);
    console.log(`  ${t.bad === 0 ? '✓' : '✗'} ${section.padEnd(26)} ${String(t.ok).padStart(4)}/${t.ok + t.bad}  ${pct}%`);
  }
  const pct = ((ok / (ok + bad)) * 100).toFixed(2);
  console.log(`\nकुल: ${ok}/${ok + bad} — ${pct}%`);
  if (exempt.length) {
    console.log(`अपवाद (जान-बूझकर): संयुक्त 20 की श्रेणी — ${exempt.length} मामले (हम मिश्र, oracle शुभ) · ${exempt.map((e) => e.name).join(', ')}`);
  }

  if (fail.length) {
    console.log('\nअंतर (पहले 20):');
    for (const f of fail.slice(0, 20)) {
      console.log(`  ✗ ${f.section} · ${f.label} — हमारा ${JSON.stringify(f.ours)} · oracle ${JSON.stringify(f.theirs)}`);
    }
    writeFileSync(join(WORK, 'diff.json'), JSON.stringify({ cases: CASES.length, fail }, null, 2));
    console.log(`\nपूरा अंतर: ${join(WORK, 'diff.json')}`);
    process.exitCode = 1;
  } else {
    console.log('\nहर जाँचा खंड 100% मिला।');
  }
  writeFileSync(join(WORK, 'cases.json'), JSON.stringify(rows, null, 2));
}

main();
