// अंक ज्योतिष page का चालक — form, URL params, result render, PDF (print=1)।
// सारी गणना browser में; कोई request, cookie या server नहीं।

// Noto fonts की @font-face ank.css में ही है (अलग fonts-*.css chunk नहीं — 19-11 को Cloudflare ने उसका 404 cache कर लिया था)
import './ank.css';
import { buildAnkData } from './index.js';
import * as T from './text-hi.js';
import { renderResult } from './report.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const PRINT = new URLSearchParams(location.search).get('print') === '1';

/** फ़ॉर्म के खाने */
const F = {
  name: $('#f-name'),
  d: $('#f-d'),
  m: $('#f-m'),
  y: $('#f-y'),
  pn: $('#f-pn'),
  pd: $('#f-pd'),
  mob: $('#f-mob'),
  biz: $('#f-biz'),
  chk: $('#f-chk'),
};

const pad2 = (n) => String(n).padStart(2, '0');
const listOf = (v) => String(v || '').split(/[,;|\n]+/).map((x) => x.trim()).filter(Boolean);

function err(code, fallback) {
  return (T.ERR[code] || fallback || T.ERR.generic || 'कुछ गड़बड़ हुई।');
}

function showError(msg) {
  const box = $('#f-err');
  if (!box) return;
  box.textContent = msg || '';
  box.classList.toggle('on', !!msg);
}

function genderValue() {
  const el = $('input[name="g"]:checked');
  const v = el ? el.value : 'n';
  return v === 'm' || v === 'f' ? v : null;
}

function readForm() {
  return {
    name: F.name.value.trim(),
    dob: F.d.value && F.m.value && F.y.value ? `${F.y.value}-${pad2(F.m.value)}-${pad2(F.d.value)}` : '',
    gender: genderValue(),
    partner: F.pd.value ? { name: F.pn.value.trim(), dob: F.pd.value } : null,
    mobile: F.mob.value.trim(),
    business: listOf(F.biz.value).slice(0, 3),
    check: listOf(F.chk.value).slice(0, 5),
  };
}

/** छोटी जाँच — नरम संदेश, crash नहीं */
function validate(input) {
  if (!input.name) return err('nameEmpty');
  if (!/[A-Za-z]/.test(input.name)) return err('romanName');
  if (!input.dob) return err('dobInvalid');
  return '';
}

function urlFor(input, print) {
  const q = new URLSearchParams();
  if (input.name) q.set('name', input.name);
  const [, y, m, d] = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.dob) || []; // dob = YYYY-MM-DD
  if (y) {
    q.set('d', String(Number(d)));
    q.set('m', String(Number(m)));
    q.set('y', String(Number(y)));
  }
  if (input.gender) q.set('g', input.gender);
  if (input.partner && input.partner.dob) {
    q.set('pn', input.partner.name || '');
    q.set('pd', input.partner.dob);
  }
  if (input.mobile) q.set('mob', input.mobile);
  if (input.business.length) q.set('biz', input.business.join(','));
  if (input.check.length) q.set('chk', input.check.join(','));
  if (print) q.set('print', '1');
  return `${location.pathname}?${q.toString()}`;
}

function fillFromUrl() {
  const q = new URLSearchParams(location.search);
  const get = (k) => q.get(k) || '';
  if (get('name')) F.name.value = get('name');
  if (get('d')) F.d.value = get('d');
  if (get('m')) F.m.value = get('m');
  if (get('y')) F.y.value = get('y');
  const g = get('g');
  if (g) {
    const el = $(`input[name="g"][value="${g}"]`);
    if (el) el.checked = true;
  }
  if (get('pn')) F.pn.value = get('pn');
  if (get('pd')) F.pd.value = get('pd');
  if (get('mob')) F.mob.value = get('mob');
  if (get('biz')) F.biz.value = get('biz');
  if (get('chk')) F.chk.value = get('chk');
  return ['name', 'd', 'm', 'y'].every((k) => get(k));
}

let lastInput = null;

function render(input) {
  const bad = validate(input);
  if (bad) {
    showError(bad);
    return false;
  }
  const data = buildAnkData(input, { nowMs: Date.now() });
  const hard = data.errors.find((e) => e.field === 'dob');
  if (hard) {
    showError(hard.code === 'dob-range' ? err('dobRange') : err('dobInvalid'));
    return false;
  }
  if (data.errors.some((e) => e.field === 'name')) {
    showError(err('romanName'));
    return false;
  }
  showError('');
  lastInput = input;
  const host = $('#result');
  host.innerHTML = renderResult(data, { print: PRINT });
  host.hidden = false;
  document.body.classList.add('ank-doc');
  document.title = `अंक ज्योतिष फल — ${data.name.chaldean.text} | mybapuji.com`;
  wireResult();
  if (!PRINT) {
    const url = urlFor(input, false);
    history.replaceState(null, '', url);
  }
  return true;
}

function wireResult() {
  $$('[data-pdf]').forEach((b) => b.addEventListener('click', () => {
    if (!lastInput) return;
    window.open(urlFor(lastInput, true), '_blank', 'noopener');
  }));
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const btn = b;
    try {
      await navigator.clipboard.writeText(location.href);
      const old = btn.textContent;
      btn.textContent = T.FORM.copied || 'link कॉपी हो गया';
      setTimeout(() => { btn.textContent = old; }, 1800);
    } catch {
      btn.textContent = T.FORM.copied || 'link कॉपी हो गया';
    }
  }));
  $$('.chipbar a').forEach((a) => a.addEventListener('click', () => {
    $$('.chipbar a').forEach((x) => x.classList.remove('on'));
    a.classList.add('on');
  }));
}

function boot() {
  if (!$('#ank-form')) return;
  const full = fillFromUrl();
  if (full && PRINT) {
    const input = readForm();
    if (render(input)) {
      // print एक ही बार — fonts तैयार होने पर, वरना 5 सेकंड की सीमा पर
      let printed = false;
      const doPrint = () => {
        if (printed) return;
        printed = true;
        window.print();
      };
      const go = () => setTimeout(doPrint, 120);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
      else go();
      setTimeout(doPrint, 5000);
    }
    return;
  }
  $('#ank-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (render(readForm())) {
      // बटन दबाने पर फल तक ले चलें (phone पर form लंबा है, वरना फल नीचे छिपा रहता है)।
      // URL से खुलने पर scroll नहीं — तब page ऊपर ही रहे।
      const top = $('#result');
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (top && top.scrollIntoView) top.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  });
  if (full) render(readForm());
  // gender के तीनों बटन — दिखने में segmented
  $$('input[name="g"]').forEach((r) => r.addEventListener('change', () => {
    $$('.seg label').forEach((l) => l.classList.toggle('on', !!l.querySelector('input:checked')));
  }));
}

boot();
