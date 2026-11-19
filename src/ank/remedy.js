// उपाय-संकेत — शुभ अंक, रत्न/धातु की key, साप्ताहिक योजना और शुभ/सावधानी तिथियाँ।
// यहाँ कोई वाक्य नहीं बनता — सिर्फ़ keys और अंक, जिनसे text-file वाक्य बनाएगी।

import { NUMBERS, PLANETS, WEEKDAYS, relation, reduce, planetOf } from './core.js';

/** अंक → रत्न और धातु (key + हिंदी नाम)। */
export const GEMS = {
  1: { gemKey: 'ruby', gemHi: 'माणिक्य', metalKey: 'copper', metalHi: 'ताँबा' },
  2: { gemKey: 'pearl', gemHi: 'मोती', metalKey: 'silver', metalHi: 'चाँदी' },
  3: { gemKey: 'yellow-sapphire', gemHi: 'पुखराज', metalKey: 'gold', metalHi: 'सोना' },
  4: { gemKey: 'hessonite', gemHi: 'गोमेद', metalKey: 'ashtadhatu', metalHi: 'अष्टधातु' },
  5: { gemKey: 'emerald', gemHi: 'पन्ना', metalKey: 'bronze', metalHi: 'काँसा' },
  6: {
    gemKey: 'diamond',
    gemHi: 'हीरा',
    altGemKey: 'opal',
    altGemHi: 'ओपल',
    metalKey: 'silver',
    metalHi: 'चाँदी',
  },
  7: { gemKey: 'catseye', gemHi: 'लहसुनिया', metalKey: 'panchdhatu', metalHi: 'पंचधातु' },
  8: { gemKey: 'blue-sapphire', gemHi: 'नीलम', metalKey: 'iron', metalHi: 'लोहा' },
  9: { gemKey: 'red-coral', gemHi: 'मूँगा', metalKey: 'copper', metalHi: 'ताँबा' },
};

/** मूलांक के लिए शुभ: ख़ुद, भाग्यांक, फिर 1–9 में जो दोनों के मित्र हों (अधिकतम 5)। */
export function luckyNumbers(mulank, bhagyank) {
  const out = [];
  const add = (n) => {
    if (n >= 1 && n <= 9 && !out.includes(n) && out.length < 5) out.push(n);
  };
  add(mulank);
  add(bhagyank);
  for (const n of NUMBERS) {
    if (relation(mulank, n) === 'm' && relation(bhagyank, n) === 'm') add(n);
  }
  return out;
}

/** भारतीय अंक-ज्योतिष के शुभ दिन (अंक के अनुसार); सूची का पहला = मुख्य दिन। */
export const LUCKY_DAYS = {
  1: ['sun'],
  2: ['mon'],
  3: ['thu'],
  4: ['sun', 'sat'],
  5: ['wed'],
  6: ['fri'],
  7: ['mon', 'sun'],
  8: ['sat'],
  9: ['tue'],
};

/** अंक के शुभ दिन (वार-keys, पहला = मुख्य)। */
export function luckyDays(n) {
  return (LUCKY_DAYS[n] || []).slice();
}

/** वार-key का हिंदी नाम। */
export function dayHiOf(key) {
  const d = WEEKDAYS.find((w) => w.key === key);
  return d ? d.hi : null;
}

/** मूलांक जिन अंकों को शत्रु मानता है (क्रम से)। */
export function enemyNumbers(mulank) {
  return NUMBERS.filter((n) => relation(mulank, n) === 'x');
}

/** अंक → उपाय का वार (उस ग्रह का दिन): 4 → शनिवार, 7 → मंगलवार। */
export function remedyDayOf(n) {
  return PLANETS[n] ? PLANETS[n].dayKey : null;
}

/**
 * उपाय-संकेत। `missing` = लो-शू के खाली अंक।
 * power-दिन = मूलांक/भाग्यांक के ग्रह के वार; सावधानी-दिन = पहला शत्रु-अंक जिसका वार power से अलग हो।
 */
export function remedyBlock(mulank, bhagyank, missing = []) {
  const lucky = luckyNumbers(mulank, bhagyank);
  const enemies = enemyNumbers(mulank);

  const wear = { number: mulank, planet: planetOf(mulank), ...GEMS[mulank] };
  const avoid = enemies.map((n) => ({ number: n, planet: planetOf(n), ...GEMS[n] }));

  // power-दिन = मूलांक और भाग्यांक के शुभ दिनों का मेल (दोहराव हटाकर)
  const powerKeys = [...new Set([...luckyDays(mulank), ...luckyDays(bhagyank)])];
  // सावधानी-दिन = पहला शत्रु-अंक जिसका मुख्य शुभ दिन किसी power-दिन से अलग हो
  const careNumber = enemies.find((n) => !powerKeys.includes(luckyDays(n)[0])) ?? null;
  const careDayKey = careNumber ? luckyDays(careNumber)[0] : null;

  const weekly = WEEKDAYS.map((d) => {
    const isPower = powerKeys.includes(d.key);
    const isCare = careDayKey === d.key;
    return {
      dayKey: d.key,
      dayHi: d.hi,
      dayShort: d.short,
      number: d.number,
      planet: planetOf(d.number),
      // एक दिन पर दोनों बातें आ सकती हैं — तब 'power' का दर्जा ऊपर, और `care` अलग बताया जाता है
      kind: isPower ? 'power' : isCare ? 'care' : 'normal',
      care: isCare,
      // उस वार के ग्रह वाले सारे खाली अंक (4 और 8 दोनों शनिवार पर आ सकते हैं)
      missing: missing
        .filter((n) => remedyDayOf(n) === d.key)
        .map((n) => `missing-${n}`),
    };
  });

  const powerDays = powerKeys.map(dayHiOf).filter(Boolean);

  const goodDates = [];
  const careDates = [];
  for (let day = 1; day <= 31; day += 1) {
    const dn = reduce(day);
    if (relation(mulank, dn) === 'm') goodDates.push(day);
    else if (relation(mulank, dn) === 'x') careDates.push(day);
  }

  return {
    lucky: {
      numbers: lucky,
      planets: lucky.map((n) => planetOf(n)),
    },
    stones: { wear, avoid },
    weekly,
    powerDays,
    careDay: careDayKey ? dayHiOf(careDayKey) : null,
    careNumber,
    enemyNumbers: enemies,
    goodDates,
    careDates,
  };
}
