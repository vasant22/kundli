import{T as e,m as t,w as n}from"./timeutil-7nq4thId.js";import{t as r}from"./geocode-DLqB8puT.js";import{t as i}from"./birthvalidate-CcbvHW0k.js";import{t as a}from"./pages-Cw1CFDfv.js";import{t as o}from"./widget-GjZuQsv2.js";var s={b:{selectedPlace:null,lastResults:[],lastSearch:{at:0,query:``}},g:{selectedPlace:null,lastResults:[],lastSearch:{at:0,query:``}}},c=`b`;function l(e){return[e.name,e.admin1,e.country].filter(Boolean).join(`, `)}function u(e,t,n){n.name&&e.set(`${t}name`,n.name),e.set(`${t}day`,n.day),e.set(`${t}month`,n.month),e.set(`${t}year`,n.year),e.set(`${t}hour`,n.hour),e.set(`${t}min`,n.minute),e.set(`${t}sec`,n.second===``?`0`:n.second),n.selectedPlace&&(e.set(`${t}place`,l(n.selectedPlace)),e.set(`${t}lat`,String(n.selectedPlace.latitude)),e.set(`${t}lng`,String(n.selectedPlace.longitude)),e.set(`${t}tz`,n.selectedPlace.timezone))}function d(e,t,n=`hi`){let r=new URLSearchParams;return u(r,`b_`,e),u(r,`g_`,t),n===`en`&&r.set(`lang`,`en`),r}function f(e,t,n,r=`hi`){let i=new URL(a.match,e);return i.search=d(t,n,r).toString(),i.toString()}var p=(e,t)=>e.querySelector(t);function m(t){return`
    <div class="kw-field">
      <label class="kw-label" for="mw-${t}-name">${e(`form.name`)}</label>
      <input class="kw-input" id="mw-${t}-name" type="text" placeholder="${e(`form.namePh`)}" />
    </div>

    <div class="kw-field">
      <span class="kw-label">${e(`form.dob`)}</span>
      <div class="kw-row3">
        <div class="kw-mini">
          <label class="kw-mini-label" for="mw-${t}-day">${e(`date.day`)}</label>
          <input class="kw-input" id="mw-${t}-day" type="number" inputmode="numeric" min="1" max="31" placeholder="1–31" />
        </div>
        <div class="kw-mini">
          <label class="kw-mini-label" for="mw-${t}-month">${e(`date.month`)}</label>
          <input class="kw-input" id="mw-${t}-month" type="number" inputmode="numeric" min="1" max="12" placeholder="1–12" />
        </div>
        <div class="kw-mini">
          <label class="kw-mini-label" for="mw-${t}-year">${e(`date.year`)}</label>
          <input class="kw-input" id="mw-${t}-year" type="number" inputmode="numeric" min="1800" max="2400" placeholder="1990" />
        </div>
      </div>
      <p class="kw-err" id="mw-${t}-err-date" aria-live="polite"></p>
    </div>

    <div class="kw-field">
      <span class="kw-label">${e(`form.tob`)} <span class="kw-note-inline">${e(`form.tobNote`)}</span></span>
      <div class="kw-row3">
        <div class="kw-mini">
          <label class="kw-mini-label" for="mw-${t}-hour">${e(`time.hour`)}</label>
          <input class="kw-input" id="mw-${t}-hour" type="number" inputmode="numeric" min="0" max="23" placeholder="0–23" />
        </div>
        <div class="kw-mini">
          <label class="kw-mini-label" for="mw-${t}-minute">${e(`time.minute`)}</label>
          <input class="kw-input" id="mw-${t}-minute" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" />
        </div>
        <div class="kw-mini">
          <label class="kw-mini-label" for="mw-${t}-second">${e(`time.second`)}</label>
          <input class="kw-input" id="mw-${t}-second" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" value="0" />
        </div>
      </div>
      <p class="kw-err" id="mw-${t}-err-time" aria-live="polite"></p>
    </div>

    <div class="kw-field">
      <label class="kw-label" for="mw-${t}-place">${e(`form.place`)}</label>
      <div class="kw-search">
        <input class="kw-input" id="mw-${t}-place" type="text" placeholder="${e(`form.placePh`)}" />
        <button id="mw-${t}-search-btn" class="kw-search-btn" type="button">${e(`form.search`)}</button>
      </div>
      <p class="kw-note" id="mw-${t}-search-note" hidden></p>
      <div id="mw-${t}-results" class="kw-results" hidden></div>
      <p class="kw-ok" id="mw-${t}-place-confirm" hidden></p>
      <p class="kw-err" id="mw-${t}-err-place" aria-live="polite"></p>
    </div>`}function h(t,r=`hi`){n(r),s.b={selectedPlace:null,lastResults:[],lastSearch:{at:0,query:``}},s.g={selectedPlace:null,lastResults:[],lastSearch:{at:0,query:``}},c=`b`,t.innerHTML=`
    <div class="pw-card" role="region" aria-label="${e(`mw.title`)}">
      <div class="pw-head">
        <div class="pw-title">${e(`mw.title`)}</div>
      </div>
      <form id="mw-form" class="kw-form" novalidate>
        <section id="mw-step-b">
          <p class="mw-step-heading">${e(`match.boysHeading`)}</p>
          ${m(`b`)}
          <p class="kw-note mw-next-note">${e(`match.nextNote`)}</p>
          <button class="pw-btn kw-submit" type="submit" id="mw-continue">${e(`match.continue`)}</button>
        </section>

        <section id="mw-step-g" hidden>
          <button type="button" class="mw-back" id="mw-back">${e(`match.back`)}</button>
          <p class="mw-step-heading">${e(`match.girlsHeading`)}</p>
          ${m(`g`)}
          <button class="pw-btn kw-submit" type="submit" id="mw-report">${e(`match.getReport`)}</button>
        </section>

        <p class="kw-ok" id="mw-open-note" hidden></p>
        <p class="kw-credit">Geocoding by <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo.com</a></p>
      </form>
    </div>`,y(t)}function g(e,t){let n=n=>p(e,`#mw-${t}-${n}`).value.trim();return{name:n(`name`),day:n(`day`),month:n(`month`),year:n(`year`),hour:n(`hour`),minute:n(`minute`),second:n(`second`),offset:``,place:n(`place`),selectedPlace:s[t].selectedPlace,manual:{lat:``,lon:``,tz:``}}}function _(e,t,n){let r=p(e,t===`b`?`#mw-step-b`:`#mw-step-g`);r.querySelectorAll(`.kw-err`).forEach(e=>{e.textContent=``}),r.querySelectorAll(`.kw-field.has-error`).forEach(e=>e.classList.remove(`has-error`)),Object.entries(n).forEach(([e,n])=>{let i=r.querySelector(`#mw-${t}-err-${e}`);if(!i)return;i.textContent=n;let a=i.closest(`.kw-field`);a&&a.classList.add(`has-error`)})}function v(t,n){let i=s[n],a=p(t,`#mw-${n}-search-btn`),o=p(t,`#mw-${n}-search-note`),c=p(t,`#mw-${n}-place`),u=p(t,`#mw-${n}-results`),d=p(t,`#mw-${n}-place-confirm`),f=t=>{o.hidden=!t,o.textContent=t?e(t):``},m=()=>{if(d.hidden=!i.selectedPlace,i.selectedPlace){let t=i.selectedPlace;d.textContent=`✔ ${e(`search.selected`)}: ${l(t)} · ${t.latitude}, ${t.longitude} · ${t.timezone}`}},h=()=>{u.replaceChildren(),u.hidden=i.lastResults.length===0,i.lastResults.forEach(e=>{let t=document.createElement(`button`);t.type=`button`,t.className=`kw-result`+(e===i.selectedPlace?` selected`:``),t.textContent=l(e),t.addEventListener(`click`,()=>{i.selectedPlace=e,f(null),m(),h(),u.hidden=!0}),u.append(t)})};async function g(){let e=c.value.trim();if(!e){f(`search.enterName`);return}let t=Date.now();if(!(e===i.lastSearch.query&&t-i.lastSearch.at<300)){i.lastSearch={at:t,query:e},a.disabled=!0,f(`search.busy`);try{i.lastResults=await r(e,8),i.lastResults.length===0?(u.hidden=!0,f(`search.none`)):(f(null),h())}catch(e){console.error(e),u.hidden=!0,f(`panchang.errPlace`)}finally{a.disabled=!1}}}a.addEventListener(`click`,g),c.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),g())}),c.addEventListener(`input`,()=>{i.selectedPlace&&(i.selectedPlace=null,m())})}function y(n){let r=p(n,`#mw-form`),a=p(n,`#mw-open-note`),o=p(n,`#mw-step-b`),s=p(n,`#mw-step-g`),l=e=>{c=e,o.hidden=e!==`b`,s.hidden=e!==`g`,typeof r.scrollIntoView==`function`&&r.scrollIntoView({behavior:`smooth`,block:`start`})};for(let e of[`b`,`g`])v(n,e);p(n,`#mw-back`).addEventListener(`click`,()=>l(`b`)),r.addEventListener(`submit`,r=>{if(r.preventDefault(),a.hidden=!0,c===`b`){let e=g(n,`b`),t=i(e,{requireGender:!1,placeSelectKey:`kw.errPlacePick`});if(_(n,`b`,t),Object.keys(t).length>0)return;l(`g`);return}let o=g(n,`b`),s=i(o,{requireGender:!1,placeSelectKey:`kw.errPlacePick`});_(n,`b`,s);let u=g(n,`g`),d=i(u,{requireGender:!1,placeSelectKey:`kw.errPlacePick`});if(_(n,`g`,d),Object.keys(s).length>0){l(`b`);return}Object.keys(d).length>0||(a.hidden=!1,a.textContent=e(`mw.opening`),window.open(f(window.location.href,o,u,t()),`_blank`,`noopener`))})}if(typeof document<`u`){let e=document.getElementById(`widget`);if(e){let t=new URLSearchParams(window.location.search);t.get(`transparent`)===`1`&&document.body.classList.add(`pw-transparent`),o(),h(e,t.get(`lang`)===`en`?`en`:`hi`)}}