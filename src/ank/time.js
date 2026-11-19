// समय-खंड — व्यक्तिगत वर्ष/मास, अगले 10 वर्ष और 12 महीने, और वर्तमान आयु।
// "आज" हमेशा Asia/Kolkata से लिया जाता है (nowMs बाहर से आता है, code में तारीख़ नहीं)।

import { reduce } from './core.js';

export const TZ = 'Asia/Kolkata';
const IST_MS = (5 * 60 + 30) * 60 * 1000;

/** nowMs → कोलकाता की तारीख़ के हिस्से। */
export function kolkataParts(nowMs) {
  const t = Number.isFinite(nowMs) ? nowMs : Date.now();
  const d = new Date(t + IST_MS);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const p2 = (n) => String(n).padStart(2, '0');
  return {
    y,
    m,
    d: day,
    iso: `${y}-${p2(m)}-${p2(day)}`,
    weekday: d.getUTCDay(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/** व्यक्तिगत वर्ष = reduce(reduce(जन्म-माह) + reduce(जन्म-दिन) + reduce(वर्ष))। */
export function personalYear(birthMonth, birthDay, year) {
  return reduce(reduce(birthMonth) + reduce(birthDay) + reduce(year));
}

/** व्यक्तिगत मास = reduce(व्यक्तिगत वर्ष + कैलेंडर-माह)। */
export function personalMonth(birthMonth, birthDay, year, month) {
  return reduce(personalYear(birthMonth, birthDay, year) + month);
}

export const MONTHS_HI = [
  'जनवरी',
  'फ़रवरी',
  'मार्च',
  'अप्रैल',
  'मई',
  'जून',
  'जुलाई',
  'अगस्त',
  'सितंबर',
  'अक्टूबर',
  'नवंबर',
  'दिसंबर',
];

/**
 * समय-खंड का पूरा हिसाब: चालू व्यक्तिगत वर्ष/मास, आयु (जन्मदिन बीता या नहीं),
 * अगले 10 वर्ष और अगले 12 महीने।
 */
export function timeBlock(dob, nowMs) {
  const today = kolkataParts(nowMs);
  const bm = dob.m;
  const bd = dob.d;
  const birthdayPassed = today.m > bm || (today.m === bm && today.d >= bd);
  let age = today.y - dob.y;
  if (!birthdayPassed) age -= 1;

  const forecast10 = [];
  for (let i = 0; i < 10; i += 1) {
    const year = today.y + i;
    forecast10.push({
      year,
      age: year - dob.y,
      personalYear: personalYear(bm, bd, year),
    });
  }

  const forecast12 = [];
  let y = today.y;
  let m = today.m;
  for (let i = 0; i < 12; i += 1) {
    forecast12.push({
      year: y,
      month: m,
      monthHi: MONTHS_HI[m - 1],
      personalMonth: personalMonth(bm, bd, y, m),
    });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  const daysToBirthday =
    (() => {
      const make = (yy) => Date.UTC(yy, bm - 1, bd);
      let next = make(today.y);
      const nowDate = Date.UTC(today.y, today.m - 1, today.d);
      if (next < nowDate) next = make(today.y + 1);
      return Math.round((next - nowDate) / 86400000);
    })();

  return {
    today: today.iso,
    tz: TZ,
    personalYear: personalYear(bm, bd, today.y),
    personalMonth: personalMonth(bm, bd, today.y, today.m),
    age,
    birthdayPassed,
    daysToBirthday,
    forecast10,
    forecast12,
  };
}
