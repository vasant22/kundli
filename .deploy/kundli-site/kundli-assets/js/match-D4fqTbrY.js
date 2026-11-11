import{a as e,c as t}from"./astro-BRoGble9.js";import{S as n,T as r,a as i,b as a,m as o,w as s,y as c}from"./timeutil-DGdNkOFG.js";import{t as l}from"./mybapuji-strip-CKYeMZbr.js";import{t as u}from"./geocode-DLqB8puT.js";import{n as d}from"./prefill-DEE8HIZn.js";import{t as f}from"./birthvalidate-BF0eFUWx.js";import{t as p}from"./tzauto-DrPmeVvO.js";import{n as ee,t as m}from"./pages-Cw1CFDfv.js";import{i as h,n as g,r as _}from"./mangaldosha-Kw5EmkbK.js";var v=e=>String(e).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`);function y(e){let t=1200,n=1010,r=[];r.push(`<rect x="6" y="6" width="1188" height="998" rx="18" fill="#ffffff" stroke="#f0dcc4" stroke-width="2"/>`),r.push(`<text x="${t/2}" y="78" text-anchor="middle" font-size="40" font-weight="700" fill="#a94f05">कुंडली मिलान / Kundli Matching</text>`),r.push(`<text x="${t/2}" y="126" text-anchor="middle" font-size="27" fill="#2b1a0e">${v([e.names.boy||`—`,e.names.girl||`—`].join(`  –  `))}</text>`),r.push(`<text x="${t/2}" y="161" text-anchor="middle" font-size="17" fill="#7a6a5c">${v(e.lines.boy)}</text>`),r.push(`<text x="${t/2}" y="186" text-anchor="middle" font-size="17" fill="#7a6a5c">${v(e.lines.girl)}</text>`),r.push(`<line x1="80" y1="214" x2="1120" y2="214" stroke="#f0dcc4" stroke-width="2"/>`),r.push(`<text x="110" y="256" font-size="20" font-weight="700" fill="#a94f05">कूट / Koota</text><text x="1090" y="256" text-anchor="end" font-size="20" font-weight="700" fill="#a94f05">अंक / Points</text>`);let i=302;for(let t of e.rows)r.push(`<text x="110" y="${i}" font-size="22" fill="#2b1a0e">${v(`${t.hi} / ${t.en}`)}</text>`),r.push(`<text x="1090" y="${i}" text-anchor="end" font-size="22" fill="#2b1a0e">${v(`${t.points} / ${t.max}`)}</text>`),r.push(`<line x1="80" y1="${i+18}" x2="1120" y2="${i+18}" stroke="#f6ead9" stroke-width="1.5"/>`),i+=54;let a=i+10;r.push(`<rect x="80" y="${a-44}" width="1040" height="62" rx="12" fill="#fff1e2"/>`),r.push(`<text x="110" y="${a}" font-size="25" font-weight="700" fill="#a94f05">कुल योग / Total</text>`),r.push(`<text x="1090" y="${a+2}" text-anchor="end" font-size="29" font-weight="700" fill="#a94f05">${v(`${e.total} / ${e.maxTotal}`)}</text>`);let o=a+86;return r.push(`<text x="${t/2}" y="${o}" text-anchor="middle" font-size="22" fill="#2b1a0e">${v(e.verdict.hi)}</text>`),r.push(`<text x="${t/2}" y="${o+32}" text-anchor="middle" font-size="20" fill="#7a6a5c">${v(e.verdict.en)}</text>`),r.push(`<text x="${t/2}" y="958" text-anchor="middle" font-size="17" fill="#7a6a5c">${v(e.footer)}</text>`),`<svg xmlns="http://www.w3.org/2000/svg" width="${t}" height="${n}" viewBox="0 0 ${t} ${n}" font-family="'Noto Sans Devanagari', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif">${r.join(``)}</svg>`}var b=`https://github.com/vasant22/kundli`,x=document.querySelector(`#app`),S=e=>e===``?NaN:Number(e);function C(e){let t=t=>`${e}-${t}`;return`
    <div class="field">
      <label for="${t(`name`)}" data-i18n="form.name"></label>
      <input id="${t(`name`)}" type="text" autocomplete="off" data-i18n-placeholder="form.namePh" />
    </div>

    <div class="field">
      <span class="group-label" data-i18n="form.dob"></span>
      <div class="mini">
        <span class="mini-label" data-i18n="date.month"></span>
        <div id="${t(`month-box`)}" class="chips"></div>
      </div>
      <div class="row-2">
        <div class="mini">
          <label for="${t(`day`)}" data-i18n="date.day"></label>
          <input id="${t(`day`)}" type="number" inputmode="numeric" min="1" max="31" placeholder="1–31" />
        </div>
        <div class="mini">
          <label for="${t(`year`)}" data-i18n="date.year"></label>
          <input id="${t(`year`)}" type="number" inputmode="numeric" min="1800" max="2400" placeholder="1990" />
        </div>
      </div>
      <p class="err" id="${t(`err-date`)}" aria-live="polite"></p>
    </div>

    <div class="field">
      <span class="group-label"><span data-i18n="form.tob"></span> <span class="muted" data-i18n="form.tobNote"></span></span>
      <div class="row-3">
        <div class="mini">
          <label for="${t(`hour`)}" data-i18n="time.hour"></label>
          <input id="${t(`hour`)}" type="number" inputmode="numeric" min="0" max="23" placeholder="0–23" />
        </div>
        <div class="mini">
          <label for="${t(`minute`)}" data-i18n="time.minute"></label>
          <input id="${t(`minute`)}" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" />
        </div>
        <div class="mini">
          <label for="${t(`second`)}" data-i18n="time.second"></label>
          <input id="${t(`second`)}" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" value="0" />
        </div>
      </div>
      <p class="err" id="${t(`err-time`)}" aria-live="polite"></p>
      <div class="mini offset-mini">
        <label for="${t(`offset`)}" data-i18n="time.offset"></label>
        <input id="${t(`offset`)}" type="text" placeholder="+05:30" />
        <p class="note" data-i18n="time.offsetHint"></p>
      </div>
      <p class="err" id="${t(`err-offset`)}" aria-live="polite"></p>
    </div>

    <div class="field">
      <label for="${t(`place`)}" data-i18n="form.place"></label>
      <div class="search-row">
        <input id="${t(`place`)}" type="text" data-i18n-placeholder="form.placePh" />
        <button id="${t(`search-btn`)}" class="secondary" type="button" data-i18n="form.search"></button>
      </div>
      <p class="note" id="${t(`search-note`)}" hidden></p>
      <div id="${t(`results`)}" class="results" hidden></div>
      <p class="note ok" id="${t(`place-confirm`)}" hidden></p>
      <p class="err" id="${t(`err-place`)}" aria-live="polite"></p>
      <details id="${t(`manual-box`)}" class="manual">
        <summary class="manual-summary" data-i18n="manual.summary"></summary>
        <div class="row-3 manual-row">
          <div class="mini">
            <label for="${t(`lat`)}" data-i18n="manual.lat"></label>
            <input id="${t(`lat`)}" type="number" step="0.0001" inputmode="decimal" placeholder="25.3176" />
          </div>
          <div class="mini">
            <label for="${t(`lon`)}" data-i18n="manual.lon"></label>
            <input id="${t(`lon`)}" type="number" step="0.0001" inputmode="decimal" placeholder="82.9739" />
          </div>
          <div class="mini">
            <label for="${t(`tz`)}" data-i18n="manual.tz"></label>
            <input id="${t(`tz`)}" type="text" placeholder="Asia/Kolkata" />
          </div>
        </div>
        <p class="note" data-i18n="manual.hint"></p>
        <p class="note" id="${t(`tz-auto-note`)}" aria-live="polite" hidden></p>
        <p class="err" id="${t(`err-manual`)}" aria-live="polite"></p>
      </details>
      <p class="note credit">Geocoding by <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo.com</a></p>
    </div>
  `}x.innerHTML=l()+`
  <div class="wrap">
    <header class="site-header">
      <div>
        <h1 data-i18n="match.title"></h1>
        <p class="sub" data-i18n="match.subtitle"></p>
        <p class="free-badge" data-i18n="match.badge"></p>
        <nav class="site-nav">
          <a href="${m.kundli}" data-i18n="nav.home"></a>
          <a href="${m.match}" class="active" data-i18n="nav.match"></a>
          <a href="${m.panchang}" data-i18n="nav.panchang"></a>
          <a href="${m.bnn}" data-i18n="nav.bnn"></a>        </nav>
      </div>
      <button id="lang-toggle" class="lang-toggle" type="button"></button>
    </header>

    <main>
      <section class="card match-intro-card">
        <p class="note" data-i18n="match.intro"></p>
      </section>

      <form id="match-form" class="card" novalidate>
        <section id="step-b" class="step">
          <p class="step-badge" data-i18n="match.step1"></p>
          <h2 class="form-heading" data-i18n="match.boysHeading"></h2>
          ${C(`b`)}
          <p class="note" data-i18n="match.nextNote"></p>
          <button class="primary" type="button" id="continue-btn" data-i18n="match.continue"></button>
        </section>

        <section id="step-g" class="step" hidden>
          <p class="step-badge" data-i18n="match.step2"></p>
          <h2 class="form-heading" data-i18n="match.girlsHeading"></h2>
          ${C(`g`)}
          <button class="back-btn" type="button" id="back-btn" data-i18n="match.back"></button>
          <button class="primary" type="button" id="report-btn" data-i18n="match.getReport"></button>
        </section>
      </form>

      <section id="match-output" aria-live="polite" hidden></section>
    </main>

    <footer class="site-footer">
      <p class="note" data-i18n="footer.privacy"></p>
      <p class="note footer-credit-line">
        <span data-i18n="footer.poweredBy"></span><a href="https://www.astro.com/swisseph/" target="_blank" rel="noopener">Swiss Ephemeris</a> (Astrodienst AG) ·
        <a class="footer-source" href="${b}" target="_blank" rel="noopener" data-i18n="footer.source"></a>
      </p>
    </footer>
  </div>
