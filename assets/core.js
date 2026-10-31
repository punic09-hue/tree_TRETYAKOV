/* Движок родословного сайта (общий для любых деревьев). Только чтение — загрузки фото с сайта нет. */
(function(){
const PL={};(window.TREE_PLACES||[]).forEach(x=>PL[x.id]=x);
const C=window.TREE_CONFIG, LIST=window.TREE_PERSONS, FAM=window.TREE_FAMILIES||[], SRC=window.TREE_SOURCES||[], MS=window.TREE_MILESTONES||[];
const RES=window.TREE_RESEARCH||{};
/* сведения исследования накладываются на выгрузку GEDKeeper по № персоны */
LIST.forEach(p=>{const r=p.num&&RES[p.num];if(r)for(const k in r){if(r[k]!==''&&r[k]!=null&&!(Array.isArray(r[k])&&!r[k].length)&&(p[k]===undefined||p[k]===''||(Array.isArray(p[k])&&!p[k].length)))p[k]=r[k];}});
const P={}; LIST.forEach(p=>P[p.id]=p);
const BYNUM={}; LIST.forEach(p=>{if(p.num)BYNUM[p.num]=p;});
const byKey=k=>P[k]||BYNUM[k];
C.root=(byKey(C.rootNum||C.root)||LIST[0]||{}).id; C.focus=(byKey(C.focusNum||C.focus)||{}).id;
const kidsOf=id=>LIST.filter(p=>p.father===id||p.mother===id).sort((a,b)=>(yr(a.b)||9999)-(yr(b.b)||9999));
const yr=s=>{const m=/(\d{4})/.exec(s||'');return m?+m[1]:'';};
const life=p=>(yr(p.b)||'?')+' — '+(yr(p.d)||'?');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е');
/* все адреса в тексте → гиперссылки */
const linkify=s=>esc(s).replace(/(https?:\/\/[^\s;,)<]+[^\s;,.)<])/g,'<a href="$1" target="_blank" rel="noopener">$1</a>')
  .replace(/(^|[\s(])((?:www\.)?[a-z0-9-]+\.(?:ru|org|com|info|рф)(?:\/[^\s;,)<]*)?)/gi,(m,a,u)=>/^https?:/.test(u)?m:`${a}<a href="https://${u}" target="_blank" rel="noopener">${u}</a>`);
const PH='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#d9dfe8"/><circle cx="20" cy="15" r="7" fill="#aab6c6"/><path d="M6 38c2-9 8-13 14-13s12 4 14 13" fill="#aab6c6"/></svg>');
const initials=n=>{const t=n.replace(/[()]/g,'').split(/\s+/).filter(Boolean);return t[0]+' '+t.slice(1,3).map(x=>x[0]).join('');};
const photo=p=>p.num?('photos/'+encodeURIComponent(p.num+'_'+initials(p.name)+'.jpg')):PH;
const img=(p,c)=>`<img class="${c}" src="${photo(p)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${PH}'">`;

/* ---------- дерево ---------- */
const node=p=>p?`<span class="tree-node ${p.sex==='Ж'?'f':'m'} ${p.pri?'pri':''}" data-id="${p.id}" tabindex="0">${img(p,'tn-ph')}<span class="tn-t"><span class="name">${p.pri?'<span class="pri-star">★</span>':''}${esc(p.name)}</span><span class="dates">${life(p)}</span></span></span>`:'';
const couple=p=>`<div class="couple">${node(p)}${(p.spouses||[]).map(id=>P[id]).filter(Boolean).map(s=>'<span class="ring">⚭</span>'+node(s)).join('')}</div>`;
function desc(id,seen){const p=P[id];if(!p||seen.has(id))return'';seen.add(id);
  const k=kidsOf(id).filter(x=>x.father===id||!P[x.father]);
  return `<li>${couple(p)}${k.length?'<ul>'+k.map(x=>desc(x.id,seen)).join('')+'</ul>':''}${p.hiddenKids?`<ul><li><div class="couple"><span class="tree-node hidden-kids">🔒 потомки скрыты<br><small>родились после ${C.cutoff}</small></span></div></li></ul>`:''}</li>`;}
function anc(id,d){const p=P[id];if(!p)return'';const par=[P[p.father],P[p.mother]].filter(Boolean);
  return `<li>${node(p)}${d&&par.length?'<ul>'+par.map(x=>anc(x.id,d-1)).join('')+'</ul>':''}</li>`;}
