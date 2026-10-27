const $=s=>document.querySelector(s);
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2000)};

/* ---------- DATA / MODEL ---------- */
let S=store.get('profile',{people:4,sh:1,shm:8,shh:12,wc:9,ld:6,wm:90,ae:0,ga:30,gd:5,ir:1,lk:2,rt:0,tf:20});
const FIELDS=[
 ['people','Household members','r',1,12,1,''],['sh','Showers per person / day','r',0,3,.5,''],
 ['shm','Shower length','r',1,20,1,' min'],['shh','Shower head','s',[[12,'Standard'],[7,'Low-flow']]],
 ['wc','Toilet type','s',[[9,'Old (9 L)'],[6,'Standard (6 L)'],[4,'Dual-flush (4 L)']]],
 ['ld','Laundry loads / week','r',0,21,1,''],['wm','Washing machine','s',[[90,'Top-load'],[45,'Front-load']]],
 ['ae','Tap aerators fitted','s',[[0,'No'],[1,'Yes']]],['ga','Garden area','r',0,200,5,' m²'],
 ['gd','Watering days / week','r',0,7,1,''],['ir','Irrigation method','s',[[1,'Hose'],[.8,'Sprinkler'],[.5,'Drip']]],
 ['lk','Dripping taps','r',0,6,1,''],['rt','Running toilet','s',[[0,'No'],[1,'Yes']]],['tf','Water tariff','r',5,60,1,' ₹/kL']];
const COL={Shower:'#0a7ea4',Toilet:'#12b3a8',Kitchen:'#f2a93b',Laundry:'#7b61ff',Garden:'#1f9d6b',Leaks:'#e0524d'};
function model(s){const p=s.people,o={Shower:p*s.sh*s.shm*s.shh,Toilet:p*5*s.wc,Kitchen:p*(s.ae?22:30),Laundry:s.ld*s.wm/7,Garden:s.ga*4*s.ir*s.gd/7,Leaks:s.lk*20+s.rt*200};o.total=Object.values(o).reduce((a,b)=>a+b,0);return o}
const ACTIONS=[
 ['Fix running toilet flapper',150,s=>s.rt,{rt:0},'A silent leak can waste ~200 L/day.'],
 ['Repair dripping taps',200,s=>s.lk>0,{lk:0},'Each drip wastes ~20 L/day.'],
 ['Install low-flow shower head',600,s=>s.shh>7,{shh:7},'Cuts flow from 12 to 7 L/min.'],
 ['Fit dual-flush cistern',3500,s=>s.wc>4,{wc:4},'Only ~4 L per flush.'],
 ['Add tap aerators',300,s=>!s.ae,{ae:1},'About 25% less tap water.'],
 ['Switch garden to drip irrigation',2500,s=>s.ir>.5&&s.ga>0,{ir:.5},'Water reaches roots, less evaporation.'],
 ['Water garden 3 days a week',0,s=>s.gd>3&&s.ga>0,{gd:3},'Deep, less frequent watering is enough.'],
 ['Run only full washer loads',0,s=>s.ld>4,{ld:4},'Combine small loads.'],
 ['Shorten showers to 5 minutes',0,s=>s.shm>5,{shm:5},'Free behaviour change.']];
function recommend(s,m){return ACTIONS.filter(a=>a[2](s)).map(a=>{const sv=m.total-model({...s,...a[3]}).total,yr=sv*365/1000*s.tf;return{n:a[0],cost:a[1],why:a[4],sv,yr,pay:a[1]?a[1]/Math.max(yr,1)*12:0}}).filter(r=>r.sv>.5).sort((a,b)=>a.pay-b.pay||b.sv-a.sv)}
const scoreOf=pc=>Math.max(0,Math.min(100,Math.round(100-(pc-60)*100/190)));

