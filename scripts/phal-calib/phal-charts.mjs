// scripts/phal-calib/phal-charts.mjs — the twelve charts the फलादेश layer is
// checked against (task 04 §2, executed early in task 01-ग).
//
// Three are public figures (birth details are public record); the other nine are
// deliberately awkward cases: a lagna 0.7′ from a sign boundary, the Moon 0.005°
// from a nakshatra boundary, Mercury AND Venus retrograde, a Kaal-sarpa chart,
// a wartime +6:30 birth, south India, the north-east, a 00:05 birth, and a chart
// whose साढ़ेसाती is running in November 2026.
//
// `utc` is what our engine takes; `dob/tob/tz` is what the oracle takes.
export const CHARTS = [
  {
    id: 'pub-1869-porbandar',
    note: 'सार्वजनिक जन्म-विवरण',
    dob: '1869-10-02', tob: '07:12', place: 'Porbandar, Gujarat', lat: 21.64, lon: 69.60, tz: 5.5,
    utc: { year: 1869, month: 10, day: 2, hour: 1, minute: 42, second: 0 },
  },
  {
    id: 'pub-1889-allahabad',
    note: 'सार्वजनिक जन्म-विवरण',
    dob: '1889-11-14', tob: '23:30', place: 'Allahabad, Uttar Pradesh', lat: 25.44, lon: 81.85, tz: 5.5,
    utc: { year: 1889, month: 11, day: 14, hour: 18, minute: 0, second: 0 },
  },
  {
    id: 'pub-1973-mumbai',
    note: 'सार्वजनिक जन्म-विवरण',
    dob: '1973-04-24', tob: '16:20', place: 'Mumbai, Maharashtra', lat: 19.08, lon: 72.88, tz: 5.5,
    utc: { year: 1973, month: 4, day: 24, hour: 10, minute: 50, second: 0 },
  },
  {
    id: 'edge-lagna-1992',
    note: 'लग्न राशि-सीमा से 0.7′ पर (मीन→मेष)',
    dob: '1992-03-10', tob: '07:07', place: 'Mumbai, Maharashtra', lat: 19.076, lon: 72.8777, tz: 5.5,
    utc: { year: 1992, month: 3, day: 10, hour: 1, minute: 37, second: 0 },
  },
  {
    id: 'edge-moon-2001',
    note: 'चंद्र नक्षत्र-सीमा से 0.005° पर (मूल के आरंभ पर), दक्षिण भारत',
    dob: '2001-07-05', tob: '07:54', place: 'Chennai, Tamil Nadu', lat: 13.0827, lon: 80.2707, tz: 5.5,
    utc: { year: 2001, month: 7, day: 5, hour: 2, minute: 24, second: 0 },
  },
  {
    id: 'retro-1990',
    note: 'बुध और शुक्र दोनों वक्री',
    dob: '1990-01-01', tob: '17:30', place: 'Delhi', lat: 28.6139, lon: 77.209, tz: 5.5,
    utc: { year: 1990, month: 1, day: 1, hour: 12, minute: 0, second: 0 },
  },
  {
    id: 'kaalsarpa-1995',
    note: 'कालसर्प (सातों ग्रह राहु-केतु अक्ष के एक ओर)',
    dob: '1995-11-02', tob: '11:45', place: 'Jaipur, Rajasthan', lat: 26.9124, lon: 75.7873, tz: 5.5,
    utc: { year: 1995, month: 11, day: 2, hour: 6, minute: 15, second: 0 },
  },
  {
    id: 'war-1943',
    note: 'युद्धकाल IST +6:30',
    dob: '1943-03-03', tob: '06:15', place: 'Kolkata, West Bengal', lat: 22.5726, lon: 88.3639, tz: 6.5,
    utc: { year: 1943, month: 3, day: 2, hour: 23, minute: 45, second: 0 },
  },
  {
    id: 'south-1994',
    note: 'दक्षिण भारत (बेंगलुरु), सायं जन्म',
    dob: '1994-08-09', tob: '21:40', place: 'Bengaluru, Karnataka', lat: 12.9716, lon: 77.5946, tz: 5.5,
    utc: { year: 1994, month: 8, day: 9, hour: 16, minute: 10, second: 0 },
  },
  {
    id: 'northeast-2010',
    note: 'उत्तर-पूर्व (गुवाहाटी), भोर का जन्म',
    dob: '2010-08-15', tob: '04:05', place: 'Guwahati, Assam', lat: 26.1445, lon: 91.7362, tz: 5.5,
    utc: { year: 2010, month: 8, day: 14, hour: 22, minute: 35, second: 0 },
  },
  {
    id: 'midnight-1975',
    note: 'रात 00:05 का जन्म (तारीख़ बदलने के तुरंत बाद)',
    dob: '1975-12-25', tob: '00:05', place: 'Delhi', lat: 28.6139, lon: 77.209, tz: 5.5,
    utc: { year: 1975, month: 12, day: 24, hour: 18, minute: 35, second: 0 },
  },
  {
    id: 'sadesati-now',
    note: 'साढ़ेसाती नवंबर 2026 में चल रही हो (जन्म-चंद्र मेष, शनि मीन में)',
    dob: '1996-04-15', tob: '10:30', place: 'Jaipur, Rajasthan', lat: 26.9124, lon: 75.7873, tz: 5.5,
    utc: { year: 1996, month: 4, day: 15, hour: 5, minute: 0, second: 0 },
  },
]

// The "today" every comparison uses, so runs are reproducible.
export const NOW_MS = Date.UTC(2026, 10, 11, 12, 0, 0)