const Tree={mode:'all',who:C.root,scale:1,
  render(){const el=document.getElementById('chart');if(!el)return;
    el.innerHTML=this.mode==='anc'?`<ul class="anc">${anc(this.who,15)}</ul>`:`<ul>${desc(this.mode==='desc'?this.who:C.root,new Set())}</ul>`;
    el.style.transform=`scale(${this.scale})`;
    const b=document.getElementById('treeMode');
    if(b){b.style.display=this.mode==='all'?'none':'flex';b.querySelector('span').innerHTML=(this.mode==='anc'?'Предки: ':'Потомки: ')+'<b>'+esc(P[this.who].name)+'</b>';}
    el.querySelectorAll('.tree-node[data-id]').forEach(n=>{n.onclick=()=>App.open(n.dataset.id);n.onmouseenter=e=>App.tip(n.dataset.id,e);n.onmouseleave=()=>App.tip(null);});
    this.center();},
  center(id){const sc=document.querySelector('.tree-scroll');if(!sc)return;const n=sc.querySelector(`.tree-node[data-id="${id||this.who||C.root}"]`)||sc.querySelector('.tree-node');if(!n)return;
    requestAnimationFrame(()=>{const a=n.getBoundingClientRect(),b=sc.getBoundingClientRect();sc.scrollLeft+=(a.left+a.width/2)-(b.left+b.width/2);});},
  zoom(d){this.scale=Math.min(2,Math.max(.3,this.scale+d*.15));this.render();},
  reset(){this.mode='all';this.who=C.root;this.render();},
  path(id){document.querySelectorAll('.on-path').forEach(n=>n.classList.remove('on-path'));let p=P[id],g=0;
    while(p&&g++<40){document.querySelectorAll(`.tree-node[data-id="${p.id}"]`).forEach(n=>n.classList.add('on-path'));p=P[p.father]||P[p.mother];}}
};

