import{a as e,c as t,l as n,o as r}from"./astro-BRoGble9.js";import{S as i,T as a,a as o,b as s,h as c,m as l,r as u,v as d,w as f,y as p}from"./timeutil-7nq4thId.js";import{t as m}from"./mybapuji-strip-CKYeMZbr.js";import{t as h}from"./geocode-DLqB8puT.js";import{t as g}from"./prefill-DEE8HIZn.js";import{t as _}from"./birthvalidate-CcbvHW0k.js";import{n as v,r as ee}from"./charts-8bLU01EO.js";import{t as y}from"./tzauto-DrPmeVvO.js";import{n as b,t as x}from"./pages-Cw1CFDfv.js";var S=`https://github.com/vasant22/kundli`,C=document.querySelector(`#app`);C.innerHTML=m()+`
  <div class="wrap">
    <header class="site-header">
      <div>
        <h1 data-i18n="app.title"></h1>
        <p class="sub" data-i18n="app.subtitle"></p>
        <p class="free-badge" data-i18n="app.badge"></p>
        <nav class="site-nav">
          <a href="${x.kundli}" class="active" data-i18n="nav.home"></a>
          <a href="${x.match}" data-i18n="nav.match"></a>
          <a href="${x.panchang}" data-i18n="nav.panchang"></a>
          <a href="${x.bnn}" data-i18n="nav.bnn"></a>
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
        <a class="footer-source" href="${S}" target="_blank" rel="noopener" data-i18n="footer.source"></a>
      </p>
    </footer>
  </div>
`;var w=document.querySelector(`#kundli-form`),T=document.querySelector(`#output`),E=document.querySelector(`#lang-toggle`),D=document.querySelector(`#search-btn`),O=document.querySelector(`#search-note`),k=document.querySelector(`#f-place`),A=document.querySelector(`#results`),j=document.querySelector(`#place-confirm`),M=document.querySelector(`#manual-box`),N=null,P={},F=null,I=[],L=null,R={at:0,query:``},z=document.querySelector(`#tz-auto-note`);y({latEl:document.querySelector(`#f-lat`),lonEl:document.querySelector(`#f-lon`),tzEl:document.querySelector(`#f-tz`),onState(e){z.hidden=!e,z.classList.toggle(`ok`,e===`filled`),e?(z.dataset.i18n=`tz.auto.${e}`,z.textContent=a(`tz.auto.${e}`)):(z.removeAttribute(`data-i18n`),z.textContent=``)}});var B=e=>e===``?NaN:Number(e);function V(e){let t=Math.floor(e),n=Math.floor((e-t)*60+.5);return n===60&&(t+=1,n=0),`${t}°${String(n).padStart(2,`0`)}'`}function H(e){let t=Math.floor(e),n=Math.floor((e-t)*60),r=Math.round(((e-t)*60-n)*60);return r===60&&(r=0,n+=1),n===60&&(n=0,t+=1),`${t}°${String(n).padStart(2,`0`)}'${String(r).padStart(2,`0`)}"`}function te(e){return e.offset===``?e.selectedPlace&&e.selectedPlace.timezone?e.selectedPlace.timezone:e.manual.tz===``?null:e.manual.tz:e.offset}function U(e){let t=te(e);if(!t)return null;try{let n={year:Number(e.year),month:Number(e.month),day:Number(e.day),hour:Number(e.hour),minute:Number(e.minute),second:e.second===``?0:Number(e.second)};return{zone:t,...o(n,t)}}catch(e){return console.error(`Time conversion failed:`,e),null}}var W=null;function ne(){return W||=t(),W}function G(e){return e.manual.lat!==``&&e.manual.lon!==``&&e.manual.tz!==``?{latitude:Number(e.manual.lat),longitude:Number(e.manual.lon)}:e.selectedPlace?{latitude:e.selectedPlace.latitude,longitude:e.selectedPlace.longitude}:null}function K(e){let t=e=>String(e).padStart(2,`0`);return{name:e.name,dateText:`${Number(e.day)} ${d(Number(e.month))} ${Number(e.year)}`,timeText:`${t(Number(e.hour))}:${t(Number(e.minute))}:${t(e.second===``?0:Number(e.second))}`,placeText:e.selectedPlace?e.selectedPlace.name:e.place}}function re(e){return e.chalit?{ascendant:e.ascendant,planets:e.planets.map(t=>({...t,house:e.chalit.houses[t.key]||t.house}))}:null}function q(e){let t=new Date(e);return`${t.getUTCDate()} ${a(`month.`+(t.getUTCMonth()+1))} ${t.getUTCFullYear()}`}function J(e,t,n){let r=document.createElement(`table`);r.className=`kundli-table dasha-table`;let i=document.createElement(`thead`),o=document.createElement(`tr`);for(let e of[n,a(`dasha.from`),a(`dasha.to`),``]){let t=document.createElement(`th`);t.textContent=e,o.append(t)}i.append(o),r.append(i);let s=document.createElement(`tbody`);return e.forEach((e,n)=>{let r=document.createElement(`tr`);n===t&&(r.className=`current`);let i=[c(e.key),q(e.fromMs),q(e.toMs),n===t?a(`dasha.now`):``];for(let e of i){let t=document.createElement(`td`);t.textContent=e,r.append(t)}s.append(r)}),r.append(s),r}function ie(e,t){let n=document.querySelector(`.chart-box svg`);if(!n){t&&t();return}let r=n.cloneNode(!0);r.setAttribute(`font-family`,`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`);let i=new XMLSerializer().serializeToString(r),a=URL.createObjectURL(new Blob([i],{type:`image/svg+xml;charset=utf-8`})),o=new Image;o.onload=()=>{try{let n=1080,r=document.createElement(`canvas`);r.width=n,r.height=n;let i=r.getContext(`2d`);i.fillStyle=`#ffffff`,i.fillRect(0,0,n,n),i.drawImage(o,0,0,n,n),r.toBlob(n=>{if(!n){t&&t();return}let r=document.createElement(`a`);r.href=URL.createObjectURL(n),r.download=e.chartStyle===`south`?`kundli-south.png`:`kundli-north.png`,r.click(),setTimeout(()=>URL.revokeObjectURL(r.href),5e3)},`image/png`)}finally{URL.revokeObjectURL(a)}},o.onerror=()=>{console.error(`Chart PNG export failed`),URL.revokeObjectURL(a),t&&t()},o.src=a}function ae(e,t,n){let r=new URLSearchParams;return e.name&&r.set(`name`,e.name),e.gender&&r.set(`gender`,e.gender),r.set(`day`,e.day),r.set(`month`,e.month),r.set(`year`,e.year),r.set(`hour`,e.hour),r.set(`min`,e.minute),r.set(`sec`,e.second===``?`0`:e.second),e.place&&r.set(`place`,e.place),n&&(r.set(`lat`,String(n.latitude)),r.set(`lng`,String(n.longitude))),t?.zone&&r.set(`tz`,t.zone),`../kundli-phal/?${r.toString()}`}function oe(e){let t=e.kundli,n=K(e),r=[`कुंडली / Kundli`,``];return e.name&&r.push(`${a(`summary.name`)}: ${e.name}`),r.push(`${a(`summary.date`)}: ${n.dateText}`),r.push(`${a(`summary.time`)}: ${n.timeText}`),r.push(`${a(`summary.place`)}: ${n.placeText}`),r.push(`${a(`summary.lagna`)}: ${i(t.ascendant.rashi)}`),r.push(`${a(`summary.ayanamsa`)}: ${V(t.ayanamsa)}`),r.push(``),t.planets.forEach(e=>{r.push(`${c(e.key)} — ${i(e.rashi)} — ${H(e.degInSign)} — ${s(e.nakshatra)} ${a(`table.pada`)} ${e.pada} — ${a(`table.house`)} ${e.house}`+(e.retro?` — ${a(`k.retro`)}`:``))}),r.join(`
`)}function se(){let e=document.querySelector(`#f-month`);e.replaceChildren(),p().forEach((t,n)=>{let r=document.createElement(`label`),i=document.createElement(`input`);i.type=`radio`,i.name=`month`,i.value=String(n+1);let a=document.createElement(`span`);a.textContent=t,r.append(i,a),e.append(r)})}function ce(){let e=p();document.querySelectorAll(`#f-month label span`).forEach((t,n)=>{t.textContent=e[n]})}function Y(){document.documentElement.lang=l(),document.title=a(`app.docTitle`),document.querySelectorAll(`[data-i18n]`).forEach(e=>{e.textContent=a(e.dataset.i18n)}),document.querySelectorAll(`[data-i18n-placeholder]`).forEach(e=>{e.placeholder=a(e.dataset.i18nPlaceholder)}),ce(),E.textContent=a(`lang.switchTo`),!O.hidden&&L&&(O.textContent=a(L)),Q(),Object.keys(P).length>0&&ue(P),N&&X(N,!1)}function le(){let e=e=>document.getElementById(e).value.trim(),t=document.querySelector(`input[name="gender"]:checked`);return{name:e(`f-name`),gender:t?t.value:``,day:e(`f-day`),month:document.querySelector(`input[name="month"]:checked`)?.value??``,year:e(`f-year`),hour:e(`f-hour`),minute:e(`f-minute`),second:e(`f-second`),offset:e(`f-offset`),place:e(`f-place`),selectedPlace:F,manual:{lat:e(`f-lat`),lon:e(`f-lon`),tz:e(`f-tz`)}}}function ue(e){document.querySelectorAll(`.err`).forEach(e=>{e.textContent=``}),document.querySelectorAll(`.has-error`).forEach(e=>e.classList.remove(`has-error`)),Object.entries(e).forEach(([e,t])=>{let n=document.getElementById(`err-${e}`);if(!n)return;n.textContent=t;let r=n.closest(`.field`);r&&r.classList.add(`has-error`)})}function X(e,t){let o=e=>String(e).padStart(2,`0`),l=`${B(e.day)} ${a(`month.`+B(e.month))} ${B(e.year)}`,d=`${o(B(e.hour))}:${o(B(e.minute))}:${o(e.second===``?0:B(e.second))}`;T.hidden=!1,T.replaceChildren();let f=document.createElement(`div`);if(f.className=`card summary`,e.kundli&&!e.kundli.error){let e=document.createElement(`div`);e.className=`print-only print-head`;let t=document.createElement(`p`);t.className=`print-title`,t.textContent=`कुंडली / Kundli`;let n=document.createElement(`p`);n.className=`print-links`;let r=document.createElement(`a`);r.href=`https://www.mybapuji.com`,r.target=`_blank`,r.rel=`noopener`,r.textContent=`mybapuji.com`;let i=document.createElement(`span`);i.className=`print-links-sep`,i.textContent=`·`;let a=document.createElement(`a`);a.href=b(x.kundli),a.target=`_blank`,a.rel=`noopener`,a.textContent=`mybapuji.com/kundli/`,n.append(r,i,a),e.append(t,n),f.append(e)}let p=document.createElement(`h2`);p.className=`summary-title`,p.textContent=a(`summary.title`),f.append(p);let m=document.createElement(`dl`),h=(e,t)=>{let n=document.createElement(`dt`);n.textContent=e;let r=document.createElement(`dd`);r.textContent=t,m.append(n,r)};h(a(`summary.name`),e.name||`—`),h(a(`summary.gender`),a(`gender.${e.gender}`)),h(a(`summary.date`),l),h(a(`summary.time`),d);let g=e.converted;if(g){let t;t=e.offset===``?u(g.zone)===null?`${g.zone} (UTC${g.offsetText})`:`UTC${g.offsetText}`:`${g.offsetText} (${a(`summary.manualOffset`)})`,h(a(`summary.tz`),t);let n=g.utc;h(a(`summary.utc`),`${n.day} ${a(`month.`+n.month)} ${n.year}, ${o(n.hour)}:${o(n.minute)}:${o(n.second)} UTC`)}let _=e.selectedPlace,y=_?[_.name,_.admin1,_.country].filter(Boolean).join(`, `):e.place;h(a(`summary.place`),y||`—`),e.manual&&e.manual.lat!==``&&e.manual.lon!==``&&e.manual.tz!==``?h(a(`summary.coords`),`${e.manual.lat}, ${e.manual.lon} · ${e.manual.tz}`):_&&h(a(`summary.coords`),`${_.latitude}, ${_.longitude} · ${_.timezone}`),f.append(m);let S=e.kundli;if(S&&!S.error){let t=S.ascendant;h(a(`summary.lagna`),`${i(t.rashi)} · ${V(t.degInSign)}`),h(a(`summary.ayanamsa`),V(S.ayanamsa));let o=document.createElement(`div`);o.className=`chart-wrap`;let l=document.createElement(`div`);l.className=`chart-toggle`;let u=document.createElement(`button`);u.type=`button`,u.dataset.style=`north`,u.textContent=a(`chart.north`);let d=document.createElement(`button`);d.type=`button`,d.dataset.style=`south`,d.textContent=a(`chart.south`);let p=document.createElement(`div`);p.className=`chart-grid`;let m=n(S),g=re(S),_=(e,t)=>{let n=document.createElement(`div`);n.className=`chart-cell`;let r=document.createElement(`p`);r.className=`chart-caption`,r.textContent=a(e);let i=document.createElement(`div`);return i.className=`chart-box`,i.append(t()),n.append(r,i),n},y=()=>{let t=e.chartStyle===`south`;p.replaceChildren(),p.append(_(`chart.d1`,()=>t?ee(S,K(e),{varga:`D1`}):v(S,{varga:`D1`})),_(`chart.d9`,()=>t?ee(m,K(e),{varga:`D9`}):v(m,{varga:`D9`}))),g&&p.append(_(`chart.chalit`,()=>v(g,{houseRashis:S.chalit.houseSigns,ascMarker:!1,varga:`CHALIT`}))),u.classList.toggle(`active`,!t),d.classList.toggle(`active`,t),u.setAttribute(`aria-pressed`,String(!t)),d.setAttribute(`aria-pressed`,String(t))};u.addEventListener(`click`,()=>{e.chartStyle=`north`,y()}),d.addEventListener(`click`,()=>{e.chartStyle=`south`,y()}),l.append(u,d),o.append(l,p),f.append(o),y();let b=document.createElement(`p`);b.className=`kundli-table-title`,b.textContent=a(`summary.planets`);let x=document.createElement(`div`);x.className=`table-wrap`;let C=document.createElement(`table`);C.className=`kundli-table planet-table`;let w=document.createElement(`thead`),T=document.createElement(`tr`);for(let e of[`table.planet`,`table.rashi`,`table.degree`,`table.nakshatra`,`table.house`,`table.retro`]){let t=document.createElement(`th`);t.textContent=a(e),T.append(t)}w.append(T),C.append(w);let E=document.createElement(`tbody`),D=(e,t)=>{let n=document.createElement(`tr`),r=[e,i(t.rashi),H(t.degInSign),`${s(t.nakshatra)} · ${a(`table.pada`)} ${t.pada}`,String(t.house),t.retro?a(`k.retro`):`—`];for(let e of r){let t=document.createElement(`td`);t.textContent=e,n.append(t)}return n};E.append(D(a(`table.asc`),S.ascendant)),S.planets.forEach(e=>E.append(D(c(e.key),e))),C.append(E),x.append(C),f.append(b,x);let O=S.planets.find(e=>e.key===`moon`);if(O&&e.converted){let t=e.converted.utc,n=Date.UTC(t.year,t.month-1,t.day,t.hour,t.minute,t.second),i=r(O.longitude,n),o=document.createElement(`p`);o.className=`kundli-table-title`,o.textContent=a(`summary.dasha`);let s=document.createElement(`div`);s.className=`table-wrap`,s.append(J(i.mahadashas,i.currentIdx,a(`dasha.md`)));let l=i.mahadashas[i.currentIdx],u=i.antardashas[i.currentAdIdx],d=document.createElement(`p`);d.className=`note dasha-now`,d.textContent=`${a(`dasha.nowLine`)}${c(l.key)} ${a(`dasha.md`)} / ${c(u.key)} ${a(`dasha.ad`)} (${q(u.toMs)} ${a(`dasha.till`)})`;let p=document.createElement(`p`);p.className=`kundli-table-title`,p.textContent=`${a(`dasha.ad`)} — ${c(l.key)} ${a(`dasha.md`)}`;let m=document.createElement(`div`);m.className=`table-wrap`,m.append(J(i.antardashas,i.currentAdIdx,a(`dasha.ad`)));let h=document.createElement(`p`);h.className=`note`,h.textContent=a(`dasha.basis`),f.append(o,s,d,p,m,h)}let k=document.createElement(`div`);k.className=`actions`;let A=document.createElement(`p`);A.className=`note`,A.setAttribute(`aria-live`,`polite`),A.hidden=!0;let j=document.createElement(`button`);j.type=`button`,j.className=`secondary`,j.dataset.action=`png`,j.textContent=a(`btn.downloadPng`),j.addEventListener(`click`,()=>ie(e,()=>{A.textContent=a(`msg.pngFailed`),A.hidden=!1}));let M=document.createElement(`button`);M.type=`button`,M.className=`secondary`,M.dataset.action=`print`,M.textContent=a(`btn.print`),M.addEventListener(`click`,()=>window.print());let N=document.createElement(`button`);N.type=`button`,N.className=`secondary`,N.dataset.action=`copy`,N.textContent=a(`btn.copy`),N.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(oe(e)),A.textContent=a(`msg.copied`)}catch(e){console.error(`Copy failed:`,e),A.textContent=a(`msg.copyFailed`)}A.hidden=!1});let P=document.createElement(`p`);P.className=`note pdf-hint`,P.textContent=a(`actions.pdfHint`),k.append(j,M,N,A,P),f.append(k);let F=G(e);if(F&&U(e)){let t=document.createElement(`div`);t.className=`phal-cta`;let n=document.createElement(`a`);n.className=`phal-btn`,n.dataset.action=`phal`,n.target=`_blank`,n.rel=`noopener`,n.href=ae(e,U(e),F),n.textContent=a(`btn.phal`);let r=document.createElement(`p`);r.className=`note phal-hint`,r.textContent=a(`phal.hint`),t.append(n,r),f.append(t)}}let C=document.createElement(`p`);C.className=`note summary-note`,e.kundliError?C.textContent=a(`summary.engineError`):S&&S.error===`polar`?C.textContent=a(`err.polar`):e.kundliPending?C.textContent=a(`summary.calculating`):(C.textContent=a(`summary.note`),C.classList.add(`summary-note-ok`)),f.append(C),T.append(f),t&&typeof T.scrollIntoView==`function`&&T.scrollIntoView({behavior:`smooth`,block:`start`})}E.addEventListener(`click`,()=>{f(l()===`hi`?`en`:`hi`),Y()});function Z(e){L=e,O.hidden=!e,O.textContent=e?a(e):``}function de(e){return[e.name,e.admin1,e.country].filter(Boolean).join(`, `)}function fe(){A.replaceChildren(),A.hidden=I.length===0,I.forEach(e=>{let t=document.createElement(`button`);t.type=`button`,t.className=`result-item`+(e===F?` selected`:``),t.textContent=de(e),t.addEventListener(`click`,()=>{F=e,Z(null),Q(),fe(),A.hidden=!0}),A.append(t)})}function Q(){if(j.hidden=!F,F){let e=F;j.textContent=`✔ ${a(`search.selected`)}: ${de(e)} · ${e.latitude}, ${e.longitude} · ${e.timezone}`}}async function pe(){let e=k.value.trim();if(!e){Z(`search.enterName`);return}let t=Date.now();if(!(e===R.query&&t-R.at<300)){R={at:t,query:e},D.disabled=!0,Z(`search.busy`);try{I=await h(e,8),I.length===0?(A.hidden=!0,Z(`search.none`)):(Z(null),fe())}catch(e){console.error(e),A.hidden=!0,Z(`search.error`)}finally{D.disabled=!1}}}D.addEventListener(`click`,pe),k.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),pe())}),k.addEventListener(`input`,()=>{F&&(F=null,Q())});async function me(){let t=le(),n=_(t);if(P=n,ue(n),Object.keys(n).length>0){N=null,T.hidden=!0,n.manual&&(M.open=!0);let e=w.querySelector(`.has-error input, .has-error select`);e&&e.focus();return}t.converted=U(t),t.kundli=null,t.kundliPending=!0,N=t,X(t,!0);try{let n=await ne(),r=G(t);r&&t.converted&&(t.kundli=e(n,{utc:t.converted.utc,...r,nodeType:`mean`}))}catch(e){console.error(`Chart calculation failed:`,e),W=null,t.kundliError=!0}finally{t.kundliPending=!1,N===t&&X(t,!1)}}w.addEventListener(`submit`,e=>{e.preventDefault(),me()});function he(e){let t=(e,t)=>{t!==``&&(document.getElementById(e).value=t)};if(t(`f-name`,e.name),e.gender){let t=document.querySelector(`input[name="gender"][value="${e.gender}"]`);t&&(t.checked=!0)}if(e.month){let t=document.querySelector(`input[name="month"][value="${e.month}"]`);t&&(t.checked=!0)}t(`f-day`,e.day),t(`f-year`,e.year),t(`f-hour`,e.hour),t(`f-minute`,e.minute),t(`f-second`,e.second);let n=Number(e.lat),r=Number(e.lng);e.place&&e.lat!==``&&e.lng!==``&&e.tz&&Number.isFinite(n)&&Number.isFinite(r)?(t(`f-place`,e.place),F={name:e.place,latitude:n,longitude:r,timezone:e.tz},Q()):e.place&&t(`f-place`,e.place)}var $=g(window.location.search);$.lang&&f($.lang),se(),Y(),$.any&&(he($),Object.keys(_(le())).length===0&&me());