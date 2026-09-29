// widget-resize.js — tells the parent page how tall this widget card is, so
// the mybapuji.com homepage can size each <iframe> exactly (no inner
// scrollbars, no cut-off content). Used by all three homepage widgets
// (Panchang card, Kundli, Kundli-Matching).
//
// Sends { type: 'acw-height', height: N } to the parent window on load, on
// window resize, and whenever the card's content changes (ResizeObserver).
// Does nothing when the page is opened directly (not inside an iframe) or in
// unit tests.
//
// The homepage side listens for these messages (same origin policy is kept:
// the parent only accepts them from kundli.mybapuji.com).

export function installHeightReporter(win, doc) {
  win = win || (typeof window !== 'undefined' ? window : undefined)
  doc = doc || (win && win.document ? win.document : undefined)
  if (!win || !doc) return
  if (!win.parent || win.parent === win) return // not embedded — nothing to do

  let last = 0
  // The card's true content height: prefer the #widget element itself
  // (scrollHeight can never go BELOW the iframe's current height, so it
  // would report the iframe size instead of the content size).
  const measure = () => {
    if (typeof doc.getElementById === 'function') {
      const el = doc.getElementById('widget')
      if (el && typeof el.getBoundingClientRect === 'function') {
        const h = el.getBoundingClientRect().height
        if (h > 0) return Math.ceil(h)
      }
    }
    return Math.ceil(Math.max(
      doc.documentElement ? doc.documentElement.scrollHeight || 0 : 0,
      doc.body ? doc.body.scrollHeight || 0 : 0,
    ))
  }

  const post = () => {
    const height = measure()
    if (height > 0 && height !== last) {
      last = height
      win.parent.postMessage({ type: 'acw-height', height }, '*')
    }
  }

  const schedule = () => {
    if (typeof win.requestAnimationFrame === 'function') win.requestAnimationFrame(post)
    else setTimeout(post, 50)
  }

  win.addEventListener('load', schedule)
  win.addEventListener('resize', schedule)

  const ResizeObserverImpl = win.ResizeObserver || (typeof ResizeObserver !== 'undefined' ? ResizeObserver : undefined)
  if (ResizeObserverImpl && doc.body) {
    try {
      new ResizeObserverImpl(schedule).observe(doc.body)
    } catch {
      /* older browsers — the load/resize events still cover it */
    }
  }
  schedule()
}