/* ---------- VIEWS ---------- */
const V={};
V.home=()=>({html:`
<section class="hero2"><span class="bub" style="left:6%;--s:18px;--d:9s"></span><span class="bub" style="left:30%;--s:10px;--d:7s"></span><span class="bub" style="left:52%;--s:24px;--d:11s"></span><span class="bub" style="left:78%;--s:14px;--d:8s"></span>
 <div class="hero-txt"><span class="pill">🌍 Supports UN SDG 6 · Clean Water</span><h1>Every drop counts.<br>Make your home <em>water-smart.</em></h1>
 <p>AquaSave analyses your household, finds hidden waste and ranks the smartest fixes by how fast they pay back.</p>
 <div class="row"><a class="btn big" style="background:#fff;color:#065a78" href="#/assess">Start free assessment →</a><a class="btn ghost big" href="#/leak">Check for a leak</a></div></div>
 <img class="hero-img" src="images/hero.svg" alt="House saving water with rain and a water drop">
 <svg class="waves" viewBox="0 0 1200 80" preserveAspectRatio="none"><path class="w1" d="M0 40Q150 0 300 40T600 40T900 40T1200 40V80H0Z"/><path class="w2" d="M0 50Q150 20 300 50T600 50T900 50T1200 50V80H0Z"/></svg></section>
<div class="stats"><div><b>135 L</b><span>daily norm per person</span></div><div><b>200 L</b><span>wasted daily by a running toilet</span></div><div><b>20 L</b><span>lost daily per dripping tap</span></div><div><b>6</b><span>smart checks in one app</span></div></div>
<section class="why"><img src="images/tap.svg" alt="Dripping tap wasting water"><div><h2>Small leaks. Big losses.</h2>
 <p>Most households have no idea where their water goes. A silent leak or an old fixture can waste hundreds of litres every day, and you pay for every drop.</p>
 <ul><li>💸 Cut your water bill with the fixes that pay back fastest</li><li>🌱 Protect a shared, limited resource</li><li>📱 Works on any phone, even offline</li></ul><a class="btn" href="#/assess">Find my hidden waste</a></div></section>
<h2 class="sec">Everything you need</h2>
<div class="grid g4">
 <a class="card feat" href="#/assess"><div class="tile t1">📊</div><h3>Assess</h3><p>Usage breakdown, water score and ranked actions.</p></a>
 <a class="card feat" href="#/leak"><div class="tile t2">🔍</div><h3>Leak detector</h3><p>Use your meter to spot hidden leaks.</p></a>
 <a class="card feat" href="#/learn"><div class="tile t3">💡</div><h3>Learn</h3><p>Practical tips for home, garden and kitchen.</p></a>
 <a class="card feat" href="#/history"><div class="tile t4">🕑</div><h3>History</h3><p>Track your progress over time.</p></a></div>
<h2 class="sec">How it works</h2>
<div class="grid g3">
 <div class="card step"><b>1</b><h3>Describe your home</h3><p>Fixtures, habits and garden in under a minute.</p></div>
 <div class="card step"><b>2</b><h3>Engine analyses</h3><p>Estimates litres per activity and finds waste.</p></div>
 <div class="card step"><b>3</b><h3>Act and save</h3><p>Follow ranked recommendations and track results.</p></div></div>
<section class="cta"><h2>Ready to save water?</h2><p>Free, private and works offline. Your data stays on your device.</p><a class="btn big" style="background:#fff;color:#065a78" href="#/assess">Get started now</a></section>`});