/* ---------- личная карточка: максимум сведений ---------- */
function card(id){const p=P[id];if(!p)return'<p>Персона не найдена или скрыта (родилась после '+C.cutoff+' г.).</p>';
  const f=P[p.father],m=P[p.mother],sp=(p.spouses||[]).map(x=>P[x]).filter(Boolean),kids=kidsOf(id);
  const sib=LIST.filter(x=>x.id!==id&&((p.father&&x.father===p.father)||(p.mother&&x.mother===p.mother)));
  const L=x=>`<a href="#/person/${x.id}" class="plink">${esc(x.name)}</a> <small>${life(x)}</small>`;
  const row=(k,v)=>v?`<tr><th>${k}</th><td>${v}</td></tr>`:'';
  const fam=FAM.filter(x=>x.h===id||x.w===id);
  const evs=(p.ev||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  return `<div class="card">
  <div class="card-head">${img(p,'card-ph')}<div><div class="card-gen">${esc(p.branch)}</div><h2>${p.pri?'<span class="pri-star">★</span>':''}${esc(p.name)}</h2>
    <div class="card-life">${life(p)}</div>
    <div class="chips">${p.estate?p.estate.split(';').map(s=>`<span class="chip">${esc(s.trim())}</span>`).join(''):''}${p.quality?`<span class="chip q">связь: ${esc(p.quality)}</span>`:''}</div></div></div>
  <div class="card-act"><button onclick="App.treeFor('${id}','anc')">⬆ Предки</button><button onclick="App.treeFor('${id}','desc')">⬇ Потомки</button><button onclick="App.copyLink('${id}')">🔗 Ссылка</button></div>
  <h3>Основные сведения</h3><table class="facts">
   ${row('Родился',esc(p.b)+(p.bplace?' · '+esc(p.bplace):''))}${row('Умер',esc(p.d)+(p.dplace?' · '+esc(p.dplace):''))}
   ${row('Приход',esc(p.parish))}${row('Погребение',esc(p.burial))}${row('Сословие',esc(p.estate))}
   ${row('Ветвь',esc(p.branch))}${row('Качество связи с родителями',esc(p.quality))}${row('Семья (как ребёнок)',esc(p.fam))}
   ${row('№ в базе GEDKeeper',esc(p.num))}${row('ID в исследовании',p.id)}</table>
  <h3>Семья</h3><table class="facts">
   ${row('Отец',f?L(f):'')}${row('Мать',m?L(m):'')}
   ${row('Супруг(а)',sp.map(L).join('<br>')+fam.map(x=>x.date?`<div class="muted">брак: ${esc(x.date)} (${x.id})</div>`:'').join(''))}
   ${row('Дети',kids.map(L).join('<br>')+(p.hiddenKids?`<div class="muted">🔒 ещё ${p.hiddenKids} — родились после ${C.cutoff}, не публикуются</div>`:''))}
   ${row('Братья и сёстры',sib.map(L).join('<br>'))}</table>
  ${(p.places||[]).length?`<h3>Места на карте</h3><ul class="plc-list">${p.places.map(k=>PL[k]).filter(Boolean).map(x=>`<li><a href="${x.url}" target="_blank" rel="noopener">📍 ${esc(x.name)}</a>${x.addr?`<br><small class="muted">${esc(x.addr)}${x.exact?'':' · точка по адресу (координаты не сверены)'}</small>`:''}</li>`).join('')}</ul>`:''}
  ${evs.length?`<h3>Метрические записи (${evs.length})</h3><ol class="timeline">${evs.map(e=>`<li><span class="ti">${({'рождение':'🍼','брак':'⚭','смерть':'✝'})[e.kind]||'•'}</span><b>${esc(e.kind)}</b> ${esc(e.date)}${e.fam?` · <span class="muted">${esc(e.fam)}</span>`:''}<br><small>${e.code?'📜 '+(/^ГАСО/.test(e.code)?'':'ГАСО ф.6, ')+esc(e.code)+(e.no?' №'+esc(e.no):''):esc(e.res)}${e.note?' · '+esc(e.note):''}</small></li>`).join('')}</ol>`:''}
  ${p.verbatim?`<h3>Что говорят документы (дословно)</h3><div class="card-note">${esc(p.verbatim).replace(/ ⁂ /g,'<br>⁂ ')}</div>`:''}
  ${p.note?`<h3>Примечание исследователя</h3><div class="card-note">${linkify(p.note)}</div>`:''}
  ${p.src?`<h3>Источники</h3><div class="card-src">${linkify(p.src)}</div>`:''}
  </div>`;}

const App=window.App={byKey,P,LIST,FAM,SRC,MS,C,Tree,card,img,life,esc,linkify,yr,
  open(id){location.hash='#/person/'+id;},
  show(id){const d=document.getElementById('drawer');d.innerHTML='<button class="drawer-x" onclick="App.close()" aria-label="Закрыть">✕</button>'+card(id);d.classList.add('open');d.scrollTop=0;},
  close(){document.getElementById('drawer').classList.remove('open');if(location.hash.startsWith('#/person'))history.back();},
  treeFor(id,mode){location.hash='#/tree';setTimeout(()=>{if(mode==='path'){Tree.mode='all';Tree.who=C.root;Tree.render();Tree.path(id);Tree.center(id);}else{Tree.mode=mode;Tree.who=id;Tree.render();}},80);},
  copyLink(id){const u=location.href.split('#')[0]+'#/person/'+id;try{navigator.clipboard.writeText(u);App.toast('Ссылка скопирована');}catch(e){prompt('Ссылка:',u);}},
  tip(id,e){let t=document.getElementById('tip');if(!t){t=document.createElement('div');t.id='tip';document.body.appendChild(t);}
    if(!id||matchMedia('(hover:none)').matches){t.style.display='none';return;}const p=P[id];
    t.innerHTML=img(p,'tip-ph')+`<b>${esc(p.name)}</b><br>${life(p)}${p.parish?'<br>⛪ '+esc(p.parish):''}`;t.style.display='block';
    t.style.left=Math.min(innerWidth-260,e.clientX+14)+'px';t.style.top=(e.clientY+14)+'px';},
  toast(m){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t);}t.textContent=m;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),3000);},
  search(q){q=norm(q).trim();if(q.length<2)return[];return LIST.filter(p=>norm(p.name+' '+p.b+' '+p.d+' '+p.parish+' '+p.src+' '+p.num).includes(q)).slice(0,12);},
  bindSearch(i,box){i.addEventListener('input',()=>{const r=App.search(i.value);
    box.innerHTML=r.map(p=>`<a href="#/person/${p.id}">${img(p,'s-ph')}<span>${esc(p.name)}<small>${life(p)}</small></span></a>`).join('')||(i.value.length>1?'<div class="s-empty">Ничего не найдено</div>':'');
    box.style.display=i.value.length>1?'block':'none';});box.addEventListener('click',()=>{box.style.display='none';i.value='';});},
  stats(){const by=k=>LIST.filter(k).length;return{persons:LIST.length,fams:FAM.length,gens:new Set(LIST.map(p=>p.gen)).size,pri:by(p=>p.pri),
    events:LIST.reduce((s,p)=>s+(p.ev||[]).filter(e=>e.code).length,0),src:SRC.length,pos:SRC.filter(s=>/ПОЛОЖ/.test(s.res)).length,neg:SRC.filter(s=>/ОТРИЦ/.test(s.res)).length,
    photos:by(p=>p.num),hidden:LIST.reduce((s,p)=>s+(p.hiddenKids||0),0)};},
  init(onRoute){const route=()=>{const h=location.hash.replace(/^#\//,'').split('/');
      if(h[0]==='person'&&h[1]){if(!document.querySelector('.sec.on'))onRoute('home');App.show(h[1]);return;}
      document.getElementById('drawer').classList.remove('open');onRoute(h[0]||'home');};
    addEventListener('hashchange',route);route();
    addEventListener('keydown',e=>{if(e.key==='Escape')App.close();});
    document.querySelectorAll('[data-contact]').forEach(el=>el.innerHTML=`${esc(C.contact.name)} · <a href="mailto:${C.contact.email}">${C.contact.email}</a>`);}
};
})();
