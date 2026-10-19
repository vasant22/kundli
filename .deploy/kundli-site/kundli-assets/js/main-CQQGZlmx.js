import{a as e,n as t,o as n,r}from"./astro-BrsFnPnW.js";import{D as i,E as a,S as o,_ as s,a as c,b as l,g as u,n as d,s as f,t as p,w as m,x as h}from"./pages-FBg_a2XP.js";import{t as g}from"./mybapuji-strip-BoINb0wv.js";import{t as _}from"./geocode-DLqB8puT.js";import{n as v,t as y}from"./tzauto-DF7_Kaz-.js";import{t as b}from"./birthvalidate-D3N96iQr.js";import{n as x,r as S}from"./charts-8bLU01EO.js";var C=`https://github.com/vasant22/kundli`,w=document.querySelector(`#app`);w.innerHTML=g()+`
  <div class="wrap">
    <header class="site-header">
      <div>
        <h1 data-i18n="app.title"></h1>
        <p class="sub" data-i18n="app.subtitle"></p>
        <p class="free-badge" data-i18n="app.badge"></p>
        <nav class="site-nav">
          <a href="${p.kundli}" class="active" data-i18n="nav.home"></a>
          <a href="${p.match}" data-i18n="nav.match"></a>
          <a href="${p.panchang}" data-i18n="nav.panchang"></a>
          <a href="${p.bnn}" data-i18n="nav.bnn"></a>
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
`;var T=document.querySelector(`#kundli-form`),E=document.querySelector(`#output`),D=document.querySelector(`#lang-toggle`),O=document.querySelector(`#search-btn`),k=document.querySelector(`#search-note`),A=document.querySelector(`#f-place`),j=document.querySelector(`#results`),M=document.querySelector(`#place-confirm`),N=document.querySelector(`#manual-box`),P=null,F={},I=null,L=[],R=null,z={at:0,query:``},B=document.querySelector(`#tz-auto-note`);y({latEl:document.querySelector(`#f-lat`),lonEl:document.querySelector(`#f-lon`),tzEl:document.querySelector(`#f-tz`),onState(e){B.hidden=!e,B.classList.toggle(`ok`,e===`filled`),e?(B.dataset.i18n=`tz.auto.${e}`,B.textContent=i(`tz.auto.${e}`)):(B.removeAttribute(`data-i18n`),B.textContent=``)}});var V=e=>e===``?NaN:Number(e);function H(e){let t=Math.floor(e),n=Math.floor((e-t)*60+.5);return n===60&&(t+=1,n=0),`${t}°${String(n).padStart(2,`0`)}'`}function ee(e){let t=Math.floor(e),n=Math.floor((e-t)*60),r=Math.round(((e-t)*60-n)*60);return r===60&&(r=0,n+=1),n===60&&(n=0,t+=1),`${t}°${String(n).padStart(2,`0`)}'${String(r).padStart(2,`0`)}"`}function te(e){return e.offset===``?e.selectedPlace&&e.selectedPlace.timezone?e.selectedPlace.timezone:e.manual.tz===``?null:e.manual.tz:e.offset}function ne(e){let t=te(e);if(!t)return null;try{let n={year:Number(e.year),month:Number(e.month),day:Number(e.day),hour:Number(e.hour),minute:Number(e.minute),second:e.second===``?0:Number(e.second)};return{zone:t,...f(n,t)}}catch(e){return console.error(`Time conversion failed:`,e),null}}var U=null;function re(){return U||=e(),U}function ie(e){return e.manual.lat!==``&&e.manual.lon!==``&&e.manual.tz!==``?{latitude:Number(e.manual.lat),longitude:Number(e.manual.lon)}:e.selectedPlace?{latitude:e.selectedPlace.latitude,longitude:e.selectedPlace.longitude}:null}function W(e){let t=e=>String(e).padStart(2,`0`);return{name:e.name,dateText:`${Number(e.day)} ${l(Number(e.month))} ${Number(e.year)}`,timeText:`${t(Number(e.hour))}:${t(Number(e.minute))}:${t(e.second===``?0:Number(e.second))}`,placeText:e.selectedPlace?e.selectedPlace.name:e.place}}function ae(e){return e.chalit?{ascendant:e.ascendant,planets:e.planets.map(t=>({...t,house:e.chalit.houses[t.key]||t.house}))}:null}function G(e){let t=new Date(e);return`${t.getUTCDate()} ${i(`month.`+(t.getUTCMonth()+1))} ${t.getUTCFullYear()}`}function K(e,t,n){let r=document.createElement(`table`);r.className=`kundli-table dasha-table`;let a=document.createElement(`thead`),o=document.createElement(`tr`);for(let e of[n,i(`dasha.from`),i(`dasha.to`),``]){let t=document.createElement(`th`);t.textContent=e,o.append(t)}a.append(o),r.append(a);let c=document.createElement(`tbody`);return e.forEach((e,n)=>{let r=document.createElement(`tr`);n===t&&(r.className=`current`);let a=[s(e.key),G(e.fromMs),G(e.toMs),n===t?i(`dasha.now`):``];for(let e of a){let t=document.createElement(`td`);t.textContent=e,r.append(t)}c.append(r)}),r.append(c),r}function oe(e,t){let n=document.querySelector(`.chart-box svg`);if(!n){t&&t();return}let r=n.cloneNode(!0);r.setAttribute(`font-family`,`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`);let i=new XMLSerializer().serializeToString(r),a=URL.createObjectURL(new Blob([i],{type:`image/svg+xml;charset=utf-8`})),o=new Image;o.onload=()=>{try{let n=1080,r=document.createElement(`canvas`);r.width=n,r.height=n;let i=r.getContext(`2d`);i.fillStyle=`#ffffff`,i.fillRect(0,0,n,n),i.drawImage(o,0,0,n,n),r.toBlob(n=>{if(!n){t&&t();return}let r=document.createElement(`a`);r.href=URL.createObjectURL(n),r.download=e.chartStyle===`south`?`kundli-south.png`:`kundli-north.png`,r.click(),setTimeout(()=>URL.revokeObjectURL(r.href),5e3)},`image/png`)}finally{URL.revokeObjectURL(a)}},o.onerror=()=>{console.error(`Chart PNG export failed`),URL.revokeObjectURL(a),t&&t()},o.src=a}function se(e){let t=e.kundli,n=W(e),r=[`कुंडली / Kundli`,``];return e.name&&r.push(`${i(`summary.name`)}: ${e.name}`),r.push(`${i(`summary.date`)}: ${n.dateText}`),r.push(`${i(`summary.time`)}: ${n.timeText}`),r.push(`${i(`summary.place`)}: ${n.placeText}`),r.push(`${i(`summary.lagna`)}: ${m(t.ascendant.rashi)}`),r.push(`${i(`summary.ayanamsa`)}: ${H(t.ayanamsa)}`),r.push(``),t.planets.forEach(e=>{r.push(`${s(e.key)} — ${m(e.rashi)} — ${ee(e.degInSign)} — ${o(e.nakshatra)} ${i(`table.pada`)} ${e.pada} — ${i(`table.house`)} ${e.house}`+(e.retro?` — ${i(`k.retro`)}`:``))}),r.join(`
`)}function ce(){let e=document.querySelector(`#f-month`);e.replaceChildren(),h().forEach((t,n)=>{let r=document.createElement(`label`),i=document.createElement(`input`);i.type=`radio`,i.name=`month`,i.value=String(n+1);let a=document.createElement(`span`);a.textContent=t,r.append(i,a),e.append(r)})}function le(){let e=h();document.querySelectorAll(`#f-month label span`).forEach((t,n)=>{t.textContent=e[n]})}function q(){document.documentElement.lang=u(),document.title=i(`app.docTitle`),document.querySelectorAll(`[data-i18n]`).forEach(e=>{e.textContent=i(e.dataset.i18n)}),document.querySelectorAll(`[data-i18n-placeholder]`).forEach(e=>{e.placeholder=i(e.dataset.i18nPlaceholder)}),le(),D.textContent=i(`lang.switchTo`),!k.hidden&&R&&(k.textContent=i(R)),Q(),Object.keys(F).length>0&&Y(F),P&&X(P,!1)}function J(){let e=e=>document.getElementById(e).value.trim(),t=document.querySelector(`input[name="gender"]:checked`);return{name:e(`f-name`),gender:t?t.value:``,day:e(`f-day`),month:document.querySelector(`input[name="month"]:checked`)?.value??``,year:e(`f-year`),hour:e(`f-hour`),minute:e(`f-minute`),second:e(`f-second`),offset:e(`f-offset`),place:e(`f-place`),selectedPlace:I,manual:{lat:e(`f-lat`),lon:e(`f-lon`),tz:e(`f-tz`)}}}function Y(e){document.querySelectorAll(`.err`).forEach(e=>{e.textContent=``}),document.querySelectorAll(`.has-error`).forEach(e=>e.classList.remove(`has-error`)),Object.entries(e).forEach(([e,t])=>{let n=document.getElementById(`err-${e}`);if(!n)return;n.textContent=t;let r=n.closest(`.field`);r&&r.classList.add(`has-error`)})}function X(e,t){let a=e=>String(e).padStart(2,`0`),l=`${V(e.day)} ${i(`month.`+V(e.month))} ${V(e.year)}`,u=`${a(V(e.hour))}:${a(V(e.minute))}:${a(e.second===``?0:V(e.second))}`;E.hidden=!1,E.replaceChildren();let f=document.createElement(`div`);if(f.className=`card summary`,e.kundli&&!e.kundli.error){let e=document.createElement(`div`);e.className=`print-only print-head`;let t=document.createElement(`p`);t.className=`print-title`,t.textContent=`कुंडली / Kundli`;let n=document.createElement(`p`);n.className=`print-links`;let r=document.createElement(`a`);r.href=`https://www.mybapuji.com`,r.target=`_blank`,r.rel=`noopener`,r.textContent=`mybapuji.com`;let i=document.createElement(`span`);i.className=`print-links-sep`,i.textContent=`·`;let a=document.createElement(`a`);a.href=d(p.kundli),a.target=`_blank`,a.rel=`noopener`,a.textContent=`mybapuji.com/kundli/`,n.append(r,i,a),e.append(t,n),f.append(e)}let h=document.createElement(`h2`);h.className=`summary-title`,h.textContent=i(`summary.title`),f.append(h);let g=document.createElement(`dl`),_=(e,t)=>{let n=document.createElement(`dt`);n.textContent=e;let r=document.createElement(`dd`);r.textContent=t,g.append(n,r)};_(i(`summary.name`),e.name||`—`),_(i(`summary.gender`),i(`gender.${e.gender}`)),_(i(`summary.date`),l),_(i(`summary.time`),u);let v=e.converted;if(v){let t;t=e.offset===``?c(v.zone)===null?`${v.zone} (UTC${v.offsetText})`:`UTC${v.offsetText}`:`${v.offsetText} (${i(`summary.manualOffset`)})`,_(i(`summary.tz`),t);let n=v.utc;_(i(`summary.utc`),`${n.day} ${i(`month.`+n.month)} ${n.year}, ${a(n.hour)}:${a(n.minute)}:${a(n.second)} UTC`)}let y=e.selectedPlace,b=y?[y.name,y.admin1,y.country].filter(Boolean).join(`, `):e.place;_(i(`summary.place`),b||`—`),e.manual&&e.manual.lat!==``&&e.manual.lon!==``&&e.manual.tz!==``?_(i(`summary.coords`),`${e.manual.lat}, ${e.manual.lon} · ${e.manual.tz}`):y&&_(i(`summary.coords`),`${y.latitude}, ${y.longitude} · ${y.timezone}`),f.append(g);let C=e.kundli;if(C&&!C.error){let t=C.ascendant;_(i(`summary.lagna`),`${m(t.rashi)} · ${H(t.degInSign)}`),_(i(`summary.ayanamsa`),H(C.ayanamsa));let a=document.createElement(`div`);a.className=`chart-wrap`;let c=document.createElement(`div`);c.className=`chart-toggle`;let l=document.createElement(`button`);l.type=`button`,l.dataset.style=`north`,l.textContent=i(`chart.north`);let u=document.createElement(`button`);u.type=`button`,u.dataset.style=`south`,u.textContent=i(`chart.south`);let d=document.createElement(`div`);d.className=`chart-grid`;let p=n(C),h=ae(C),g=(e,t)=>{let n=document.createElement(`div`);n.className=`chart-cell`;let r=document.createElement(`p`);r.className=`chart-caption`,r.textContent=i(e);let a=document.createElement(`div`);return a.className=`chart-box`,a.append(t()),n.append(r,a),n},v=()=>{let t=e.chartStyle===`south`;d.replaceChildren(),d.append(g(`chart.d1`,()=>t?S(C,W(e),{varga:`D1`}):x(C,{varga:`D1`})),g(`chart.d9`,()=>t?S(p,W(e),{varga:`D9`}):x(p,{varga:`D9`}))),h&&d.append(g(`chart.chalit`,()=>x(h,{houseRashis:C.chalit.houseSigns,ascMarker:!1,varga:`CHALIT`}))),l.classList.toggle(`active`,!t),u.classList.toggle(`active`,t),l.setAttribute(`aria-pressed`,String(!t)),u.setAttribute(`aria-pressed`,String(t))};l.addEventListener(`click`,()=>{e.chartStyle=`north`,v()}),u.addEventListener(`click`,()=>{e.chartStyle=`south`,v()}),c.append(l,u),a.append(c,d),f.append(a),v();let y=document.createElement(`p`);y.className=`kundli-table-title`,y.textContent=i(`summary.planets`);let b=document.createElement(`div`);b.className=`table-wrap`;let w=document.createElement(`table`);w.className=`kundli-table planet-table`;let T=document.createElement(`thead`),E=document.createElement(`tr`);for(let e of[`table.planet`,`table.rashi`,`table.degree`,`table.nakshatra`,`table.house`,`table.retro`]){let t=document.createElement(`th`);t.textContent=i(e),E.append(t)}T.append(E),w.append(T);let D=document.createElement(`tbody`),O=(e,t)=>{let n=document.createElement(`tr`),r=[e,m(t.rashi),ee(t.degInSign),`${o(t.nakshatra)} · ${i(`table.pada`)} ${t.pada}`,String(t.house),t.retro?i(`k.retro`):`—`];for(let e of r){let t=document.createElement(`td`);t.textContent=e,n.append(t)}return n};D.append(O(i(`table.asc`),C.ascendant)),C.planets.forEach(e=>D.append(O(s(e.key),e))),w.append(D),b.append(w),f.append(y,b);let k=C.planets.find(e=>e.key===`moon`);if(k&&e.converted){let t=e.converted.utc,n=Date.UTC(t.year,t.month-1,t.day,t.hour,t.minute,t.second),a=r(k.longitude,n),o=document.createElement(`p`);o.className=`kundli-table-title`,o.textContent=i(`summary.dasha`);let c=document.createElement(`div`);c.className=`table-wrap`,c.append(K(a.mahadashas,a.currentIdx,i(`dasha.md`)));let l=a.mahadashas[a.currentIdx],u=a.antardashas[a.currentAdIdx],d=document.createElement(`p`);d.className=`note dasha-now`,d.textContent=`${i(`dasha.nowLine`)}${s(l.key)} ${i(`dasha.md`)} / ${s(u.key)} ${i(`dasha.ad`)} (${G(u.toMs)} ${i(`dasha.till`)})`;let p=document.createElement(`p`);p.className=`kundli-table-title`,p.textContent=`${i(`dasha.ad`)} — ${s(l.key)} ${i(`dasha.md`)}`;let m=document.createElement(`div`);m.className=`table-wrap`,m.append(K(a.antardashas,a.currentAdIdx,i(`dasha.ad`)));let h=document.createElement(`p`);h.className=`note`,h.textContent=i(`dasha.basis`),f.append(o,c,d,p,m,h)}let A=document.createElement(`div`);A.className=`actions`;let j=document.createElement(`p`);j.className=`note`,j.setAttribute(`aria-live`,`polite`),j.hidden=!0;let M=document.createElement(`button`);M.type=`button`,M.className=`secondary`,M.dataset.action=`png`,M.textContent=i(`btn.downloadPng`),M.addEventListener(`click`,()=>oe(e,()=>{j.textContent=i(`msg.pngFailed`),j.hidden=!1}));let N=document.createElement(`button`);N.type=`button`,N.className=`secondary`,N.dataset.action=`print`,N.textContent=i(`btn.print`),N.addEventListener(`click`,()=>window.print());let P=document.createElement(`button`);P.type=`button`,P.className=`secondary`,P.dataset.action=`copy`,P.textContent=i(`btn.copy`),P.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(se(e)),j.textContent=i(`msg.copied`)}catch(e){console.error(`Copy failed:`,e),j.textContent=i(`msg.copyFailed`)}j.hidden=!1});let F=document.createElement(`p`);F.className=`note pdf-hint`,F.textContent=i(`actions.pdfHint`),A.append(M,N,P,j,F),f.append(A)}let w=document.createElement(`p`);w.className=`note summary-note`,e.kundliError?w.textContent=i(`summary.engineError`):C&&C.error===`polar`?w.textContent=i(`err.polar`):e.kundliPending?w.textContent=i(`summary.calculating`):(w.textContent=i(`summary.note`),w.classList.add(`summary-note-ok`)),f.append(w),E.append(f),t&&typeof E.scrollIntoView==`function`&&E.scrollIntoView({behavior:`smooth`,block:`start`})}D.addEventListener(`click`,()=>{a(u()===`hi`?`en`:`hi`),q()});function Z(e){R=e,k.hidden=!e,k.textContent=e?i(e):``}function ue(e){return[e.name,e.admin1,e.country].filter(Boolean).join(`, `)}function de(){j.replaceChildren(),j.hidden=L.length===0,L.forEach(e=>{let t=document.createElement(`button`);t.type=`button`,t.className=`result-item`+(e===I?` selected`:``),t.textContent=ue(e),t.addEventListener(`click`,()=>{I=e,Z(null),Q(),de(),j.hidden=!0}),j.append(t)})}function Q(){if(M.hidden=!I,I){let e=I;M.textContent=`✔ ${i(`search.selected`)}: ${ue(e)} · ${e.latitude}, ${e.longitude} · ${e.timezone}`}}async function fe(){let e=A.value.trim();if(!e){Z(`search.enterName`);return}let t=Date.now();if(!(e===z.query&&t-z.at<300)){z={at:t,query:e},O.disabled=!0,Z(`search.busy`);try{L=await _(e,8),L.length===0?(j.hidden=!0,Z(`search.none`)):(Z(null),de())}catch(e){console.error(e),j.hidden=!0,Z(`search.error`)}finally{O.disabled=!1}}}O.addEventListener(`click`,fe),A.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),fe())}),A.addEventListener(`input`,()=>{I&&(I=null,Q())});async function pe(){let e=J(),n=b(e);if(F=n,Y(n),Object.keys(n).length>0){P=null,E.hidden=!0,n.manual&&(N.open=!0);let e=T.querySelector(`.has-error input, .has-error select`);e&&e.focus();return}e.converted=ne(e),e.kundli=null,e.kundliPending=!0,P=e,X(e,!0);try{let n=await re(),r=ie(e);r&&e.converted&&(e.kundli=t(n,{utc:e.converted.utc,...r,nodeType:`mean`}))}catch(t){console.error(`Chart calculation failed:`,t),U=null,e.kundliError=!0}finally{e.kundliPending=!1,P===e&&X(e,!1)}}T.addEventListener(`submit`,e=>{e.preventDefault(),pe()});function me(e){let t=(e,t)=>{t!==``&&(document.getElementById(e).value=t)};if(t(`f-name`,e.name),e.gender){let t=document.querySelector(`input[name="gender"][value="${e.gender}"]`);t&&(t.checked=!0)}if(e.month){let t=document.querySelector(`input[name="month"][value="${e.month}"]`);t&&(t.checked=!0)}t(`f-day`,e.day),t(`f-year`,e.year),t(`f-hour`,e.hour),t(`f-minute`,e.minute),t(`f-second`,e.second);let n=Number(e.lat),r=Number(e.lng);e.place&&e.lat!==``&&e.lng!==``&&e.tz&&Number.isFinite(n)&&Number.isFinite(r)?(t(`f-place`,e.place),I={name:e.place,latitude:n,longitude:r,timezone:e.tz},Q()):e.place&&t(`f-place`,e.place)}var $=v(window.location.search);$.lang&&a($.lang),ce(),q(),$.any&&(me($),Object.keys(b(J())).length===0&&pe());