V.assess=()=>({html:`<h2 style="margin-top:0">Water Assessment</h2><div class="grid g2">
<div class="card" id="form"><h3>Your household</h3></div><div id="res"></div></div>`,init(){
 $('#form').insertAdjacentHTML('beforeend',FIELDS.map(f=>f[2]=='r'
  ?`<div class="field"><div class="l">${f[1]}<span id="v_${f[0]}">${S[f[0]]}${f[6]}</span></div><input type="range" data-k="${f[0]}" min="${f[3]}" max="${f[4]}" step="${f[5]}" value="${S[f[0]]}"></div>`
  :`<div class="field"><div class="l">${f[1]}</div><select data-k="${f[0]}">${f[3].map(o=>`<option value="${o[0]}" ${S[f[0]]==o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>`).join(''));
 $('#form').addEventListener('input',e=>{const k=e.target.dataset.k;if(!k)return;S[k]=+e.target.value;store.set('profile',S);const f=FIELDS.find(x=>x[0]==k);if(f[2]=='r')$('#v_'+k).textContent=S[k]+f[6];results()});
 results()}});

function results(){
 const m=model(S),pc=m.total/S.people,sc=scoreOf(pc),recs=recommend(S,m),pot=Math.min(recs.reduce((a,r)=>a+r.sv,0),m.total*.9),keys=Object.keys(COL);
 let off=0;const C=2*Math.PI*40,arcs=keys.map(k=>{const l=m[k]/m.total*C,s=`<circle cx="60" cy="60" r="40" fill="none" stroke="${COL[k]}" stroke-width="18" stroke-dasharray="${l} ${C-l}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>`;off+=l;return s}).join('');
 $('#res').innerHTML=`<div class="kpis">
  <div class="k"><b style="color:${sc>60?'var(--good)':sc>35?'#f2a93b':'var(--bad)'}">${sc}/100</b><span>Water score</span></div>
  <div class="k"><b>${Math.round(pc)} L</b><span>Per person / day (norm 135)</span></div>
  <div class="k"><b>₹${Math.round(m.total*30/1000*S.tf)}</b><span>Est. monthly bill</span></div>
  <div class="k"><b style="color:var(--good)">${Math.round(pot)} L</b><span>Saving possible / day</span></div></div>
 <div class="card score"><svg class="donut" viewBox="0 0 120 120">${arcs}<text x="60" y="58" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">${Math.round(m.total)}</text><text x="60" y="72" text-anchor="middle" font-size="8" fill="currentColor">L / day</text></svg>
 <div class="leg">${keys.map(k=>`<div><i style="background:${COL[k]}"></i>${k}: ${Math.round(m[k])} L</div>`).join('')}</div></div>
 <div class="card" style="margin-top:16px"><h3>Recommendations</h3>${recs.length?recs.map((r,i)=>`<div class="rec"><div class="rank">${i+1}</div><div><b>${r.n}</b><br><span class="tag">−${Math.round(r.sv)} L/day</span><span class="tag b">₹${Math.round(r.yr)}/yr</span><br><small>${r.cost?`Cost ~₹${r.cost} · payback ${r.pay<1?'under 1 month':r.pay.toFixed(1)+' months'}`:'Free'} · ${r.why}</small></div></div>`).join(''):'<p>Excellent! No major savings found.</p>'}
 <button class="btn" style="margin-top:12px;width:100%" onclick="saveHist()">💾 Save this assessment</button></div>`}
function saveHist(){const m=model(S),h=store.get('hist',[]);h.unshift({d:Date.now(),t:Math.round(m.total),pc:Math.round(m.total/S.people),sc:scoreOf(m.total/S.people)});store.set('hist',h.slice(0,30));toast('Saved to History ✔')}

V.leak=()=>({html:`<h2 style="margin-top:0">Leak Detector</h2><div class="grid g2"><div class="card"><h3>Meter test</h3>
<p>Turn off every tap and appliance. Note the meter reading, wait 1+ hours, note it again.</p>
<div class="field"><div class="l">Reading before (litres)</div><input type="number" id="a" value="12000"></div>
<div class="field"><div class="l">Reading after (litres)</div><input type="number" id="b" value="12000"></div>
<div class="field"><div class="l">Hours between</div><input type="number" id="h" value="2" min=".5" step=".5"></div></div>
<div class="card" id="lres"></div></div>
<div class="card" style="margin-top:16px"><h3>Toilet dye test</h3><p>Add a few drops of food colouring to the cistern. If colour shows in the bowl within 15 minutes without flushing, the flapper is leaking.</p></div>`,init(){
 const run=()=>{const a=+$('#a').value,b=+$('#b').value,h=+$('#h').value||1,r=Math.max(0,(b-a)/h),d=r*24,cost=d*30/1000*S.tf;
  $('#lres').innerHTML=`<h3>Result</h3><div class="kpis"><div class="k"><b>${r.toFixed(1)} L/h</b><span>Flow with all taps off</span></div><div class="k"><b>${Math.round(d)} L</b><span>Wasted per day</span></div></div>
  <div class="alert ${r<.5?'ok':'bad'}">${r<.5?'✅ No leak detected.':r<5?'⚠ Small leak likely (dripping tap or toilet).':'🚨 Major leak! Check pipes and call a plumber.'}</div>
  <p class="mu" style="margin-top:10px">${r>=.5?`Costs about ₹${Math.round(cost)} per month.`:''}</p>`};
 ['a','b','h'].forEach(i=>$('#'+i).addEventListener('input',run));run()}});

const TIPS=[['Bathroom','🚿','Take 5-minute showers','Cut 2 min and save about 24 L per shower.'],['Bathroom','🚽','Test for toilet leaks','Dye test monthly to catch silent leaks.'],['Kitchen','🚰','Fit tap aerators','Reduces flow without hurting pressure.'],['Kitchen','🥦','Wash veggies in a bowl','Reuse that water for plants.'],['Laundry','🧺','Wash full loads only','Half loads waste the same water.'],['Garden','🌱','Use drip irrigation','Up to half the water of a hose.'],['Garden','🌅','Water early morning','Less evaporation in cool hours.'],['Garden','🪣','Harvest rainwater','Store monsoon rain in barrels or tanks.'],['Kitchen','♻️','Reuse RO reject water','Use for mopping or cleaning.']];
V.learn=()=>({html:`<h2 style="margin-top:0">Water-Saving Tips</h2><div class="chips" id="chips">${['All','Bathroom','Kitchen','Laundry','Garden'].map((c,i)=>`<button class="chip ${i?'':'on'}">${c}</button>`).join('')}</div><div class="grid g3" id="tips"></div>`,init(){
 const draw=c=>$('#tips').innerHTML=TIPS.filter(t=>c=='All'||t[0]==c).map(t=>`<div class="card"><div style="font-size:1.8rem">${t[1]}</div><h3>${t[2]}</h3><p>${t[3]}</p></div>`).join('');
 $('#chips').onclick=e=>{if(e.target.classList.contains('chip')){document.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));e.target.classList.add('on');draw(e.target.textContent)}};draw('All')}});

V.history=()=>{const h=store.get('hist',[]),mx=Math.max(...h.map(x=>x.pc),135);return{html:`<h2 style="margin-top:0">History</h2>${h.length?`<div class="card"><h3>Litres per person / day</h3>
<svg viewBox="0 0 300 100" style="width:100%">${h.slice(0,12).reverse().map((x,i,a)=>{const w=300/a.length,ht=x.pc/mx*80;return`<rect x="${i*w+4}" y="${90-ht}" width="${w-8}" height="${ht}" rx="4" fill="${x.pc>135?'#e0524d':'#12b3a8'}"/>`}).join('')}</svg></div>
<div class="card" style="margin-top:16px">${h.map(x=>`<div class="hist"><span>${new Date(x.d).toLocaleDateString()}</span><span>${x.pc} L/person · score ${x.sc}</span></div>`).join('')}<button class="btn red small" style="margin-top:12px" onclick="store.set('hist',[]);route()">Clear history</button></div>`
 :`<div class="card"><p>No saved assessments yet. Run an <a href="#/assess" style="color:var(--main);font-weight:700">assessment</a> and tap Save.</p></div>`}`}};

V.about=()=>({html:`<h2 style="margin-top:0">About AquaSave</h2><div class="card"><p><b>Problem:</b> Households often do not know where their water goes, so waste stays hidden.</p><br><p><b>Solution:</b> A rule-based recommendation engine estimates usage per activity, scores it against the 135 L/person/day norm, and ranks actions by payback.</p><br><p><b>Tech:</b> HTML, CSS, JavaScript (SPA with hash routing), SVG charts, localStorage, PWA (manifest + service worker).</p><br><p><b>Aligned with:</b> UN SDG 6 – Clean Water and Sanitation.</p><br><p><b>Built by:</b> Your Name · Your College · Guide: Teacher Name</p></div>`});

/* ---------- ROUTER ---------- */
function route(){const k=(location.hash.replace('#/','')||'home');const v=(V[k]||V.home)();$('#view').innerHTML=v.html;v.init&&v.init();
 document.querySelectorAll('.links a,.tabs a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')=='#/'+k));window.scrollTo(0,0)}
addEventListener('hashchange',route);route();

/* ---------- PWA ---------- */
let dp;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e;$('#install').hidden=false});
$('#install').onclick=async()=>{if(dp){dp.prompt();dp=null;$('#install').hidden=true}};
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js');