`;var w=document.querySelector(`#match-output`),T=document.querySelector(`#lang-toggle`),E=document.querySelector(`#report-btn`),D={b:{selectedPlace:null,lastResults:[],lastNoteKey:null,lastSearch:{at:0,query:``}},g:{selectedPlace:null,lastResults:[],lastNoteKey:null,lastSearch:{at:0,query:``}}},O={b:{},g:{}},k=null;function A(e){let t=e=>String(e).padStart(2,`0`);return`${t(S(e.hour))}:${t(S(e.minute))}:${t(e.second===``?0:S(e.second))}`}function j(e){return`${S(e.day)} ${r(`month.`+S(e.month))} ${S(e.year)}`}function M(e){return e.offset===``?e.selectedPlace&&e.selectedPlace.timezone?e.selectedPlace.timezone:e.manual.tz===``?null:e.manual.tz:e.offset}function N(e){let t=M(e);if(!t)return null;try{let n={year:Number(e.year),month:Number(e.month),day:Number(e.day),hour:Number(e.hour),minute:Number(e.minute),second:e.second===``?0:Number(e.second)};return{zone:t,...i(n,t)}}catch(e){return console.error(`Time conversion failed:`,e),null}}var P=null;function F(){return P||=t(),P}function I(e){return e.manual.lat!==``&&e.manual.lon!==``&&e.manual.tz!==``?{latitude:Number(e.manual.lat),longitude:Number(e.manual.lon)}:e.selectedPlace?{latitude:e.selectedPlace.latitude,longitude:e.selectedPlace.longitude}:null}function L(e){let t=document.getElementById(`${e}-month-box`);t.replaceChildren(),c().forEach((n,r)=>{let i=document.createElement(`label`),a=document.createElement(`input`);a.type=`radio`,a.name=`${e}-month`,a.value=String(r+1);let o=document.createElement(`span`);o.textContent=n,i.append(a,o),t.append(i)})}function R(e){let t=c();document.querySelectorAll(`#${e}-month-box label span`).forEach((e,n)=>{e.textContent=t[n]})}function z(){document.documentElement.lang=o(),document.title=r(`match.docTitle`),document.querySelectorAll(`[data-i18n]`).forEach(e=>{e.textContent=r(e.dataset.i18n)}),document.querySelectorAll(`[data-i18n-placeholder]`).forEach(e=>{e.placeholder=r(e.dataset.i18nPlaceholder)}),R(`b`),R(`g`),T.textContent=r(`lang.switchTo`);for(let e of[`b`,`g`]){let t=D[e];t.dom&&(!t.dom.searchNote.hidden&&t.lastNoteKey&&(t.dom.searchNote.textContent=r(t.lastNoteKey)),t.renderConfirm()),Object.keys(O[e]).length>0&&H(e,O[e])}k&&Z(!1)}T.addEventListener(`click`,()=>{s(o()===`hi`?`en`:`hi`),z()});function B(e){let t=t=>document.getElementById(`${e}-${t}`).value.trim();return{name:t(`name`),day:t(`day`),month:document.querySelector(`input[name="${e}-month"]:checked`)?.value??``,year:t(`year`),hour:t(`hour`),minute:t(`minute`),second:t(`second`),offset:t(`offset`),place:t(`place`),selectedPlace:D[e].selectedPlace,manual:{lat:t(`lat`),lon:t(`lon`),tz:t(`tz`)}}}function V(e){return f(e,{requireGender:!1})}function H(e,t){let n=document.getElementById(`step-${e}`);n.querySelectorAll(`.err`).forEach(e=>{e.textContent=``}),n.querySelectorAll(`.has-error`).forEach(e=>e.classList.remove(`has-error`)),Object.entries(t).forEach(([t,n])=>{let r=document.getElementById(`${e}-err-${t}`);if(!r)return;r.textContent=n;let i=r.closest(`.field`);i&&i.classList.add(`has-error`)})}function U(e){let t=document.getElementById(`step-${e}`).querySelector(`.has-error input, .has-error select`);t&&t.focus()}function W(e){return[e.name,e.admin1,e.country].filter(Boolean).join(`, `)}function G(e){let t=D[e],n={searchBtn:document.getElementById(`${e}-search-btn`),searchNote:document.getElementById(`${e}-search-note`),placeInput:document.getElementById(`${e}-place`),resultsBox:document.getElementById(`${e}-results`),placeConfirm:document.getElementById(`${e}-place-confirm`)};t.dom=n;let i=document.getElementById(`${e}-tz-auto-note`);p({latEl:document.getElementById(`${e}-lat`),lonEl:document.getElementById(`${e}-lon`),tzEl:document.getElementById(`${e}-tz`),onState(e){i.hidden=!e,i.classList.toggle(`ok`,e===`filled`),e?(i.dataset.i18n=`tz.auto.${e}`,i.textContent=r(`tz.auto.${e}`)):(i.removeAttribute(`data-i18n`),i.textContent=``)}});let a=e=>{t.lastNoteKey=e,n.searchNote.hidden=!e,n.searchNote.textContent=e?r(e):``};t.renderConfirm=()=>{n.placeConfirm.hidden=!t.selectedPlace,t.selectedPlace&&(n.placeConfirm.textContent=`✔ ${r(`search.selected`)}: ${W(t.selectedPlace)} · ${t.selectedPlace.latitude}, ${t.selectedPlace.longitude} · ${t.selectedPlace.timezone}`)};let o=()=>{n.resultsBox.replaceChildren(),n.resultsBox.hidden=t.lastResults.length===0,t.lastResults.forEach(e=>{let r=document.createElement(`button`);r.type=`button`,r.className=`result-item`+(e===t.selectedPlace?` selected`:``),r.textContent=W(e),r.addEventListener(`click`,()=>{t.selectedPlace=e,a(null),t.renderConfirm(),o(),n.resultsBox.hidden=!0}),n.resultsBox.append(r)})},s=async()=>{let e=n.placeInput.value.trim();if(!e){a(`search.enterName`);return}let r=Date.now();if(!(e===t.lastSearch.query&&r-t.lastSearch.at<300)){t.lastSearch={at:r,query:e},n.searchBtn.disabled=!0,a(`search.busy`);try{t.lastResults=await u(e,8),t.lastResults.length===0?(n.resultsBox.hidden=!0,a(`search.none`)):(a(null),o())}catch(e){console.error(e),n.resultsBox.hidden=!0,a(`search.error`)}finally{n.searchBtn.disabled=!1}}};n.searchBtn.addEventListener(`click`,s),n.placeInput.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),s())}),n.placeInput.addEventListener(`input`,()=>{t.selectedPlace&&(t.selectedPlace=null,t.renderConfirm())})}function K(e){document.getElementById(`step-b`).hidden=e!==`b`,document.getElementById(`step-g`).hidden=e!==`g`,w.hidden=!0;let t=document.getElementById(`match-form`);typeof t.scrollIntoView==`function`&&t.scrollIntoView({behavior:`smooth`,block:`start`})}function q(){let e=V(B(`b`));if(O.b=e,H(`b`,e),Object.keys(e).length>0){e.manual&&(document.getElementById(`b-manual-box`).open=!0),U(`b`);return}K(`g`)}function te(){K(`b`)}function J(e){w.hidden=!1,w.replaceChildren();let t=document.createElement(`div`);t.className=`card summary match-summary`;let n=document.createElement(`p`);n.className=`note`,n.textContent=e,t.append(n),w.append(t),typeof w.scrollIntoView==`function`&&w.scrollIntoView({behavior:`smooth`,block:`start`})}function Y(e,t,i){let o=document.createElement(`div`);o.className=`match-person`;let s=document.createElement(`h3`);s.textContent=t.name?`${r(`match.`+e)} — ${t.name}`:r(`match.`+e),o.append(s);let c=document.createElement(`dl`),l=(e,t)=>{let n=document.createElement(`dt`);n.textContent=e;let r=document.createElement(`dd`);r.textContent=t,c.append(n,r)};l(r(`summary.date`),j(t)),l(r(`summary.time`),A(t));let u=t.selectedPlace;l(r(`summary.place`),u?W(u):t.place||`—`);let d=i.planets.find(e=>e.key===`moon`);return l(r(`match.moonRashi`),n(d.rashi)),l(r(`match.moonNak`),`${a(d.nakshatra)} · ${r(`table.pada`)} ${d.pada}`),l(r(`summary.lagna`),n(i.ascendant.rashi)),o.append(c),o}function X(e){if(!e||!e.present)return r(`match.mangal.none`);let t=[];e.fromLagna&&t.push(`${r(`match.mangal.fromLagna`)} ${e.lagnaHouse}`),e.fromMoon&&t.push(`${r(`match.mangal.fromMoon`)} ${e.moonHouse}`);let n=r(e.severity===`high`?`match.mangal.high`:`match.mangal.low`);return`${r(`match.mangal.present`)} — ${t.join(` · `)} (${n})`}function Z(e){let{vb:t,vg:n,kB:i,kG:a,ashtakoot:s,mangalBoy:c,mangalGirl:l,mangalNotes:u}=k;w.hidden=!1,w.replaceChildren();let d=document.createElement(`div`);d.className=`card summary match-summary`;let f=document.createElement(`div`);f.className=`print-only print-head`;let p=document.createElement(`p`);p.className=`print-title`,p.textContent=`कुंडली मिलान / Kundli Matching`;let h=document.createElement(`p`);h.className=`print-links`;let g=document.createElement(`a`);g.href=`https://www.mybapuji.com`,g.target=`_blank`,g.rel=`noopener`,g.textContent=`mybapuji.com`;let _=document.createElement(`span`);_.className=`print-links-sep`,_.textContent=`·`;let v=document.createElement(`a`);v.href=ee(m.kundli),v.target=`_blank`,v.rel=`noopener`,v.textContent=`mybapuji.com/kundli/`,h.append(g,_,v),f.append(p,h),d.append(f);let y=document.createElement(`h2`);y.className=`summary-title`,y.textContent=r(`match.report.title`),d.append(y);let b=document.createElement(`div`);b.className=`match-pair`,b.append(Y(`boy`,t,i),Y(`girl`,n,a)),d.append(b);let x=document.createElement(`div`);x.className=`table-wrap`;let S=document.createElement(`table`);S.className=`kundli-table match-table`;let C=document.createElement(`thead`),T=document.createElement(`tr`);for(let e of[`match.table.koota`,`match.table.points`,`match.table.reason`]){let t=document.createElement(`th`);t.textContent=r(e),T.append(t)}C.append(T),S.append(C);let E=document.createElement(`tbody`);for(let e of s.kootas){let t=document.createElement(`tr`),n=[`${e.hi} / ${e.en}`,`${e.points} / ${e.max}`,o()===`hi`?e.reason.hi:e.reason.en];for(let e of n){let n=document.createElement(`td`);n.textContent=e,t.append(n)}E.append(t)}let D=document.createElement(`tr`);D.className=`total-row`;for(let e of[r(`match.totalRow`),`${s.total} / ${s.max}`,``]){let t=document.createElement(`td`);t.textContent=e,D.append(t)}E.append(D),S.append(E),x.append(S),d.append(x);let O=document.createElement(`div`);O.className=`verdict-band ${s.verdict.key}`,O.textContent=o()===`hi`?s.verdict.hi:s.verdict.en,d.append(O);let A=document.createElement(`p`);A.className=`kundli-table-title`,A.textContent=r(`match.mangal.title`);let j=document.createElement(`ul`);j.className=`match-mangal`;for(let[e,t]of[[`boy`,c],[`girl`,l]]){let n=document.createElement(`li`);n.textContent=`${r(`match.`+e)}: ${X(t)}`,j.append(n)}for(let e of u){let t=document.createElement(`li`);t.textContent=o()===`hi`?e.hi:e.en,j.append(t)}d.append(A,j);let M=document.createElement(`p`);M.className=`note match-disclaimer`,M.textContent=r(`match.disclaimer`),d.append(M);let N=document.createElement(`div`);N.className=`actions`;let P=document.createElement(`p`);P.className=`note`,P.setAttribute(`aria-live`,`polite`),P.hidden=!0;let F=document.createElement(`button`);F.type=`button`,F.className=`secondary`,F.dataset.action=`png`,F.textContent=r(`btn.downloadPng`),F.addEventListener(`click`,()=>ne(()=>{P.textContent=r(`msg.pngFailed`),P.hidden=!1}));let I=document.createElement(`button`);I.type=`button`,I.className=`secondary`,I.dataset.action=`print`,I.textContent=r(`btn.print`),I.addEventListener(`click`,()=>window.print());let L=document.createElement(`button`);L.type=`button`,L.className=`secondary`,L.dataset.action=`copy`,L.textContent=r(`btn.copy`),L.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(re()),P.textContent=r(`msg.copied`)}catch(e){console.error(`Copy failed:`,e),P.textContent=r(`msg.copyFailed`)}P.hidden=!1});let R=document.createElement(`p`);R.className=`note pdf-hint`,R.textContent=r(`actions.pdfHint`),N.append(F,I,L,P,R),d.append(N),w.append(d),e&&typeof w.scrollIntoView==`function`&&w.scrollIntoView({behavior:`smooth`,block:`start`})}function ne(e){let{vb:t,vg:n,ashtakoot:r}=k,i=e=>e.selectedPlace?e.selectedPlace.name:e.place||`—`,a=y({names:{boy:t.name||`—`,girl:n.name||`—`},lines:{boy:`${j(t)} · ${A(t)} · ${i(t)}`,girl:`${j(n)} · ${A(n)} · ${i(n)}`},rows:r.kootas.map(e=>({hi:e.hi,en:e.en,points:e.points,max:e.max})),total:r.total,maxTotal:r.max,verdict:{hi:r.verdict.hi,en:r.verdict.en},footer:`mybapuji.com/kundli-milan/ · mybapuji.com`}),o=URL.createObjectURL(new Blob([a],{type:`image/svg+xml;charset=utf-8`})),s=new Image;s.onload=()=>{try{let t=document.createElement(`canvas`);t.width=1200,t.height=1010;let n=t.getContext(`2d`);n.fillStyle=`#ffffff`,n.fillRect(0,0,1200,1010),n.drawImage(s,0,0,1200,1010),t.toBlob(t=>{if(!t){e&&e();return}let n=document.createElement(`a`);n.href=URL.createObjectURL(t),n.download=`kundli-match.png`,n.click(),setTimeout(()=>URL.revokeObjectURL(n.href),5e3)},`image/png`)}finally{URL.revokeObjectURL(o)}},s.onerror=()=>{console.error(`Scorecard PNG export failed`),URL.revokeObjectURL(o),e&&e()},s.src=o}function re(){let{vb:e,vg:t,ashtakoot:n,mangalBoy:i,mangalGirl:a,mangalNotes:s}=k,c=o(),l=[`कुंडली मिलान / Kundli Matching`,``],u=(e,t)=>{let n=t.selectedPlace?W(t.selectedPlace):t.place||`—`;return`${r(e)}: ${[t.name,j(t),A(t),n].filter(Boolean).join(` · `)}`};l.push(u(`match.boy`,e),u(`match.girl`,t),``);for(let e of n.kootas)l.push(`${e.hi} / ${e.en} — ${e.points}/${e.max} — ${c===`hi`?e.reason.hi:e.reason.en}`);l.push(`${r(`match.totalRow`)}: ${n.total} / ${n.max}`),l.push(c===`hi`?n.verdict.hi:n.verdict.en),l.push(``),l.push(r(`match.mangal.title`)),l.push(`${r(`match.boy`)}: ${X(i)}`),l.push(`${r(`match.girl`)}: ${X(a)}`);for(let e of s)l.push(c===`hi`?e.hi:e.en);return l.push(``),l.push(r(`match.disclaimer`)),l.join(`
`)}async function Q(){let t=B(`b`),n=V(t);if(O.b=n,H(`b`,n),Object.keys(n).length>0){n.manual&&(document.getElementById(`b-manual-box`).open=!0),K(`b`),U(`b`);return}let i=B(`g`),a=V(i);if(O.g=a,H(`g`,a),Object.keys(a).length>0){a.manual&&(document.getElementById(`g-manual-box`).open=!0),w.hidden=!0,U(`g`);return}if(t.converted=N(t),i.converted=N(i),!t.converted||!i.converted){J(r(`match.errConv`));return}E.disabled=!0,J(r(`match.calculating`));try{let n=await F(),a=I(t),o=I(i),s=e(n,{utc:t.converted.utc,...a,nodeType:`mean`}),c=e(n,{utc:i.converted.utc,...o,nodeType:`mean`});if(s&&s.error||c&&c.error){J(r(`err.polar`));return}let l=e=>e.planets.find(e=>e.key===`moon`),u=h(l(s),l(c)),d=g(s),f=g(c);k={vb:t,vg:i,kB:s,kG:c,ashtakoot:u,mangalBoy:d,mangalGirl:f,mangalNotes:_(d,f)},Z(!0)}catch(e){console.error(`Match calculation failed:`,e),P=null,J(r(`match.engineError`))}finally{E.disabled=!1}}document.querySelector(`#continue-btn`).addEventListener(`click`,q),document.querySelector(`#back-btn`).addEventListener(`click`,te),E.addEventListener(`click`,Q),document.querySelector(`#match-form`).addEventListener(`submit`,e=>{e.preventDefault(),document.getElementById(`step-g`).hidden?q():Q()});function ie(e,t){let n=(e,t)=>{t!==``&&(document.getElementById(e).value=t)};if(n(`${e}-name`,t.name),t.month){let n=document.querySelector(`input[name="${e}-month"][value="${t.month}"]`);n&&(n.checked=!0)}n(`${e}-day`,t.day),n(`${e}-year`,t.year),n(`${e}-hour`,t.hour),n(`${e}-minute`,t.minute),n(`${e}-second`,t.second);let r=Number(t.lat),i=Number(t.lng);t.place&&t.lat!==``&&t.lng!==``&&t.tz&&Number.isFinite(r)&&Number.isFinite(i)?(n(`${e}-place`,t.place),D[e].selectedPlace={name:t.place,latitude:r,longitude:i,timezone:t.tz},D[e].renderConfirm()):t.place&&n(`${e}-place`,t.place)}var $=d(window.location.search);if($.lang&&s($.lang),L(`b`),L(`g`),G(`b`),G(`g`),z(),$.any){ie(`b`,$.b),ie(`g`,$.g);let e=Object.keys(V(B(`b`))).length===0,t=Object.keys(V(B(`g`))).length===0;e&&t&&Q()}