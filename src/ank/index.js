// अंक ज्योतिष का मुख्य द्वार — `buildAnkData(input, { nowMs })` एक साफ़ JSON देता है।
// हर ग़लत input पर `errors[]` भरता है, कभी crash नहीं करता। सब कुछ browser में, कोई
// ephemeris/WASM/network नहीं — सिर्फ़ शुद्ध गणना।

import { parseDob, planetOf, relation } from './core.js';
import { chaldean, scoreName, suggestSpellings, newNames, checkSpellings } from './name.js';
import { loShu } from './loshu.js';
import { timeBlock, TZ } from './time.js';
import { partnerMatch, mobileCheck, businessNames } from './match.js';
import { remedyBlock } from './remedy.js';

export const ANK_VERSION = '1.0';

/**
 * पूरा अंक-ज्योतिष फलादेश एक JSON में।
 * input: { name, dob:'YYYY-MM-DD', gender:'m'|'f'|null, partner:{name?,dob}?, mobile?, business:[]?, check:[]? }
 */
export function buildAnkData(input, opts = {}) {
  const nowMs = Number.isFinite(opts.nowMs) ? opts.nowMs : Date.now();
  const src = input && typeof input === 'object' ? input : {};
  const errors = [];

  const nameIn = typeof src.name === 'string' ? src.name : '';
  const dobIn = typeof src.dob === 'string' ? src.dob.trim() : '';
  const gender = src.gender === 'm' || src.gender === 'f' ? src.gender : null;

  const c0 = chaldean(nameIn);
  if (c0.error) errors.push({ field: 'name', code: 'roman-name' });

  const dob = parseDob(dobIn);
  if (!dob.ok) errors.push({ field: 'dob', code: dob.error, value: dobIn });

  const core = dob.ok
    ? {
      mulank: dob.mulank,
      bhagyank: dob.bhagyank,
      chains: dob.chains,
      planets: { mulank: planetOf(dob.mulank), bhagyank: planetOf(dob.bhagyank) },
      relation: {
        mulankBhagyank: relation(dob.mulank, dob.bhagyank),
        bhagyankMulank: relation(dob.bhagyank, dob.mulank),
      },
      dob: {
        iso: dob.iso,
        day: dob.d,
        month: dob.m,
        year: dob.y,
        total: dob.total,
      },
    }
    : {
      mulank: null,
      bhagyank: null,
      chains: null,
      planets: null,
      relation: null,
      dob: dobIn ? { iso: dobIn } : null,
    };

  const mulank = core.mulank;
  const bhagyank = core.bhagyank;

  /* ---- नाम ---- */
  const nameBlock = {
    chaldean: c0.error ? null : c0,
    first: c0.error ? null : c0.first,
    score: null,
    suggestions: [],
    newNames: [],
    checked: [],
  };
  if (!c0.error && mulank) {
    nameBlock.score = scoreName(nameIn, mulank, bhagyank);
    nameBlock.suggestions = suggestSpellings(nameIn, mulank, bhagyank, 10);
    nameBlock.newNames = newNames(
      c0.words.slice(1).join(' '),
      gender,
      mulank,
      bhagyank,
      nameBlock.score.score10,
      10
    );
  }
  if (Array.isArray(src.check) && src.check.length) {
    nameBlock.checked = mulank ? checkSpellings(src.check, mulank, bhagyank) : [];
    if (!mulank) errors.push({ field: 'check', code: 'no-core' });
    for (const c of nameBlock.checked) {
      if (c.error) errors.push({ field: 'check', code: c.error, value: c.input });
    }
  }

  /* ---- लो-शू ---- */
  let loshu = null;
  if (dob.ok) loshu = loShu(dob, gender);

  /* ---- समय ---- */
  const time = dob.ok ? timeBlock(dob, nowMs) : null;

  /* ---- मिलान ---- */
  const match = { partner: null, mobile: null, business: [] };

  const partnerIn = src.partner && typeof src.partner === 'object' ? src.partner : null;
  if (partnerIn) {
    const pdob = parseDob(typeof partnerIn.dob === 'string' ? partnerIn.dob.trim() : '');
    if (!pdob.ok) {
      errors.push({ field: 'partner.dob', code: pdob.error, value: partnerIn.dob ?? '' });
      match.partner = { error: pdob.error };
    } else if (!dob.ok) {
      errors.push({ field: 'partner', code: 'no-core' });
      match.partner = { error: 'no-core' };
    } else {
      const pname = typeof partnerIn.name === 'string' ? partnerIn.name : '';
      const pScore = pname && !chaldean(pname).error ? scoreName(pname, pdob.mulank, pdob.bhagyank) : null;
      match.partner = {
        error: null,
        name: pname ? chaldean(pname).text : '',
        dob: pdob.iso,
        mulank: pdob.mulank,
        bhagyank: pdob.bhagyank,
        planets: { mulank: planetOf(pdob.mulank), bhagyank: planetOf(pdob.bhagyank) },
        nameScore: pScore && !pScore.error ? pScore : null,
        ...partnerMatch(
          { mulank: dob.mulank, bhagyank: dob.bhagyank },
          { mulank: pdob.mulank, bhagyank: pdob.bhagyank }
        ),
      };
    }
  }

  if (src.mobile !== undefined && src.mobile !== null && String(src.mobile).trim() !== '') {
    if (!mulank) {
      errors.push({ field: 'mobile', code: 'no-core' });
      match.mobile = { error: 'no-core' };
    } else {
      match.mobile = mobileCheck(src.mobile, mulank, bhagyank);
      if (match.mobile.error) errors.push({ field: 'mobile', code: match.mobile.error });
    }
  }

  if (Array.isArray(src.business) && src.business.length) {
    if (!mulank) {
      errors.push({ field: 'business', code: 'no-core' });
    } else {
      match.business = businessNames(src.business, mulank, bhagyank);
      for (const b of match.business) {
        if (b.error) errors.push({ field: 'business', code: b.error, value: b.input });
      }
    }
  }

  /* ---- उपाय ---- */
  const remedy = mulank
    ? remedyBlock(mulank, bhagyank, loshu ? loshu.missing : [])
    : null;

  return {
    meta: {
      version: ANK_VERSION,
      tz: TZ,
      nowMs,
      today: time ? time.today : null,
    },
    core,
    name: nameBlock,
    loshu,
    time,
    match,
    remedy,
    errors,
  };
}

/** सिर्फ़ नाम+तिथि से मूल अंक (ग़लत पर null) — हल्का रास्ता। */
export function quickCore(dobInput) {
  const dob = parseDob(typeof dobInput === 'string' ? dobInput.trim() : '');
  if (!dob.ok) return { error: dob.error, mulank: null, bhagyank: null };
  return { error: null, mulank: dob.mulank, bhagyank: dob.bhagyank, dob };
}
