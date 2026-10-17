import{D as e,E as t,g as n,t as r}from"./pages-FBg_a2XP.js";import{t as i}from"./geocode-DLqB8puT.js";import{t as a}from"./birthvalidate-D3N96iQr.js";import{t as o}from"./widget-GjZuQsv2.js";var s={selectedPlace:null,lastResults:[],lastSearch:{at:0,query:``}};function c(e){return[e.name,e.admin1,e.country].filter(Boolean).join(`, `)}function l(e,t=`hi`){let n=new URLSearchParams;return e.name&&n.set(`name`,e.name),e.gender&&n.set(`gender`,e.gender),n.set(`day`,e.day),n.set(`month`,e.month),n.set(`year`,e.year),n.set(`hour`,e.hour),n.set(`min`,e.minute),n.set(`sec`,e.second===``?`0`:e.second),e.selectedPlace&&(n.set(`place`,c(e.selectedPlace)),n.set(`lat`,String(e.selectedPlace.latitude)),n.set(`lng`,String(e.selectedPlace.longitude)),n.set(`tz`,e.selectedPlace.timezone)),t===`en`&&n.set(`lang`,`en`),n}function u(e,t,n=`hi`){let i=new URL(r.kundli,e);return i.search=l(t,n).toString(),i.toString()}var d=(e,t)=>e.querySelector(t);function f(n,r=`hi`){t(r),s.selectedPlace=null,s.lastResults=[],s.lastSearch={at:0,query:``},n.innerHTML=`
    <div class="pw-card" role="region" aria-label="${e(`kw.title`)}">
      <div class="pw-head">
        <div class="pw-title">${e(`kw.title`)}</div>
        <div class="pw-sub">${e(`form.heading`)}</div>
      </div>
      <form id="kw-form" class="kw-form" novalidate>
        <div class="kw-field">
          <label class="kw-label" for="kw-name">${e(`form.name`)}</label>
          <input class="kw-input" id="kw-name" type="text" autocomplete="name" placeholder="${e(`form.namePh`)}" />
        </div>

        <fieldset class="kw-field kw-fieldset">
          <legend class="kw-label">${e(`form.gender`)}</legend>
          <div class="kw-gender">
            <label><input type="radio" name="kw-gender" value="male" /><span>${e(`gender.male`)}</span></label>
            <label><input type="radio" name="kw-gender" value="female" /><span>${e(`gender.female`)}</span></label>
            <label><input type="radio" name="kw-gender" value="other" /><span>${e(`gender.other`)}</span></label>
          </div>
          <p class="kw-err" id="kw-err-gender" aria-live="polite"></p>
        </fieldset>

        <div class="kw-field">
          <span class="kw-label">${e(`form.dob`)}</span>
          <div class="kw-row3">
            <div class="kw-mini">
              <label class="kw-mini-label" for="kw-day">${e(`date.day`)}</label>
              <input class="kw-input" id="kw-day" type="number" inputmode="numeric" min="1" max="31" placeholder="1–31" />
            </div>
            <div class="kw-mini">
              <label class="kw-mini-label" for="kw-month">${e(`date.month`)}</label>
              <input class="kw-input" id="kw-month" type="number" inputmode="numeric" min="1" max="12" placeholder="1–12" />
            </div>
            <div class="kw-mini">
              <label class="kw-mini-label" for="kw-year">${e(`date.year`)}</label>
              <input class="kw-input" id="kw-year" type="number" inputmode="numeric" min="1800" max="2400" placeholder="1990" />
            </div>
          </div>
          <p class="kw-err" id="kw-err-date" aria-live="polite"></p>
        </div>

        <div class="kw-field">
          <span class="kw-label">${e(`form.tob`)} <span class="kw-note-inline">${e(`form.tobNote`)}</span></span>
          <div class="kw-row3">
            <div class="kw-mini">
              <label class="kw-mini-label" for="kw-hour">${e(`time.hour`)}</label>
              <input class="kw-input" id="kw-hour" type="number" inputmode="numeric" min="0" max="23" placeholder="0–23" />
            </div>
            <div class="kw-mini">
              <label class="kw-mini-label" for="kw-minute">${e(`time.minute`)}</label>
              <input class="kw-input" id="kw-minute" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" />
            </div>
            <div class="kw-mini">
              <label class="kw-mini-label" for="kw-second">${e(`time.second`)}</label>
              <input class="kw-input" id="kw-second" type="number" inputmode="numeric" min="0" max="59" placeholder="0–59" value="0" />
            </div>
          </div>
          <p class="kw-err" id="kw-err-time" aria-live="polite"></p>
        </div>

        <div class="kw-field">
          <label class="kw-label" for="kw-place">${e(`form.place`)}</label>
          <div class="kw-search">
            <input class="kw-input" id="kw-place" type="text" placeholder="${e(`form.placePh`)}" />
            <button id="kw-search-btn" class="kw-search-btn" type="button">${e(`form.search`)}</button>
          </div>
          <p class="kw-note" id="kw-search-note" hidden></p>
          <div id="kw-results" class="kw-results" hidden></div>
          <p class="kw-ok" id="kw-place-confirm" hidden></p>
          <p class="kw-err" id="kw-err-place" aria-live="polite"></p>
        </div>

        <button class="pw-btn kw-submit" type="submit" id="kw-submit">${e(`btn.get`)}</button>
        <p class="kw-ok" id="kw-open-note" hidden></p>
        <p class="kw-credit">Geocoding by <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo.com</a></p>
      </form>
    </div>`,m(n)}function p(e,t){e.querySelectorAll(`.kw-err`).forEach(e=>{e.textContent=``}),e.querySelectorAll(`.kw-field.has-error`).forEach(e=>e.classList.remove(`has-error`)),Object.entries(t).forEach(([t,n])=>{let r=e.querySelector(`#kw-err-${t}`);if(!r)return;r.textContent=n;let i=r.closest(`.kw-field`);i&&i.classList.add(`has-error`)})}function m(t){let r=d(t,`#kw-form`),o=d(t,`#kw-search-btn`),l=d(t,`#kw-search-note`),f=d(t,`#kw-place`),m=d(t,`#kw-results`),h=d(t,`#kw-place-confirm`),g=d(t,`#kw-open-note`),_=t=>{l.hidden=!t,l.textContent=t?e(t):``},v=()=>{if(h.hidden=!s.selectedPlace,s.selectedPlace){let t=s.selectedPlace;h.textContent=`✔ ${e(`search.selected`)}: ${c(t)} · ${t.latitude}, ${t.longitude} · ${t.timezone}`}},y=()=>{m.replaceChildren(),m.hidden=s.lastResults.length===0,s.lastResults.forEach(e=>{let t=document.createElement(`button`);t.type=`button`,t.className=`kw-result`+(e===s.selectedPlace?` selected`:``),t.textContent=c(e),t.addEventListener(`click`,()=>{s.selectedPlace=e,_(null),v(),y(),m.hidden=!0}),m.append(t)})};async function b(){let e=f.value.trim();if(!e){_(`search.enterName`);return}let t=Date.now();if(!(e===s.lastSearch.query&&t-s.lastSearch.at<300)){s.lastSearch={at:t,query:e},o.disabled=!0,_(`search.busy`);try{s.lastResults=await i(e,8),s.lastResults.length===0?(m.hidden=!0,_(`search.none`)):(_(null),y())}catch(e){console.error(e),m.hidden=!0,_(`panchang.errPlace`)}finally{o.disabled=!1}}}o.addEventListener(`click`,b),f.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),b())}),f.addEventListener(`input`,()=>{s.selectedPlace&&(s.selectedPlace=null,v())}),r.addEventListener(`submit`,r=>{r.preventDefault(),g.hidden=!0;let i={name:d(t,`#kw-name`).value.trim(),gender:t.querySelector(`input[name="kw-gender"]:checked`)?.value??``,day:d(t,`#kw-day`).value.trim(),month:d(t,`#kw-month`).value.trim(),year:d(t,`#kw-year`).value.trim(),hour:d(t,`#kw-hour`).value.trim(),minute:d(t,`#kw-minute`).value.trim(),second:d(t,`#kw-second`).value.trim(),offset:``,place:f.value.trim(),selectedPlace:s.selectedPlace,manual:{lat:``,lon:``,tz:``}},o=a(i,{placeSelectKey:`kw.errPlacePick`});p(t,o),!(Object.keys(o).length>0)&&(g.hidden=!1,g.textContent=e(`kw.opening`),window.open(u(window.location.href,i,n()),`_blank`,`noopener`))})}if(typeof document<`u`){let e=document.getElementById(`widget`);if(e){let t=new URLSearchParams(window.location.search);t.get(`transparent`)===`1`&&document.body.classList.add(`pw-transparent`),o(),f(e,t.get(`lang`)===`en`?`en`:`hi`)}}