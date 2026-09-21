(() => {
const S=window.AISB_SESSIONS||[];
const stages=["Main Stage","Auditorium Stage","Panel Stage","Demo Room","Workshop Room A","Workshop Room B","Sponsor Rooms"];
const startBase=9*60+20,endBase=19*60+30,px=2.35;
const store={
  fav:new Set(JSON.parse(localStorage.getItem('aisb26-favs')||'[]')),
  selected:new Set(JSON.parse(localStorage.getItem('aisb26-selected')||'[]'))
};
let state={day:22,relevant:false,suggested:false,myAgenda:false,favorites:false};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const clean=t=>t.replace(/^(Keynote|Demo|Panel|Workshop|Use Case|Fireside Chat|Fireside|Debate)\s*\d*\s*[-—:]\s*/i,'');
const tier=s=>s.score>=80?'MUST':s.score>=65?'MUY ALTA':s.score>=50?'ALTA':'CONTEXTO';
function save(){localStorage.setItem('aisb26-favs',JSON.stringify([...store.fav]));localStorage.setItem('aisb26-selected',JSON.stringify([...store.selected]));}
function overlaps(a,b){return a.day===b.day && a.id!==b.id && a.startMin<b.endMin && b.startMin<a.endMin}
function conflicts(s){return S.filter(x=>overlaps(s,x)).sort((a,b)=>b.score-a.score||a.startMin-b.startMin)}
function filtered(){const q=$('#search').value.trim().toLowerCase(), st=$('#stage').value;return S.filter(s=>s.day===state.day&&(!st||s.stage===st)&&(!state.relevant||s.score>=65)&&(!state.suggested||s.route)&&(!state.myAgenda||store.selected.has(s.id))&&(!state.favorites||store.fav.has(s.id))&&(!q||[s.title,s.speakers,s.track,s.type,s.stage].join(' ').toLowerCase().includes(q)))}
function topPicks(F){return [...F].sort((a,b)=>b.score-a.score||a.startMin-b.startMin).slice(0,5)}
function nowParts(){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());const o={};parts.forEach(p=>o[p.type]=p.value);return {day:+o.day,month:+o.month,min:+o.hour*60 + +o.minute}}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1700)}
function render(){
  $$('.day').forEach(x=>x.classList.toggle('active',+x.dataset.day===state.day));
  $('#relevantBtn').classList.toggle('active',state.relevant);$('#suggestedBtn').classList.toggle('active',state.suggested);$('#myAgendaBtn').classList.toggle('active',state.myAgenda);$('#favBtn').classList.toggle('active',state.favorites);
  const F=filtered();$('#count').textContent=`${F.length} sesiones · ${store.selected.size} en tu agenda · ${store.fav.size} favoritas`;
  $('#topPicks').innerHTML=topPicks(F).map((s,i)=>`<button class="pick" data-open="${s.id}"><div class="pick-rank">#${i+1} · ${tier(s)}</div><div class="pick-title">${esc(clean(s.title))}</div><div class="pick-meta">${s.start} · ${esc(s.stage)} · prioridad ${s.overlapRank}/${s.overlapCount}</div></button>`).join('');
  renderBoard(F);renderMobile(F); bindOpen(); updateLivePill();
}
function renderBoard(F){
 const H=(endBase-startBase)*px;let head=`<div>Hora</div>`+stages.map(s=>`<div>${esc(s)}</div>`).join('');let html=`<div class="board-head">${head}</div><div class="timeline" style="height:${H}px"><div class="timecol" style="height:${H}px">`;
 for(let m=startBase;m<=endBase;m+=10){let major=m%30===0,hh=String(Math.floor(m/60)).padStart(2,'0'),mm=String(m%60).padStart(2,'0');html+=`<div class="tick ${major?'major':''}" style="top:${(m-startBase)*px}px">${major?hh+':'+mm:''}</div>`} html+='</div>';
 stages.forEach((st,idx)=>{html+=`<div class="stagecol" style="grid-column:${idx+2};height:${H}px">`;for(let m=startBase;m<=endBase;m+=10)html+=`<div class="gridline ${m%30===0?'major':''}" style="top:${(m-startBase)*px}px"></div>`;F.filter(s=>s.stage===st).forEach(s=>{const y=(s.startMin-startBase)*px,h=Math.max(26,(s.endMin-s.startMin)*px-3);html+=`<button class="session ${s.route?'suggested':''} ${store.selected.has(s.id)?'selected':''} ${store.fav.has(s.id)?'favorite':''}" data-tier="${s.tier}" data-open="${s.id}" style="top:${y}px;height:${h}px"><div class="s-time">${s.start}–${s.end}</div><div class="s-title">${esc(clean(s.title))}</div><div class="s-rank">#${s.overlapRank}/${s.overlapCount} solapadas</div></button>`});html+='</div>'});html+='</div>';$('#board').innerHTML=html;
}
function renderMobile(F){
 const starts=[...new Set(F.map(s=>s.start))].sort(); if(!F.length){$('#mobileList').innerHTML='<div class="empty">No hay sesiones con estos filtros.</div>';return}
 $('#mobileList').innerHTML=starts.map(t=>{const items=F.filter(s=>s.start===t).sort((a,b)=>b.score-a.score);return `<section class="time-group" data-time="${t}"><h3>${t}</h3>${items.map((s,i)=>`<details class="mobile-card"><summary><div class="m-top"><div class="badges"><span class="badge rank">#${i+1}/${items.length}</span><span class="badge">${esc(s.stage)}</span>${store.selected.has(s.id)?'<span class="badge sel">✓ Mi agenda</span>':''}</div><span>${store.fav.has(s.id)?'★':''}</span></div><div class="m-title">${esc(clean(s.title))}</div><div class="m-meta">${s.start}–${s.end} · ${esc(s.track||s.type)} · ${tier(s)}</div></summary><div class="m-body"><b>Ponentes:</b> ${esc(s.speakers||'No indicado')}<br><br><b>Por qué te puede interesar:</b> ${esc(s.why)}<br><br><button class="control" data-open="${s.id}">Ver ficha y conflictos</button></div></details>`).join('')}</section>`}).join('');
}
function openDrawer(id){
 const s=S.find(x=>x.id===id);if(!s)return;const cs=conflicts(s);const pool=[s,...cs].sort((a,b)=>b.score-a.score||a.startMin-b.startMin);const pos=pool.findIndex(x=>x.id===s.id)+1;
 $('#drawerContent').innerHTML=`<div class="drawer-inner"><button class="close" id="closeDrawer">×</button><div class="overline">${s.start}–${s.end} · ${esc(s.stage)}</div><h2>${esc(s.title)}</h2><div class="badges"><span class="badge">${esc(s.type)}</span>${s.track?`<span class="badge">${esc(s.track)}</span>`:''}<span class="badge">${tier(s)}</span>${s.route?'<span class="badge">◇ Ruta sugerida</span>':''}</div><div class="rankbox"><strong>#${pos} de ${pool.length}</strong> por afinidad entre las sesiones que se solapan con esta.</div><h3>Por qué la marco</h3><p>${esc(s.why)}</p><h3>Ponentes</h3><p>${esc(s.speakers||'No indicado')}</p><h3>Sesiones que compiten con esta</h3><div class="conflictbox">${cs.length?cs.slice(0,10).map((x,i)=>`<div>${i+1}. <b>${esc(clean(x.title))}</b><br><span style="color:#8f8b98">${x.start}–${x.end} · ${esc(x.stage)}</span></div>`).join('<br>'):'No hay solapes directos.'}</div><h3>Descripción y fuente</h3><p>La ficha oficial contiene la descripción completa y el roster final. Aquí se mantiene la metadata, el análisis de relevancia y los conflictos para decidir rápido.</p><div class="actionrow"><button id="selectSession" class="${store.selected.has(s.id)?'selected-btn':''}">${store.selected.has(s.id)?'✓ En mi agenda':'+ Añadir a mi agenda'}</button><button id="favSession">${store.fav.has(s.id)?'★ Favorita':'☆ Favorita'}</button><button id="copyTitle">Copiar título</button><a class="primary" href="https://aisummitbarcelona.com/schedule" target="_blank" rel="noopener">Descripción oficial ↗</a></div><div class="source-note">Ranking personalizado para decidir entre empalmes. No es un ranking oficial del evento.</div></div>`;
 $('#drawer').classList.add('open');$('#scrim').classList.add('open');$('#drawer').setAttribute('aria-hidden','false');
 $('#closeDrawer').onclick=closeDrawer;$('#favSession').onclick=()=>{store.fav.has(s.id)?store.fav.delete(s.id):store.fav.add(s.id);save();render();openDrawer(s.id)};$('#selectSession').onclick=()=>toggleSelect(s);$('#copyTitle').onclick=async()=>{try{await navigator.clipboard.writeText(s.title);toast('Título copiado')}catch{toast('No se pudo copiar')}};
}
function toggleSelect(s){
 if(store.selected.has(s.id)){store.selected.delete(s.id);save();render();openDrawer(s.id);toast('Quitada de tu agenda');return}
 const clashes=S.filter(x=>store.selected.has(x.id)&&overlaps(s,x));
 if(clashes.length){const msg='Se solapa con: '+clashes.map(x=>`${x.start} ${clean(x.title)}`).join(', ')+'. ¿Añadir de todos modos?';if(!confirm(msg))return}
 store.selected.add(s.id);save();render();openDrawer(s.id);toast('Añadida a tu agenda');
}
function closeDrawer(){$('#drawer').classList.remove('open');$('#scrim').classList.remove('open');$('#drawer').setAttribute('aria-hidden','true')}
function bindOpen(){document.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openDrawer(+el.dataset.open)}))}
function goNow(){const n=nowParts();if(n.month!==9||![22,23].includes(n.day)){toast('El modo Ahora se activa durante el evento');return}state.day=n.day;render();const candidates=S.filter(s=>s.day===n.day&&s.startMin<=n.min&&n.min<s.endMin).sort((a,b)=>b.score-a.score);if(candidates[0]){openDrawer(candidates[0].id);toast(`Ahora: ${candidates.length} sesiones activas`)}else{const next=S.filter(s=>s.day===n.day&&s.startMin>=n.min).sort((a,b)=>a.startMin-b.startMin)[0];if(next){openDrawer(next.id);toast('Te muestro la siguiente sesión')}}}
function updateLivePill(){const n=nowParts();const active=n.month===9&&[22,23].includes(n.day);$('#livePill').textContent=active?'● EVENTO EN CURSO':'BARCELONA · CEST';$('#livePill').style.color=active?'var(--lime)':''}
$$('.day').forEach(b=>b.onclick=()=>{state.day=+b.dataset.day;render()});$('#search').oninput=render;$('#stage').onchange=render;$('#relevantBtn').onclick=()=>{state.relevant=!state.relevant;render()};$('#suggestedBtn').onclick=()=>{state.suggested=!state.suggested;render()};$('#myAgendaBtn').onclick=()=>{state.myAgenda=!state.myAgenda;render()};$('#favBtn').onclick=()=>{state.favorites=!state.favorites;render()};$('#nowBtn').onclick=goNow;$('#scrim').onclick=closeDrawer;document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
$('#stage').innerHTML='<option value="">Todos los stages</option>'+stages.map(x=>`<option>${x}</option>`).join('');
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
})();
