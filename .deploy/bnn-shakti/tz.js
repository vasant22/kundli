// BNN कुंडली — टाइम-ज़ोन का हिसाब (1.0.4 / टास्क 02)
// -----------------------------------------------------------------------------
// सब कुछ ब्राउज़र/Electron के अपने Intl (IANA) से — कोई इंटरनेट नहीं।
// नियम (वही जो projects/kundli/src/timeutil.js में जाँचे हुए हैं):
//   • offsetAt(ms, tz)      = उस पल का offset (मिनट, UTC से पूर्व)
//   • stdOffsetOfYear(tz,y) = उस साल के मानक offset (छह तारीख़ों में सबसे छोटा) → rec.gmt
//   • rec.dst = असली offset − मानक offset      (कभी ऋणात्मक नहीं)
//   • gmt + dst हमेशा IANA के offset के बराबर, पूरा।
//   • जो घड़ी का समय कभी नहीं आया (spring-forward) → kind 'gap'
//     जो दो बार आया (fall-back) → kind 'repeat' (दोनों offset लौटते हैं, user चुने)
window.BNNTz = (function () {
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function valid(tz) {
    try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; }
  }

  // उस UTC पल पर उस ज़ोन का offset (मिनट)। ग़लत नाम → null
  function offsetAt(ms, tz) {
    try {
      var dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      var p = {}, parts = dtf.formatToParts(new Date(ms));
      for (var i = 0; i < parts.length; i++) p[parts[i].type] = parts[i].value;
      var asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
      return Math.round((asUtc - ms) / 60000);
    } catch (e) { return null; }
  }

  // दी हुई दीवार-घड़ी (local) को UTC में — जिस offset के साथ
  function wallToUtc(y, mo, d, h, mi, s, offMin) {
    return Date.UTC(y, mo - 1, d, h, mi, s) - offMin * 60000;
  }

  // उस साल का मानक offset — छह तारीख़ों के offset में सबसे छोटा (जन/मार्च/मई/जुल/सित/नव, 15 तारीख़)
  function stdOffsetOfYear(tz, year) {
    var months = [1, 3, 5, 7, 9, 11], best = null;
    for (var i = 0; i < months.length; i++) {
      var o = offsetAt(Date.UTC(year, months[i] - 1, 15, 12, 0, 0), tz);
      if (o === null) continue;
      if (best === null || o < best) best = o;
    }
    return best;
  }

  // दीवार-घड़ी का समय उस ज़ोन में — पूरा फ़ैसला
  //   लौटाता है: {kind:'ok'|'gap'|'repeat', off, utc, off2, utc2}
  //   • ok     → वह समय मौजूद, off = असली offset
  //   • gap    → वह समय कभी नहीं आया (घड़ी आगे बढ़ी)
  //   • repeat → वह समय दो बार आया; off = पहली बार (आम तौर पर DST), off2 = दूसरी बार
  function wallInfo(y, mo, d, h, mi, s, tz) {
    var wall = Date.UTC(y, mo - 1, d, h, mi, s);
    var H = 3600000;
    var offs = [], i, o;
    var samples = [-36, -24, -12, 0, 12, 24, 36];
    for (i = 0; i < samples.length; i++) {
      o = offsetAt(wall + samples[i] * H, tz);
      if (o !== null && offs.indexOf(o) < 0) offs.push(o);
    }
    var hits = [];
    for (i = 0; i < offs.length; i++) {
      var t = wall - offs[i] * 60000;
      if (offsetAt(t, tz) === offs[i]) hits.push({ off: offs[i], utc: t });
    }
    if (!hits.length) return { kind: 'gap', off: null, utc: null };
    hits.sort(function (a, b) { return a.utc - b.utc; });
    if (hits.length === 1) return { kind: 'ok', off: hits[0].off, utc: hits[0].utc };
    // दो बार आया — पहली बार वह जो पहले आया (UTC में छोटा)
    return { kind: 'repeat', off: hits[0].off, utc: hits[0].utc, off2: hits[hits.length - 1].off, utc2: hits[hits.length - 1].utc };
  }

  // "330" → "+05:30" ; "331.95" → "+05:31:57"
  function fmt(minutes) {
    if (minutes === null || minutes === undefined || !isFinite(minutes)) return '';
    var sign = minutes < 0 ? '-' : '+';
    var total = Math.round(Math.abs(minutes) * 60);
    var h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), sec = total % 60;
    var base = sign + pad2(h) + ':' + pad2(m);
    return sec ? base + ':' + pad2(sec) : base;
  }

  // "+05:30" / "-8" / "5:30" / "+05:31:57" → मिनट (ग़लत → null)
  function parseOffset(text) {
    var m = /^([+-]?)(\d{1,2})(?::([0-5]\d)(?::([0-5]\d))?)?$/.exec(String(text == null ? '' : text).trim());
    if (!m) return null;
    var sign = m[1] === '-' ? -1 : 1;
    var mins = sign * (Number(m[2]) * 60 + Number(m[3] || 0) + Number(m[4] || 0) / 60);
    if (mins < -12 * 60 || mins > 14 * 60) return null;
    return mins;
  }

  // देशांतर → स्थानीय (सूर्य) समय — पुराने भारत वाला ही तरीक़ा (मिनट तक)
  function lmtOf(lon) {
    var hoursExact = Number(lon) / 15;
    var totalSec = Math.round(hoursExact * 3600);
    var sign = totalSec < 0 ? '-' : '+';
    var a = Math.abs(totalSec);
    var h = Math.floor(a / 3600), m = Math.floor((a % 3600) / 60), sec = a % 60;
    return { minutes: Math.round(hoursExact * 60), text: sign + pad2(h) + ':' + pad2(m) + ':' + pad2(sec) };
  }

  return {
    valid: valid, offsetAt: offsetAt, wallToUtc: wallToUtc, stdOffsetOfYear: stdOffsetOfYear,
    wallInfo: wallInfo, fmt: fmt, parseOffset: parseOffset, lmtOf: lmtOf
  };
})();
