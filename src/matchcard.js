// matchcard.js — build the Kundli Matching "scorecard" as a standalone SVG,
// used for the PNG download on the match report page (same technique as the
// single-chart PNG export). Kept separate so it can be unit-tested.

const escapeXml = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

// data:
// {
//   names: { boy, girl },
//   lines: { boy, girl },            // short birth lines
//   rows: [{ hi, en, points, max }], // 8 kootas
//   total, maxTotal,
//   verdict: { hi, en },
//   footer,
// }
export function buildScorecardSvg(data) {
  const W = 1200
  const H = 1010
  const parts = []
  parts.push(
    `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="18" fill="#ffffff" stroke="#f0dcc4" stroke-width="2"/>`
  )
  parts.push(
    `<text x="${W / 2}" y="78" text-anchor="middle" font-size="40" font-weight="700" fill="#a94f05">कुंडली मिलान / Kundli Matching</text>`
  )
  parts.push(
    `<text x="${W / 2}" y="126" text-anchor="middle" font-size="27" fill="#2b1a0e">${escapeXml(
      [data.names.boy || '—', data.names.girl || '—'].join('  –  ')
    )}</text>`
  )
  parts.push(
    `<text x="${W / 2}" y="161" text-anchor="middle" font-size="17" fill="#7a6a5c">${escapeXml(data.lines.boy)}</text>`
  )
  parts.push(
    `<text x="${W / 2}" y="186" text-anchor="middle" font-size="17" fill="#7a6a5c">${escapeXml(data.lines.girl)}</text>`
  )
  parts.push(`<line x1="80" y1="214" x2="${W - 80}" y2="214" stroke="#f0dcc4" stroke-width="2"/>`)

  parts.push(
    `<text x="110" y="256" font-size="20" font-weight="700" fill="#a94f05">कूट / Koota</text>` +
      `<text x="${W - 110}" y="256" text-anchor="end" font-size="20" font-weight="700" fill="#a94f05">अंक / Points</text>`
  )

  let y = 302
  for (const row of data.rows) {
    parts.push(`<text x="110" y="${y}" font-size="22" fill="#2b1a0e">${escapeXml(`${row.hi} / ${row.en}`)}</text>`)
    parts.push(
      `<text x="${W - 110}" y="${y}" text-anchor="end" font-size="22" fill="#2b1a0e">${escapeXml(
        `${row.points} / ${row.max}`
      )}</text>`
    )
    parts.push(`<line x1="80" y1="${y + 18}" x2="${W - 80}" y2="${y + 18}" stroke="#f6ead9" stroke-width="1.5"/>`)
    y += 54
  }

  // Total band
  const ty = y + 10
  parts.push(`<rect x="80" y="${ty - 44}" width="${W - 160}" height="62" rx="12" fill="#fff1e2"/>`)
  parts.push(`<text x="110" y="${ty}" font-size="25" font-weight="700" fill="#a94f05">कुल योग / Total</text>`)
  parts.push(
    `<text x="${W - 110}" y="${ty + 2}" text-anchor="end" font-size="29" font-weight="700" fill="#a94f05">${escapeXml(
      `${data.total} / ${data.maxTotal}`
    )}</text>`
  )

  const vy = ty + 86
  parts.push(
    `<text x="${W / 2}" y="${vy}" text-anchor="middle" font-size="22" fill="#2b1a0e">${escapeXml(data.verdict.hi)}</text>`
  )
  parts.push(
    `<text x="${W / 2}" y="${vy + 32}" text-anchor="middle" font-size="20" fill="#7a6a5c">${escapeXml(
      data.verdict.en
    )}</text>`
  )

  parts.push(
    `<text x="${W / 2}" y="${H - 52}" text-anchor="middle" font-size="17" fill="#7a6a5c">${escapeXml(data.footer)}</text>`
  )

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Noto Sans Devanagari', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">${parts.join(
    ''
  )}</svg>`
}
