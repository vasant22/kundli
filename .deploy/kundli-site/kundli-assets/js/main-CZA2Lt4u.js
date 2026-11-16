const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["js/online-Bw3Anb_2.js","js/astro-Bb-V9OEA.js","js/timeutil-D7IgO8sO.js","js/prefill-DEE8HIZn.js","js/report-B5jo5Joy.js","js/mangaldosha-Kw5EmkbK.js","js/panchang-DObdutV9.js","js/report-BBT0iLCt.css"])))=>i.map(i=>d[i]);
import{a as e,c as t,l as n,o as r,p as i}from"./astro-Bb-V9OEA.js";import{D as a,E as o,S as s,_ as c,a as l,b as u,g as d,r as f,w as p,x as m}from"./timeutil-D7IgO8sO.js";import{t as h}from"./mybapuji-strip-CKYeMZbr.js";import{t as g}from"./geocode-DLqB8puT.js";import{t as _}from"./prefill-DEE8HIZn.js";import{t as v}from"./birthvalidate-BwJ7KVy-.js";import{n as y,r as ee}from"./charts-Da00_eEH.js";import{t as b}from"./tzauto-DrPmeVvO.js";import{n as x,t as S}from"./pages-Cw1CFDfv.js";var C=`https://github.com/vasant22/kundli`,w=document.querySelector(`#app`);w.innerHTML=h()+`
  <div class="wrap">
    <header class="site-header">
      <div>
        <h1 data-i18n="app.title"></h1>
        <p class="sub" data-i18n="app.subtitle"></p>
        <p class="free-badge" data-i18n="app.badge"></p>
        <nav class="site-nav">
          <a href="${S.kundli}" class="active" data-i18n="nav.home"></a>
          <a href="${S.match}" data-i18n="nav.match"></a>
          <a href="${S.panchang}" data-i18n="nav.panchang"></a>
          <a href="${S.bnn}" data-i18n="nav.bnn"></a>
        </nav>
      </div>
      <button id="lang-toggle" class="lang-toggle" type="button"></button>
    </header>

    <main>
      <form id="kundli-form" class="card" novalidate>
        <h2 class="form-heading" data-i18n="form.heading"></h2>

        <div class="field">
          <label for="f-name" data-i18n="form.name"></label>
          <input id="f-name" type="text" autocomplete="name" data-i18n-placeholder="form.namePh" />
        </div>

        <fieldset class="field">
          <legend data-i18n="form.gender"></legend>
          <div class="radio-row">
            <label><input type="radio" name="gender" value="male" /> <span data-i18n="gender.male"></span></label>
            <label><input type="radio" name="gender" value="female" /> <span data-i18n="gender.female"></span></label>
            <label><input type="radio" name="gender" value="other" /> <span data-i18n="gender.other"></span></label>
          </div>
          <p class="err" id="err-gender" aria-live="polite"></p>
        </fieldset>

        <div class="field">
          <span class="group-label" data-i18n="form.dob"></span>
          <div class="mini">
            <span class="mini-label" data-i18n="date.month"></span>
            <div id="f-month" class="chips"></div>
          </div>
          <div class="row-2">
            <div class="mini">
              <label for="f-day" data-i18n="date.day"></label>
              <input id="f-day" type="number" inputmode="numeric" min="1" max="31" placeholder="1–31" />
            </div>
            <div class="mini">
              <label for="f-year" data-i18n="date.year"></label>
              <input id="f-year" type="number" inputmode="numeric" min="1800" max="2400" placeholder="1990" />
            </div>
          </div>
          <p class="err" id="err-date" aria-live="polite"></p>
        </div>

        <div class="field">
          <span class="group-label"><span data-i18n="form.tob"></span> <span class="muted" data-i18n="form.tobNote"></span></span>
          <div class="row-3">
            <div class="mini">
              <label for="f-hour" data-i18n="time.hour"></label>
              <input id="f-hour" type="number" inputmode="numeric" min="0" max="23" placeholder="0–23" />
            </div>
            <div class="mini">
              <label for="f-minute" data-i18n="time.minute"></label>
              <input id="f-minute" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" />
            </div>
            <div class="mini">
              <label for="f-second" data-i18n="time.second"></label>
              <input id="f-second" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" value="0" />
            </div>
          </div>
          <p class="err" id="err-time" aria-live="polite"></p>
          <div class="mini offset-mini">
            <label for="f-offset" data-i18n="time.offset"></label>
            <input id="f-offset" type="text" placeholder="+05:30" />
            <p class="note" data-i18n="time.offsetHint"></p>
          </div>
          <p class="err" id="err-offset" aria-live="polite"></p>
        </div>

        <div class="field">
          <label for="f-place" data-i18n="form.place"></label>
          <div class="search-row">
            <input id="f-place" type="text" data-i18n-placeholder="form.placePh" />
            <button id="search-btn" class="secondary" type="button" data-i18n="form.search"></button>
          </div>
          <p class="note" id="search-note" hidden></p>
          <div id="results" class="results" hidden></div>
          <p class="note ok" id="place-confirm" hidden></p>
          <p class="err" id="err-place" aria-live="polite"></p>
          <details id="manual-box" class="manual">
            <summary class="manual-summary" data-i18n="manual.summary"></summary>
            <div class="row-3 manual-row">
              <div class="mini">
                <label for="f-lat" data-i18n="manual.lat"></label>
                <input id="f-lat" type="number" step="0.0001" inputmode="decimal" placeholder="25.3176" />
              </div>
              <div class="mini">
                <label for="f-lon" data-i18n="manual.lon"></label>
                <input id="f-lon" type="number" step="0.0001" inputmode="decimal" placeholder="82.9739" />
              </div>
              <div class="mini">
                <label for="f-tz" data-i18n="manual.tz"></label>
                <input id="f-tz" type="text" placeholder="Asia/Kolkata" />
              </div>
            </div>
            <p class="note" data-i18n="manual.hint"></p>
            <p class="note" id="tz-auto-note" aria-live="polite" hidden></p>
            <p class="err" id="err-manual" aria-live="polite"></p>
          </details>
          <p class="note credit">Geocoding by <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo.com</a></p>
        </div>

        <button class="primary" type="submit" id="get-btn" data-i18n="btn.get"></button>
      </form>

      <section id="output" aria-live="polite" hidden></section>
    </main>

    <footer class="site-footer">
      <p class="note" data-i18n="footer.privacy"></p>
      <p class="note footer-credit-line">
        <span data-i18n="footer.poweredBy"></span><a href="https://www.astro.com/swisseph/" target="_blank" rel="noopener">Swiss Ephemeris</a> (Astrodienst AG) ·
        <a class="footer-source" href="${C}" target="_blank" rel="noopener" data-i18n="footer.source"></a>
      </p>
    </footer>
  </div>
`;var T=document.querySelector(`#kundli-form`),E=document.querySelector(`#output`),D=document.querySelector(`#lang-toggle`),O=document.querySelector(`#search-btn`),k=document.querySelector(`#search-note`),A=document.querySelector(`#f-place`),j=document.querySelector(`#results`),M=document.querySelector(`#place-confirm`),N=document.querySelector(`#manual-box`),P=null,F={},I=null,L=[],R=null,z={at:0,query:``},B=document.querySelector(`#tz-auto-note`);b({latEl:document.querySelector(`#f-lat`),lonEl:document.querySelector(`#f-lon`),tzEl:document.querySelector(`#f-tz`),onState(e){B.hidden=!e,B.classList.toggle(`ok`,e===`filled`),e?(B.dataset.i18n=`tz.auto.${e}`,B.textContent=a(`tz.auto.${e}`)):(B.removeAttribute(`data-i18n`),B.textContent=``)}});var V=e=>e===``?NaN:Number(e);function H(e){let t=Math.floor(e),n=Math.floor((e-t)*60+.5);return n===60&&(t+=1,n=0),`${t}°${String(n).padStart(2,`0`)}'`}function U(e){let t=Math.floor(e),n=Math.floor((e-t)*60),r=Math.round(((e-t)*60-n)*60);return r===60&&(r=0,n+=1),n===60&&(n=0,t+=1),`${t}°${String(n).padStart(2,`0`)}'${String(r).padStart(2,`0`)}"`}function te(e){return e.offset===``?e.selectedPlace&&e.selectedPlace.timezone?e.selectedPlace.timezone:e.manual.tz===``?null:e.manual.tz:e.offset}function W(e){let t=te(e);if(!t)return null;try{let n={year:Number(e.year),month:Number(e.month),day:Number(e.day),hour:Number(e.hour),minute:Number(e.minute),second:e.second===``?0:Number(e.second)};return{zone:t,...l(n,t)}}catch(e){return console.error(`Time conversion failed:`,e),null}}var G=null;function ne(){return G||=t(),G}function K(e){return e.manual.lat!==``&&e.manual.lon!==``&&e.manual.tz!==``?{latitude:Number(e.manual.lat),longitude:Number(e.manual.lon)}:e.selectedPlace?{latitude:e.selectedPlace.latitude,longitude:e.selectedPlace.longitude}:null}function q(e){let t=e=>String(e).padStart(2,`0`);return{name:e.name,dateText:`${Number(e.day)} ${u(Number(e.month))} ${Number(e.year)}`,timeText:`${t(Number(e.hour))}:${t(Number(e.minute))}:${t(e.second===``?0:Number(e.second))}`,placeText:e.selectedPlace?e.selectedPlace.name:e.place}}function re(e){return e.chalit?{ascendant:e.ascendant,planets:e.planets.map(t=>({...t,house:e.chalit.houses[t.key]||t.house}))}:null}function J(e){let t=new Date(e);return`${t.getUTCDate()} ${a(`month.`+(t.getUTCMonth()+1))} ${t.getUTCFullYear()}`}function Y(e,t,n){let r=document.createElement(`table`);r.className=`kundli-table dasha-table`;let i=document.createElement(`thead`),o=document.createElement(`tr`);for(let e of[n,a(`dasha.from`),a(`dasha.to`),``]){let t=document.createElement(`th`);t.textContent=e,o.append(t)}i.append(o),r.append(i);let s=document.createElement(`tbody`);return e.forEach((e,n)=>{let r=document.createElement(`tr`);n===t&&(r.className=`current`);let i=[c(e.key),J(e.fromMs),J(e.toMs),n===t?a(`dasha.now`):``];for(let e of i){let t=document.createElement(`td`);t.textContent=e,r.append(t)}s.append(r)}),r.append(s),r}function ie(e,t){let n=document.querySelector(`.chart-box svg`);if(!n){t&&t();return}let r=n.cloneNode(!0);r.setAttribute(`font-family`,`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`);let i=new XMLSerializer().serializeToString(r),a=URL.createObjectURL(new Blob([i],{type:`image/svg+xml;charset=utf-8`})),o=new Image;o.onload=()=>{try{let n=1080,r=document.createElement(`canvas`);r.width=n,r.height=n;let i=r.getContext(`2d`);i.fillStyle=`#ffffff`,i.fillRect(0,0,n,n),i.drawImage(o,0,0,n,n),r.toBlob(n=>{if(!n){t&&t();return}let r=document.createElement(`a`);r.href=URL.createObjectURL(n),r.download=e.chartStyle===`south`?`kundli-south.png`:`kundli-north.png`,r.click(),setTimeout(()=>URL.revokeObjectURL(r.href),5e3)},`image/png`)}finally{URL.revokeObjectURL(a)}},o.onerror=()=>{console.error(`Chart PNG export failed`),URL.revokeObjectURL(a),t&&t()},o.src=a}function ae(e,t,n){let r=new URLSearchParams;return e.name&&r.set(`name`,e.name),e.gender&&r.set(`gender`,e.gender),r.set(`day`,e.day),r.set(`month`,e.month),r.set(`year`,e.year),r.set(`hour`,e.hour),r.set(`min`,e.minute),r.set(`sec`,e.second===``?`0`:e.second),e.place&&r.set(`place`,e.place),n&&(r.set(`lat`,String(n.latitude)),r.set(`lng`,String(n.longitude))),t?.zone&&r.set(`tz`,t.zone),r}function oe(e,t,n){return`../kundli-phal/?${ae(e,t,n).toString()}`}function se(e,t,n,r){let o=async()=>{if(!e.dataset.phalMounted){e.dataset.phalMounted=`1`;try{let{mountPhalOnline:o}=await i(async()=>{let{mountPhalOnline:e}=await import(`./online-Bw3Anb_2.js`);return{mountPhalOnline:e}},__vite__mapDeps([0,1,2,3,4,5,6,7]));await o(e,{search:`?${ae(t,n,r).toString()}`,pdfHref:`${oe(t,n,r)}&print=1`,name:t.name,hint:a(`phal.onlineHint`),hindiOnlyNote:d()===`en`?a(`phal.englishNote`):``})}catch(t){console.error(`phal online failed`,t),e.innerHTML=`<p class="po-note">विस्तृत फलादेश यहाँ नहीं खुल सका — ऊपर दिए बटन से PDF खोलें।</p>`}}};if(globalThis.__phalOnlineReady){o();return}let s=()=>{let t=e.getBoundingClientRect();return t.top<window.innerHeight+600&&t.bottom>-600};if(typeof IntersectionObserver>`u`){o();return}let c=new IntersectionObserver(e=>{e.some(e=>e.isIntersecting)&&(c.disconnect(),window.removeEventListener(`scroll`,l),o())},{rootMargin:`600px`}),l=()=>{s()&&(window.removeEventListener(`scroll`,l),c.disconnect(),o())};c.observe(e),s()?(c.disconnect(),o()):window.addEventListener(`scroll`,l,{passive:!0})}function ce(e){let t=e.kundli,n=q(e),r=[`कुंडली / Kundli`,``];return e.name&&r.push(`${a(`summary.name`)}: ${e.name}`),r.push(`${a(`summary.date`)}: ${n.dateText}`),r.push(`${a(`summary.time`)}: ${n.timeText}`),r.push(`${a(`summary.place`)}: ${n.placeText}`),r.push(`${a(`summary.lagna`)}: ${p(t.ascendant.rashi)}`),r.push(`${a(`summary.ayanamsa`)}: ${H(t.ayanamsa)}`),r.push(``),t.planets.forEach(e=>{r.push(`${c(e.key)} — ${p(e.rashi)} — ${U(e.degInSign)} — ${s(e.nakshatra)} ${a(`table.pada`)} ${e.pada} — ${a(`table.house`)} ${e.house}`+(e.retro?` — ${a(`k.retro`)}`:``))}),r.join(`
`)}function le(){let e=document.querySelector(`#f-month`);e.replaceChildren(),m().forEach((t,n)=>{let r=document.createElement(`label`),i=document.createElement(`input`);i.type=`radio`,i.name=`month`,i.value=String(n+1);let a=document.createElement(`span`);a.textContent=t,r.append(i,a),e.append(r)})}function ue(){let e=m();document.querySelectorAll(`#f-month label span`).forEach((t,n)=>{t.textContent=e[n]})}function de(){document.documentElement.lang=d(),document.title=a(`app.docTitle`),document.querySelectorAll(`[data-i18n]`).forEach(e=>{e.textContent=a(e.dataset.i18n)}),document.querySelectorAll(`[data-i18n-placeholder]`).forEach(e=>{e.placeholder=a(e.dataset.i18nPlaceholder)}),ue(),D.textContent=a(`lang.switchTo`),!k.hidden&&R&&(k.textContent=a(R)),Q(),Object.keys(F).length>0&&pe(F),P&&X(P,!1)}function fe(){let e=e=>document.getElementById(e).value.trim(),t=document.querySelector(`input[name="gender"]:checked`);return{name:e(`f-name`),gender:t?t.value:``,day:e(`f-day`),month:document.querySelector(`input[name="month"]:checked`)?.value??``,year:e(`f-year`),hour:e(`f-hour`),minute:e(`f-minute`),second:e(`f-second`),offset:e(`f-offset`),place:e(`f-place`),selectedPlace:I,manual:{lat:e(`f-lat`),lon:e(`f-lon`),tz:e(`f-tz`)}}}function pe(e){document.querySelectorAll(`.err`).forEach(e=>{e.textContent=``}),document.querySelectorAll(`.has-error`).forEach(e=>e.classList.remove(`has-error`)),Object.entries(e).forEach(([e,t])=>{let n=document.getElementById(`err-${e}`);if(!n)return;n.textContent=t;let r=n.closest(`.field`);r&&r.classList.add(`has-error`)})}function X(e,t){let i=e=>String(e).padStart(2,`0`),o=`${V(e.day)} ${a(`month.`+V(e.month))} ${V(e.year)}`,l=`${i(V(e.hour))}:${i(V(e.minute))}:${i(e.second===``?0:V(e.second))}`;E.hidden=!1,E.replaceChildren();let u=document.createElement(`div`);if(u.className=`card summary`,e.kundli&&!e.kundli.error){let e=document.createElement(`div`);e.className=`print-only print-head`;let t=document.createElement(`p`);t.className=`print-title`,t.textContent=`कुंडली / Kundli`;let n=document.createElement(`p`);n.className=`print-links`;let r=document.createElement(`a`);r.href=`https://www.mybapuji.com`,r.target=`_blank`,r.rel=`noopener`,r.textContent=`mybapuji.com`;let i=document.createElement(`span`);i.className=`print-links-sep`,i.textContent=`·`;let a=document.createElement(`a`);a.href=x(S.kundli),a.target=`_blank`,a.rel=`noopener`,a.textContent=`mybapuji.com/kundli/`,n.append(r,i,a),e.append(t,n),u.append(e)}let d=document.createElement(`h2`);d.className=`summary-title`,d.textContent=a(`summary.title`),u.append(d);let m=document.createElement(`dl`),h=(e,t)=>{let n=document.createElement(`dt`);n.textContent=e;let r=document.createElement(`dd`);r.textContent=t,m.append(n,r)};h(a(`summary.name`),e.name||`—`),h(a(`summary.gender`),a(`gender.${e.gender}`)),h(a(`summary.date`),o),h(a(`summary.time`),l);let g=e.converted;if(g){let t;t=e.offset===``?f(g.zone)===null?`${g.zone} (UTC${g.offsetText})`:`UTC${g.offsetText}`:`${g.offsetText} (${a(`summary.manualOffset`)})`,h(a(`summary.tz`),t);let n=g.utc;h(a(`summary.utc`),`${n.day} ${a(`month.`+n.month)} ${n.year}, ${i(n.hour)}:${i(n.minute)}:${i(n.second)} UTC`)}let _=e.selectedPlace,v=_?[_.name,_.admin1,_.country].filter(Boolean).join(`, `):e.place;h(a(`summary.place`),v||`—`),e.manual&&e.manual.lat!==``&&e.manual.lon!==``&&e.manual.tz!==``?h(a(`summary.coords`),`${e.manual.lat}, ${e.manual.lon} · ${e.manual.tz}`):_&&h(a(`summary.coords`),`${_.latitude}, ${_.longitude} · ${_.timezone}`),u.append(m);let b=e.kundli;if(b&&!b.error){let t=b.ascendant;h(a(`summary.lagna`),`${p(t.rashi)} · ${H(t.degInSign)}`),h(a(`summary.ayanamsa`),H(b.ayanamsa));let i=document.createElement(`div`);i.className=`chart-wrap`;let o=document.createElement(`div`);o.className=`chart-toggle`;let l=document.createElement(`button`);l.type=`button`,l.dataset.style=`north`,l.textContent=a(`chart.north`);let d=document.createElement(`button`);d.type=`button`,d.dataset.style=`south`,d.textContent=a(`chart.south`);let f=document.createElement(`div`);f.className=`chart-grid`;let m=n(b),g=re(b),_=(e,t)=>{let n=document.createElement(`div`);n.className=`chart-cell`;let r=document.createElement(`p`);r.className=`chart-caption`,r.textContent=a(e);let i=document.createElement(`div`);return i.className=`chart-box`,i.append(t()),n.append(r,i),n},v=()=>{let t=e.chartStyle===`south`;f.replaceChildren(),f.append(_(`chart.d1`,()=>t?ee(b,q(e),{varga:`D1`}):y(b,{varga:`D1`})),_(`chart.d9`,()=>t?ee(m,q(e),{varga:`D9`}):y(m,{varga:`D9`}))),g&&f.append(_(`chart.chalit`,()=>y(g,{houseRashis:b.chalit.houseSigns,ascMarker:!1,varga:`CHALIT`}))),l.classList.toggle(`active`,!t),d.classList.toggle(`active`,t),l.setAttribute(`aria-pressed`,String(!t)),d.setAttribute(`aria-pressed`,String(t))};l.addEventListener(`click`,()=>{e.chartStyle=`north`,v()}),d.addEventListener(`click`,()=>{e.chartStyle=`south`,v()}),o.append(l,d),i.append(o,f),u.append(i),v();let x=document.createElement(`p`);x.className=`kundli-table-title`,x.textContent=a(`summary.planets`);let S=document.createElement(`div`);S.className=`table-wrap`;let C=document.createElement(`table`);C.className=`kundli-table planet-table`;let w=document.createElement(`thead`),T=document.createElement(`tr`);for(let e of[`table.planet`,`table.rashi`,`table.degree`,`table.nakshatra`,`table.house`,`table.retro`]){let t=document.createElement(`th`);t.textContent=a(e),T.append(t)}w.append(T),C.append(w);let E=document.createElement(`tbody`),D=(e,t)=>{let n=document.createElement(`tr`),r=[e,p(t.rashi),U(t.degInSign),`${s(t.nakshatra)} · ${a(`table.pada`)} ${t.pada}`,String(t.house),t.retro?a(`k.retro`):`—`];for(let e of r){let t=document.createElement(`td`);t.textContent=e,n.append(t)}return n};E.append(D(a(`table.asc`),b.ascendant)),b.planets.forEach(e=>E.append(D(c(e.key),e))),C.append(E),S.append(C),u.append(x,S);let O=b.planets.find(e=>e.key===`moon`);if(O&&e.converted){let t=e.converted.utc,n=Date.UTC(t.year,t.month-1,t.day,t.hour,t.minute,t.second),i=r(O.longitude,n),o=document.createElement(`p`);o.className=`kundli-table-title`,o.textContent=a(`summary.dasha`);let s=document.createElement(`div`);s.className=`table-wrap`,s.append(Y(i.mahadashas,i.currentIdx,a(`dasha.md`)));let l=i.mahadashas[i.currentIdx],d=i.antardashas[i.currentAdIdx],f=document.createElement(`p`);f.className=`note dasha-now`,f.textContent=`${a(`dasha.nowLine`)}${c(l.key)} ${a(`dasha.md`)} / ${c(d.key)} ${a(`dasha.ad`)} (${J(d.toMs)} ${a(`dasha.till`)})`;let p=document.createElement(`p`);p.className=`kundli-table-title`,p.textContent=`${a(`dasha.ad`)} — ${c(l.key)} ${a(`dasha.md`)}`;let m=document.createElement(`div`);m.className=`table-wrap`,m.append(Y(i.antardashas,i.currentAdIdx,a(`dasha.ad`)));let h=document.createElement(`p`);h.className=`note`,h.textContent=a(`dasha.basis`),u.append(o,s,f,p,m,h)}let k=document.createElement(`div`);k.className=`actions`;let A=document.createElement(`p`);A.className=`note`,A.setAttribute(`aria-live`,`polite`),A.hidden=!0;let j=document.createElement(`button`);j.type=`button`,j.className=`secondary`,j.dataset.action=`png`,j.textContent=a(`btn.downloadPng`),j.addEventListener(`click`,()=>ie(e,()=>{A.textContent=a(`msg.pngFailed`),A.hidden=!1}));let M=document.createElement(`button`);M.type=`button`,M.className=`secondary`,M.dataset.action=`print`,M.textContent=a(`btn.print`),M.addEventListener(`click`,()=>window.print());let N=document.createElement(`button`);N.type=`button`,N.className=`secondary`,N.dataset.action=`copy`,N.textContent=a(`btn.copy`),N.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(ce(e)),A.textContent=a(`msg.copied`)}catch(e){console.error(`Copy failed:`,e),A.textContent=a(`msg.copyFailed`)}A.hidden=!1});let P=document.createElement(`p`);P.className=`note pdf-hint`,P.textContent=a(`actions.pdfHint`),k.append(j,M,N,A,P),u.append(k);let F=K(e);if(F&&W(e)){let t=document.createElement(`div`);t.className=`phal-cta`;let n=document.createElement(`a`);n.className=`phal-btn`,n.dataset.action=`phal`,n.target=`_blank`,n.rel=`noopener`,n.href=oe(e,W(e),F),n.textContent=a(`btn.phal`);let r=document.createElement(`p`);r.className=`note phal-hint`,r.textContent=a(`phal.hint`),t.append(n,r),u.append(t)}}let C=document.createElement(`p`);C.className=`note summary-note`,e.kundliError?C.textContent=a(`summary.engineError`):b&&b.error===`polar`?C.textContent=a(`err.polar`):e.kundliPending?C.textContent=a(`summary.calculating`):(C.textContent=a(`summary.note`),C.classList.add(`summary-note-ok`)),u.append(C),E.append(u);let w=K(e),T=W(e);if(w&&T&&!e.kundliError){let t=document.createElement(`section`);t.id=`phal-online`,t.className=`phal-online`,t.innerHTML=`<p class="po-note">विस्तृत फलादेश यहाँ खुलेगा…</p>`,E.append(t),se(t,e,T,w)}t&&typeof E.scrollIntoView==`function`&&E.scrollIntoView({behavior:`smooth`,block:`start`})}D.addEventListener(`click`,()=>{o(d()===`hi`?`en`:`hi`),de()});function Z(e){R=e,k.hidden=!e,k.textContent=e?a(e):``}function me(e){return[e.name,e.admin1,e.country].filter(Boolean).join(`, `)}function he(){j.replaceChildren(),j.hidden=L.length===0,L.forEach(e=>{let t=document.createElement(`button`);t.type=`button`,t.className=`result-item`+(e===I?` selected`:``),t.textContent=me(e),t.addEventListener(`click`,()=>{I=e,Z(null),Q(),he(),j.hidden=!0}),j.append(t)})}function Q(){if(M.hidden=!I,I){let e=I;M.textContent=`✔ ${a(`search.selected`)}: ${me(e)} · ${e.latitude}, ${e.longitude} · ${e.timezone}`}}async function ge(){let e=A.value.trim();if(!e){Z(`search.enterName`);return}let t=Date.now();if(!(e===z.query&&t-z.at<300)){z={at:t,query:e},O.disabled=!0,Z(`search.busy`);try{L=await g(e,8),L.length===0?(j.hidden=!0,Z(`search.none`)):(Z(null),he())}catch(e){console.error(e),j.hidden=!0,Z(`search.error`)}finally{O.disabled=!1}}}O.addEventListener(`click`,ge),A.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),ge())}),A.addEventListener(`input`,()=>{I&&(I=null,Q())});async function _e(){let t=fe(),n=v(t);if(F=n,pe(n),Object.keys(n).length>0){P=null,E.hidden=!0,n.manual&&(N.open=!0);let e=T.querySelector(`.has-error input, .has-error select`);e&&e.focus();return}t.converted=W(t),t.kundli=null,t.kundliPending=!0,P=t,X(t,!0);try{let n=await ne(),r=K(t);r&&t.converted&&(t.kundli=e(n,{utc:t.converted.utc,...r,nodeType:`mean`}))}catch(e){console.error(`Chart calculation failed:`,e),G=null,t.kundliError=!0}finally{t.kundliPending=!1,P===t&&X(t,!1)}}T.addEventListener(`submit`,e=>{e.preventDefault(),_e()});function ve(e){let t=(e,t)=>{t!==``&&(document.getElementById(e).value=t)};if(t(`f-name`,e.name),e.gender){let t=document.querySelector(`input[name="gender"][value="${e.gender}"]`);t&&(t.checked=!0)}if(e.month){let t=document.querySelector(`input[name="month"][value="${e.month}"]`);t&&(t.checked=!0)}t(`f-day`,e.day),t(`f-year`,e.year),t(`f-hour`,e.hour),t(`f-minute`,e.minute),t(`f-second`,e.second);let n=Number(e.lat),r=Number(e.lng);e.place&&e.lat!==``&&e.lng!==``&&e.tz&&Number.isFinite(n)&&Number.isFinite(r)?(t(`f-place`,e.place),I={name:e.place,latitude:n,longitude:r,timezone:e.tz},Q()):e.place&&t(`f-place`,e.place)}var $=_(window.location.search);$.lang&&o($.lang),le(),de(),$.any&&(ve($),Object.keys(v(fe())).length===0&&_e());