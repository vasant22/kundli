// pages.js — the four public tool URLs, in ONE place.
//
// Why this exists (17 Oct 2026): the app used to live at
// kundli.mybapuji.com/{,match/,panchang/,bnn/}, so every nav link was written
// relative to the page's own depth (`./bnn/` on the kundli page but `../bnn/`
// on the match page). Moving the tools onto mybapuji.com as four sibling pages
// made that depth-coupling a bug waiting to happen — one moved file and half
// the nav broke.
//
// All paths below are absolute from the domain root, so they are correct no
// matter which page (or how deep a widget) renders them. If a tool ever moves,
// change it here only.
//
// vite.config.js base is '/kundli-assets/' — keep it in sync if that changes.

export const PAGES = {
  /** वैदिक कुंडली — the main page (was kundli.mybapuji.com/) */
  kundli: '/kundli/',
  /** कुंडली मिलान — was kundli.mybapuji.com/match/ */
  match: '/kundli-milan/',
  /** पंचांग — was kundli.mybapuji.com/panchang/ */
  panchang: '/panchang/',
  /** फ्री BNN चार्ट — was kundli.mybapuji.com/bnn/ */
  bnn: '/bnn-chart/',
}

// The three mini-widgets mybapuji.com embeds as iframes. Each one only
// collects a form and hands the visitor to the full tool in a new tab, so they
// live one level under their parent tool and carry <meta name="robots"
// content="noindex"> on purpose.
export const WIDGET_PAGES = {
  kundli: '/kundli/widget/',
  match: '/kundli-milan/widget/',
  panchang: '/panchang/widget/',
}

/** Absolute URL for a path above, for hrefs that must leave the current page. */
export const absoluteUrl = (path) => new URL(path, location.origin).href
