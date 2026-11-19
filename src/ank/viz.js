// अंक ज्योतिष के चित्र — सब inline SVG (कोई चित्र-file नहीं), kit के हूबहू।
// loshuSvg = लो-शू यंत्र, gaugeSvg = नाम-स्कोर अर्ध-चक्र, ringSvg = मिलान-वलय, starfield = कवर-आकाश।

export const BADGE = { 1: 'सू', 2: 'चं', 3: 'गु', 4: 'रा', 5: 'बु', 6: 'शु', 7: 'के', 8: 'श', 9: 'मं' };
export const GRID = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];

export const NC = (n) => `var(--n${n})`;

/** अंक का गोला (orb) — अंक + ग्रह का हिंदी अक्षर। size: '', 'sm', 'xs' */
export function orb(n, size = '') {
  const badge = size === '' ? `<i>${BADGE[n]}</i>` : '';
  return `<span class="orb ${size}" style="--c:${NC(n)}"><b>${n}</b>${badge}</span>`;
}

/** लो-शू यंत्र: भरे खाने ग्रह-वर्ण में (अंक + गिनती के बिंदु), खाली खाने धारीदार। */
export function loshuSvg(counts, theme = 'light', size = 230) {
  const dark = theme === 'dark';
  const pad = 14;
  const cell = (size - pad * 2) / 3;
  const frame = dark ? '#E9B949' : '#1C2452';
  let s = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="लो-शू ग्रिड">
  <defs><pattern id="hatch-${theme}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <line x1="0" y1="0" x2="0" y2="6" stroke="${dark ? 'rgba(255,255,255,.14)' : '#E3E1EC'}" stroke-width="2"/></pattern></defs>
  <rect x="3" y="3" width="${size - 6}" height="${size - 6}" rx="16" fill="${dark ? 'rgba(255,255,255,.04)' : '#fff'}" stroke="${frame}" stroke-width="2"/>
  <rect x="9" y="9" width="${size - 18}" height="${size - 18}" rx="12" fill="none" stroke="${frame}" stroke-opacity=".45" stroke-width="1"/>`;
  GRID.forEach((row, r) =>
    row.forEach((n, c) => {
      const x = pad + c * cell + 4;
      const y = pad + r * cell + 4;
      const w = cell - 8;
      const k = counts[n] || 0;
      if (k) {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="12" style="fill:${NC(n)}"/>
      <text x="${x + w / 2}" y="${y + w / 2 + 4}" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="${w * [0, 0.46, 0.38, 0.3][Math.min(k, 3)]}" fill="#fff">${String(n).repeat(Math.min(k, 3))}</text>
      <text x="${x + w - 9}" y="${y + 15}" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="11" fill="#fff" opacity=".9">${BADGE[n]}</text>`;
        for (let i = 0; i < k; i += 1) {
          s += `<circle cx="${x + w / 2 + (i - (k - 1) / 2) * 9}" cy="${y + w - 10}" r="2.6" fill="#fff"/>`;
        }
      } else {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${w}" rx="12" fill="url(#hatch-${theme})" stroke="${dark ? 'rgba(255,255,255,.28)' : '#C9CCDA'}" stroke-dasharray="4 4"/>
      <text x="${x + w / 2}" y="${y + w / 2 + 8}" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="${w * 0.34}" fill="${dark ? 'rgba(255,255,255,.35)' : '#B9BCCB'}">${n}</text>`;
      }
    })
  );
  return `${s}</svg>`;
}

/** नाम-स्कोर अर्ध-चक्र (0–10), चार खंड + सुई + बड़ा अंक। */
export function gaugeSvg(score, theme = 'light') {
  const dark = theme === 'dark';
  const W = 200;
  const H = 150;
  const cx = 100;
  const cy = 96;
  const R = 82;
  const seg = [[0, 4, '#B5522B'], [4, 6, '#C77A0A'], [6, 8, '#5FAE7E'], [8, 10, '#2C8C5A']];
  const pt = (v, r = R) => {
    const a = Math.PI * (1 - v / 10);
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  };
  let s = `<svg viewBox="0 0 ${W} ${H + 8}" width="${W}" height="${H + 8}" role="img" aria-label="नाम-स्कोर ${score} में से 10">`;
  seg.forEach(([a, b, c]) => {
    const [x1, y1] = pt(a + 0.06);
    const [x2, y2] = pt(b - 0.06);
    s += `<path d="M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}" stroke="${c}" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  });
  const [nx, ny] = pt(score, R - 26);
  s += `<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="${dark ? '#fff' : '#1C2452'}" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="7" fill="${dark ? '#E9B949' : '#EF7D1A'}"/>
  <text x="${cx}" y="${cy + 40}" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="34" fill="${dark ? '#fff' : '#1C2452'}">${score}</text>
  <text x="${cx}" y="${H + 4}" text-anchor="middle" font-family="Noto Sans Devanagari" font-weight="600" font-size="12" fill="${dark ? '#C9CEE8' : '#6B6F85'}">नाम-स्कोर / 10 · ${score >= 8 ? 'उत्तम' : score >= 6 ? 'अच्छा' : score >= 4 ? 'सामान्य' : 'कमज़ोर'}</text>`;
  return `${s}</svg>`;
}

/** मिलान-वलय (प्रतिशत)। */
export function ringSvg(p) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const col = p >= 75 ? '#2C8C5A' : p >= 55 ? '#5FAE7E' : p >= 40 ? '#C77A0A' : '#B5522B';
  return `<svg viewBox="0 0 84 84" width="84" height="84" role="img" aria-label="मिलान ${p} प्रतिशत"><circle cx="42" cy="42" r="${r}" stroke="#E6E2EE" stroke-width="9" fill="none"/>
  <circle cx="42" cy="42" r="${r}" stroke="${col}" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="${(c * p) / 100} ${c}" transform="rotate(-90 42 42)"/>
  <text x="42" y="49" text-anchor="middle" font-family="Baloo 2" font-weight="800" font-size="21" fill="#1C2452">${p}%</text></svg>`;
}

/** कवर का तारों भरा आकाश (तय बीज — हर बार एक जैसा)। */
export function starfield() {
  let s = '';
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 120; i += 1) {
    s += `<circle cx="${(rnd() * 210).toFixed(2)}" cy="${(rnd() * 297).toFixed(2)}" r="${(rnd() * 0.5 + 0.12).toFixed(2)}" fill="#E9B949" opacity="${(rnd() * 0.6 + 0.15).toFixed(2)}"/>`;
  }
  return s;
}
