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

/** मूलांक जिन अंकों को शत्रु मानता है (क्रम से)। */
export function enemyNumbers(mulank) {
  return NUMBERS.filter((n) => relation(mulank, n) === 'x');
}

/**
 * उपाय-संकेत। `missing` = लो-शू के खाली अंक।
 */
export function remedyBlock(mulank, bhagyank, missing = []) {
  const lucky = luckyNumbers(mulank, bhagyank);
  const enemies = enemyNumbers(mulank);

  const wear = { number: mulank, planet: planetOf(mulank), ...GEMS[mulank] };
  const avoid = enemies.map((n) => ({ number: n, planet: planetOf(n), ...GEMS[n] }));

  const powerNumbers = [mulank, bhagyank];
  const careNumber = enemies.length ? enemies[0] : null;
  const careDayKey = careNumber ? PLANETS[careNumber].dayKey : null;

  const weekly = WEEKDAYS.map((d) => {
    const isPower = powerNumbers.includes(d.number);
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
      remedyKey: missing.includes(d.number) ? `missing-${d.number}` : null,
    };
  });

  const powerDays = WEEKDAYS.filter((d) => powerNumbers.includes(d.number)).map((d) => d.hi);

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
    careDay: careDayKey ? PLANETS[careNumber].dayHi : null,
    careNumber,
    enemyNumbers: enemies,
    goodDates,
    careDates,
  };
}
