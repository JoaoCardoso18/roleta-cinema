const KEY='roleta-cinema-v2', UIKEY='roleta-ui-v1', TAU=Math.PI*2, IMG='https://image.tmdb.org/t/p/';
const $=s=>document.querySelector(s);
const uid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16);});
const isUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
function hsl2hex(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));const x=v=>Math.round(255*v).toString(16).padStart(2,'0');return '#'+x(f(0))+x(f(8))+x(f(4));}
const randColor=()=>hsl2hex(Math.floor(Math.random()*360),62,38);
const txtColor=h=>{const n=parseInt(String(h).slice(1),16);return ((n>>16)*.299+((n>>8)&255)*.587+(n&255)*.114)>150?'#111':'#fff';};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

/* ---------- Estado ---------- */
let state;
function load(){
  try{const r=localStorage.getItem(KEY);if(r){const s=JSON.parse(r);if(s&&Array.isArray(s.movies))return s;}}catch(e){}
  return {incWatched:false,key:'',movies:[]};
}
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
function save(){saveLocal();schedulePush();}
state=load();
const pool=()=>state.movies.filter(m=>state.incWatched||!m.watched);
const byId=id=>state.movies.find(m=>m.id===id);

/* ---------- Aparência (temas) ---------- */
const THEMES=[
  {id:'cinema',name:'Cinema',bg:'#0d0b0e',surface:'#17141a',fg:'#f3ece0',accent:'#c8102e',gold:'#e0b84c'},
  {id:'claro',name:'Claro',bg:'#f6f3ee',surface:'#ffffff',fg:'#1d1b18',accent:'#d62839',gold:'#d99a00'},
  {id:'neon',name:'Neon',bg:'#0a0b1a',surface:'#12142b',fg:'#e8ebff',accent:'#8b5cf6',gold:'#f5c542'},
  {id:'retro',name:'Retrô',bg:'#efe3c8',surface:'#f8efdb',fg:'#3a2a1a',accent:'#a63a2b',gold:'#b8801a'}
];
const CKEYS=[['bg','Fundo do site'],['surface','Painéis e cards'],['fg','Texto'],['accent','Botões e seta'],['gold','Aro e detalhes'],['w1','Roleta, fatia A'],['w2','Roleta, fatia B']];
const darken=(h,f)=>{const n=parseInt(h.slice(1),16),c=v=>Math.round(v*(1-f)).toString(16).padStart(2,'0');return '#'+c(n>>16)+c((n>>8)&255)+c(n&255);};
const seed=t=>({bg:t.bg,surface:t.surface,fg:t.fg,accent:t.accent,gold:t.gold,w1:t.accent,w2:darken(t.accent,.24)});
let ui={theme:'cinema',custom:seed(THEMES[0])};
try{const u=JSON.parse(localStorage.getItem(UIKEY)||'{}');if(u.theme)ui.theme=u.theme;if(u.custom&&u.custom.bg)ui.custom=Object.assign(ui.custom,u.custom);}catch(e){}
if(ui.theme!=='custom'&&!THEMES.some(t=>t.id===ui.theme))ui.theme='cinema';
function renderThemes(){
  $('#themes').innerHTML=THEMES.map(t=>`<button class="theme${t.id===ui.theme?' sel':''}" data-act="theme" data-t="${t.id}"><span class="sw3">${[t.bg,t.accent,t.gold].map(c=>`<i style="background:${c}"></i>`).join('')}</span>${t.name}</button>`).join('')
   +`<button class="theme${ui.theme==='custom'?' sel':''}" data-act="theme" data-t="custom"><span class="sw3" style="background:conic-gradient(#c8102e,#e0b84c,#4fb477,#2b7a8f,#8b5cf6,#c8102e)"></span>Customizado</button>`;
  $('#custombox').hidden=ui.theme!=='custom';
}
function renderCgrid(){
  $('#cgrid').innerHTML=CKEYS.map(([k,l],i)=>`<label class="cf${i===0?' wide':''}"><span>${l}</span><input type="color" data-ck="${k}" value="${ui.custom[k]}" aria-label="${l}"></label>`).join('');
}
function applyUI(){
  const r=document.documentElement;r.dataset.theme=ui.theme;
  ['bg','surface','fg','accent','gold','w1','w2','accent-fg'].forEach(k=>r.style.removeProperty('--'+k));
  if(ui.theme==='custom'){
    CKEYS.forEach(([k])=>r.style.setProperty('--'+k,ui.custom[k]));
    r.style.setProperty('--accent-fg',txtColor(ui.custom.accent));
    const n=parseInt(ui.custom.bg.slice(1),16);r.style.colorScheme=((n>>16)*.3+((n>>8)&255)*.59+(n&255)*.11)/255<.5?'dark':'light';
  }else r.style.removeProperty('color-scheme');
  const mt=document.querySelector('meta[name=theme-color]');
  if(mt)mt.content=getComputedStyle(r).getPropertyValue('--bg').trim();
  try{localStorage.setItem(UIKEY,JSON.stringify(ui));}catch(e){}
  renderThemes();draw();
}

/* ---------- TMDB ---------- */
async function tm(path,params={}){
  const k=(state.key||'').trim();if(!k)throw new Error('sem chave');
  const u=new URL('https://api.themoviedb.org/3'+path);u.searchParams.set('language','pt-BR');
  for(const [a,b] of Object.entries(params))u.searchParams.set(a,b);
  const opt={};if(k.length>40)opt.headers={Authorization:'Bearer '+k};else u.searchParams.set('api_key',k);
  const r=await fetch(u,opt);if(!r.ok)throw new Error(String(r.status));return r.json();
}
async function details(id){
  const d=await tm('/movie/'+id,{append_to_response:'credits'});
  return {id:d.id,poster:d.poster_path,backdrop:d.backdrop_path||null,overview:d.overview||'',year:(d.release_date||'').slice(0,4),genres:(d.genres||[]).map(g=>g.name),runtime:d.runtime||null,vote:d.vote_average?+d.vote_average.toFixed(1):null,director:((d.credits&&d.credits.crew)||[]).filter(c=>c.job==='Director').map(c=>c.name).slice(0,2).join(', ')};
}
const infoLine=t=>t?[t.year,(t.genres||[]).slice(0,3).join(', '),t.runtime?t.runtime+' min':'',t.director?'Dir. '+t.director:'',t.vote?'TMDB ★ '+t.vote:''].filter(Boolean).join(' · '):'';

/* ---------- Componentes ---------- */
const posterImg=(m,w)=>m.tmdb&&m.tmdb.poster?`<img src="${IMG}${w}${m.tmdb.poster}" loading="lazy" alt="Pôster de ${esc(m.title)}">`:`<div class="ph" style="--c:${esc(m.color)};color:#fff"><span>${esc(m.title)}</span></div>`;
function stars(id,v){let h='';for(let i=1;i<=5;i++)h+=`<button class="st${i<=v?' on':''}" data-act="star" data-id="${id}" data-v="${i}" aria-label="${i} estrelas">★</button>`;return h;}
const starsStatic=v=>v?`<span class="sst">${'★'.repeat(v)}<i>${'★'.repeat(5-v)}</i></span>`:'';
const chips=t=>t&&t.genres&&t.genres.length?`<div class="chips">${t.genres.map(g=>`<span class="gc">${esc(g)}</span>`).join('')}</div>`:'';
const idle=(a,b)=>`<div class="rc idle"><div class="rbody"><small class="kick">${a}</small><h2>${b}</h2></div></div>`;

/* ---------- Roleta ---------- */
const cv=$('#c'),ctx=cv.getContext('2d'),btn=$('#spin');
let rot=0,spinning=false,lastId=null,tick=0;
function fit(){const w=$('#stagewrap'),cs=getComputedStyle(w),pw=w.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),ph=w.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom),d=Math.max(160,Math.floor(Math.min(pw,ph,720)));const st=$('#stage');st.style.width=st.style.height=d+'px';size();}
function size(){const r=cv.getBoundingClientRect();if(r.width<10)return;const d=Math.min(window.devicePixelRatio||1,2.5);cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);draw();}
function draw(){
  const W=cv.width;if(W<20)return;
  const R=W/2,P=pool(),n=P.length,cs=getComputedStyle(document.documentElement);
  const w1=cs.getPropertyValue('--w1').trim()||'#c8102e',w2=cs.getPropertyValue('--w2').trim()||'#a00d25';
  const rim=cs.getPropertyValue('--rim').trim()||'#1a1216',gold=cs.getPropertyValue('--gold').trim()||'#e0b84c';
  const Rs=R*.88;
  ctx.clearRect(0,0,W,W);ctx.save();ctx.translate(R,R);
  ctx.beginPath();ctx.arc(0,0,R-1,0,TAU);ctx.fillStyle=rim;ctx.fill();
  ctx.lineWidth=Math.max(2,W*.006);ctx.strokeStyle=gold;ctx.beginPath();ctx.arc(0,0,R-1-ctx.lineWidth/2,0,TAU);ctx.stroke();
  for(let i=0;i<28;i++){
    const an=i/28*TAU,on=(i+tick)%2===0;
    ctx.beginPath();ctx.arc(Math.cos(an)*R*.94,Math.sin(an)*R*.94,R*.017,0,TAU);
    ctx.fillStyle=on?gold:'rgba(255,255,255,.16)';ctx.shadowColor=gold;ctx.shadowBlur=on?R*.05:0;ctx.fill();
  }
  ctx.shadowBlur=0;
  if(!n){
    ctx.beginPath();ctx.arc(0,0,Rs,0,TAU);ctx.fillStyle='#3a3a3a';ctx.fill();
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font=`600 ${W*.04}px system-ui`;ctx.fillText(state.movies.length?'Nenhum filme disponível':'Sua lista está vazia',0,W*.2);if(!state.movies.length){ctx.font=`${W*.03}px system-ui`;ctx.fillText('Adicione filmes em “Meus filmes”',0,W*.26);}
    ctx.restore();return;
  }
  const a=TAU/n;
  P.forEach((m,i)=>{
    const s=rot+i*a;
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,Rs,s,s+a);ctx.closePath();
    const sc=i%2?w2:w1;ctx.fillStyle=sc;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=Math.max(1,W/420);ctx.stroke();
    ctx.save();ctx.rotate(s+a/2);ctx.textAlign='right';ctx.textBaseline='middle';
    const maxW=Rs*.62;let fs=Math.max(Math.min(W*.036,Rs*Math.sin(Math.min(a,Math.PI)/2)*1.25),W*.022);
    ctx.font=`600 ${fs}px system-ui,sans-serif`;let t=m.title;
    while(ctx.measureText(t).width>maxW&&fs>W*.02){fs-=1;ctx.font=`600 ${fs}px system-ui,sans-serif`;}
    if(ctx.measureText(t).width>maxW){while(t.length>3&&ctx.measureText(t+'…').width>maxW)t=t.slice(0,-1);t+='…';}
    const tc=txtColor(sc);ctx.fillStyle=tc;ctx.shadowColor=tc==='#fff'?'rgba(0,0,0,.5)':'rgba(255,255,255,.4)';ctx.shadowBlur=3;
    ctx.fillText(t,Rs-W*.03,0);ctx.restore();
  });
  ctx.beginPath();ctx.arc(0,0,Rs,0,TAU);ctx.strokeStyle=gold;ctx.lineWidth=Math.max(2,W*.005);ctx.stroke();
  ctx.restore();
}
function confetti(){
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const c=document.createElement('canvas');c.className='confetti';c.width=innerWidth;c.height=innerHeight;document.body.appendChild(c);
  const x=c.getContext('2d'),cols=['#e0b84c','#c8102e','#ffffff','#8b5cf6','#22d3ee'];
  const ps=Array.from({length:90},()=>({x:c.width/2,y:c.height*.45,vx:(Math.random()-.5)*14,vy:Math.random()*-14-3,s:4+Math.random()*5,r:Math.random()*6,c:cols[Math.random()*cols.length|0]}));
  const t0=performance.now();
  (function f(now){
    const t=now-t0;x.clearRect(0,0,c.width,c.height);
    ps.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.r+=.2;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.globalAlpha=Math.max(0,1-t/2200);x.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);x.restore();});
    if(t<2200)requestAnimationFrame(f);else c.remove();
  })(t0);
}
function spin(){
  const P=pool(),n=P.length;if(spinning||!n)return;
  spinning=true;btn.disabled=true;
  const a=TAU/n,idx=Math.floor(Math.random()*n),off=(Math.random()-.5)*a*.7;
  const final=-(idx+.5)*a+off;
  const delta=((final-rot)%TAU+TAU)%TAU+TAU*(5+Math.floor(Math.random()*3));
  const start=rot,dur=5200+Math.random()*1200,t0=performance.now();
  setBackdrop(null);$('#res').innerHTML=idle('Girando…','🎞️');
  (function f(now){
    const p=Math.min((now-t0)/dur,1);rot=start+delta*(1-Math.pow(1-p,4));tick=Math.floor((now-t0)/110);draw();
    if(p<1)requestAnimationFrame(f);
    else{rot=((rot%TAU)+TAU)%TAU;spinning=false;btn.disabled=false;lastId=P[idx].id;renderResult(true);confetti();if(navigator.vibrate)try{navigator.vibrate(200)}catch(e){}}
  })(t0);
}
function setBackdrop(m){
  const bd=$('#bd'),t=m&&m.tmdb,path=t&&(t.backdrop||t.poster);
  if(path){bd.style.backgroundImage=`url("${IMG}${t.backdrop?'w1280':'w780'}${path}")`;bd.classList.add('on');}
  else bd.classList.remove('on');
}
async function ensureBackdrop(m){
  if(!m.tmdb||m.tmdb.backdrop!==undefined||!(state.key||'').trim())return;
  try{const d=await details(m.tmdb.id);m.tmdb=d;save();if(lastId===m.id&&!spinning)setBackdrop(m);renderModal();}catch(e){}
}
function renderResult(anim){
  const m=lastId&&byId(lastId);if(!m||spinning)return;const t=m.tmdb;
  setBackdrop(m);ensureBackdrop(m);
  $('#lastp').textContent=m.title+(t&&t.year?' ('+t.year+')':'');
  $('#res').innerHTML=`<div class="rc${anim?' reveal':''}">
    ${t&&t.poster?`<img class="rposter" src="${IMG}w154${t.poster}" alt="Pôster de ${esc(m.title)}">`:''}
    <div class="rbody">
      <small class="kick">Hoje a sessão é…</small>
      <h2>${esc(m.title)}</h2>
      ${t?`<div class="info">${esc(infoLine(t))}</div>`:''}
    </div>
    <div class="racts">
      <button class="btn${m.watched?'':' pri'}" data-act="watch" data-id="${m.id}">${m.watched?'↩ Desmarcar':'✓ Assistido'}</button>
      <button class="btn" data-act="open" data-id="${m.id}">Detalhes</button>
    </div></div>`;
}
const renderPoolInfo=()=>{const n=pool().length;$('#poolInfo').textContent=`${n} filme${n===1?'':'s'} na roleta`;};

/* ---------- Biblioteca ---------- */
let flt='all',query='',sortBy='recent',genre='';
function visible(){
  let L=state.movies.filter(m=>flt==='all'||(flt==='done'?m.watched:!m.watched));
  const q=norm(query);if(q)L=L.filter(m=>norm(m.title).includes(q));
  if(genre)L=L.filter(m=>m.tmdb&&(m.tmdb.genres||[]).includes(genre));
  const yr=m=>+(m.tmdb&&m.tmdb.year)||0;
  const by={title:(a,b)=>a.title.localeCompare(b.title,'pt'),rating:(a,b)=>b.rating-a.rating,year:(a,b)=>yr(b)-yr(a)}[sortBy];
  return by?L.slice().sort(by):L;
}
function renderGenres(){
  const set=new Set();state.movies.forEach(m=>m.tmdb&&(m.tmdb.genres||[]).forEach(g=>set.add(g)));
  const gs=[...set].sort((a,b)=>a.localeCompare(b,'pt'));if(genre&&!set.has(genre))genre='';
  $('#genre').innerHTML='<option value="">Todos os gêneros</option>'+gs.map(g=>`<option value="${esc(g)}"${g===genre?' selected':''}>${esc(g)}</option>`).join('');
}
function renderList(){
  const rated=state.movies.filter(m=>m.rating>0),avg=rated.length?(rated.reduce((s,m)=>s+m.rating,0)/rated.length).toFixed(1):'–';
  $('#stats').textContent=`${state.movies.length} filmes · ${state.movies.filter(m=>m.watched).length} assistidos · média das notas: ${avg}`;
  renderGenres();
  const L=visible();
  $('#list').innerHTML=L.length?L.map(m=>`<div class="row-m" data-act="open" data-id="${m.id}" tabindex="0" role="button" aria-label="${esc(m.title)}">
    <div class="cv">${posterImg(m,'w154')}</div>
    <div class="tt"><b>${esc(m.title)}</b><span class="sub">${m.tmdb&&m.tmdb.year?esc(m.tmdb.year):''}${starsStatic(m.rating)}</span></div>
    <span class="bdg${m.watched?' ok':''}">${m.watched?'Assistido':'Quero ver'}</span>
  </div>`).join(''):`<div class="stats center" style="padding:24px 0">${state.movies.length?'Nenhum filme encontrado.':'Sua lista está vazia. Use “Adicionar filme” acima.'}</div>`;
}

/* ---------- Detalhes (modal) ---------- */
let openId=null;
function openModal(id){openId=id;renderModal();$('#modal').hidden=false;document.body.classList.add('noscroll');}
function closeModal(){openId=null;$('#modal').hidden=true;document.body.classList.remove('noscroll');}
function renderModal(){
  if(!openId)return;const m=byId(openId);if(!m){closeModal();return;}const t=m.tmdb;
  $('#mbody').innerHTML=`<div class="md">
    <div class="mp">${posterImg(m,'w500')}</div>
    <div class="mi">
      <input class="mt" type="text" value="${esc(m.title)}" data-act="title" data-id="${m.id}" maxlength="80" aria-label="Título">
      <div class="info">${t?esc(infoLine(t)):'Sem dados do TMDB ainda (use Ajustes → Buscar dados de todos).'}</div>
      ${chips(t)}
      ${t&&t.overview?`<p class="ov">${esc(t.overview)}</p>`:''}
      <div class="lbl">Sua nota</div><div>${stars(m.id,m.rating)}</div>
      <div class="lbl">Anotação</div>
      <textarea data-act="note" data-id="${m.id}" maxlength="400" placeholder="O que você achou? Com quem assistiu?">${esc(m.note||'')}</textarea>
      <div class="row">
        <label class="check"><input type="checkbox" data-act="watchbox" data-id="${m.id}" ${m.watched?'checked':''}> Já assisti</label>
      </div>
      <div class="row"><button class="btn danger" data-act="del" data-id="${m.id}">🗑 Excluir filme</button></div>
    </div></div>`;
}
function friendCode(){
  if(user)return 'RC-'+user.id.replace(/-/g,'').slice(0,4).toUpperCase()+'-'+user.id.replace(/-/g,'').slice(4,8).toUpperCase();
  try{let c=localStorage.getItem('roleta-friend-code');if(!c){const h='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',r=n=>Array.from({length:n},()=>h[Math.random()*h.length|0]).join('');c='RC-'+r(4)+'-'+r(4);localStorage.setItem('roleta-friend-code',c);}return c;}catch(e){return 'RC-····-····';}
}
function renderProfile(){
  const d=state.movies.filter(m=>m.watched),rs=state.movies.filter(m=>m.rating>0);
  $('#k1').textContent=d.length;$('#k2').textContent=state.movies.length-d.length;
  $('#k3').textContent=rs.length?(rs.reduce((s,m)=>s+m.rating,0)/rs.length).toFixed(1):'–';
  const nm=user?user.email.split('@')[0]:'Visitante';
  $('#pfName').textContent=nm;$('#pfAv').textContent=nm.charAt(0).toUpperCase();
  $('#pfUser').textContent=user?'@'+nm.toLowerCase().replace(/[^a-z0-9._]/g,''):'Entre na conta para sincronizar';
  $('#mycode').textContent=friendCode();
  $('#pfSync').textContent=user?'Conectado como '+user.email:'Sem conta conectada.';
}
function renderIdleHint(){if(lastId||spinning)return;$('#res').innerHTML=state.movies.length?idle('Seu filme será…','?'):idle('Sua lista está vazia','Adicione seu primeiro filme');}
function refreshUI(){renderIdleHint();draw();renderPoolInfo();renderList();renderResult();renderModal();renderProfile();}
function refresh(){save();refreshUI();}

/* ---------- Adicionar / buscar ---------- */
let found=[];
function addMovie(o){
  state.movies.unshift({id:uid(),title:o.title,color:randColor(),watched:false,rating:0,note:'',tmdb:o.tmdb||null});
  $('#newTitle').value='';$('#results').innerHTML='';refresh();
}
async function doSearch(){
  const q=$('#newTitle').value.trim();if(!q)return;
  if(!(state.key||'').trim()){addMovie({title:q});return;}
  $('#results').innerHTML='<div class="stats">Buscando…</div>';
  try{
    found=(await tm('/search/movie',{query:q})).results.slice(0,6);
    $('#results').innerHTML=found.map((x,i)=>`<div class="rrow" data-act="pick" data-i="${i}">${x.poster_path?`<img src="${IMG}w154${x.poster_path}" alt="">`:'<div class="ph" style="--c:#444"></div>'}
      <div><b>${esc(x.title)}</b><div class="info">${esc((x.release_date||'').slice(0,4))}${x.original_title&&x.original_title!==x.title?' · '+esc(x.original_title):''}</div><div class="info">${esc((x.overview||'').slice(0,140))}${(x.overview||'').length>140?'…':''}</div></div></div>`).join('')
      +`<button class="btn" data-act="plain">Adicionar “${esc(q)}” sem dados</button>`;
  }catch(e){$('#results').innerHTML=`<div class="stats">Erro na busca (${esc(e.message)}). Confira sua chave em Ajustes.</div><button class="btn" data-act="plain">Adicionar “${esc(q)}” sem dados</button>`;}
}

/* ---------- Painel lateral ---------- */
const app=$('#app'),PT={filmes:'Meus filmes',perfil:'Perfil',amigos:'Amigos',ajustes:'Ajustes'};let panelTab='filmes';
function openPanel(v){app.classList.toggle('open',v);document.querySelectorAll('.rt').forEach(b=>b.setAttribute('aria-selected',v&&b.dataset.t===panelTab));setTimeout(fit,320);}
function setTab(t){panelTab=t;$('#ptitle').textContent=PT[t];document.querySelectorAll('.pb').forEach(p=>p.classList.toggle('on',p.id==='t-'+t));openPanel(true);}

/* ---------- Eventos ---------- */
btn.addEventListener('click',spin);
document.addEventListener('click',async e=>{
  if(e.target.id==='modal'){closeModal();return;}
  const rt=e.target.closest('.rt');
  if(rt){if(app.classList.contains('open')&&panelTab===rt.dataset.t)openPanel(false);else{setTab(rt.dataset.t);openPanel(true);}return;}
  const fb=e.target.closest('[data-f]');
  if(fb){flt=fb.dataset.f;document.querySelectorAll('#filters .btn').forEach(b=>b.classList.toggle('on',b===fb));renderList();return;}
  const el=e.target.closest('[data-act]');if(!el)return;const act=el.dataset.act;
  if(act==='close'){closeModal();return;}
  if(act==='closepanel'){openPanel(false);return;}
  if(act==='togglepanel'){openPanel(!app.classList.contains('open'));return;}
  if(act==='gocfg'){setTab('ajustes');return;}
  if(act==='copycode'){const c=$('#mycode').textContent;(navigator.clipboard?navigator.clipboard.writeText(c):Promise.reject()).then(()=>{el.textContent='Copiado';setTimeout(()=>el.textContent='Copiar',1500);},()=>{el.textContent=c;});return;}
  if(act==='theme'){if(el.dataset.t==='custom'&&ui.theme!=='custom'){const cur=THEMES.find(t=>t.id===ui.theme);if(cur)ui.custom=seed(cur);renderCgrid();}ui.theme=el.dataset.t;applyUI();return;}
  if(act==='resetui'){ui.custom=seed(THEMES[0]);renderCgrid();applyUI();return;}
  if(act==='plain'){addMovie({title:$('#newTitle').value.trim()});return;}
  if(act==='pick'){
    const x=found[+el.dataset.i];if(!x)return;$('#results').innerHTML='<div class="stats">Adicionando…</div>';
    let d=null;try{d=await details(x.id);}catch(err){}
    addMovie({title:x.title,tmdb:d});return;}
  const m=byId(el.dataset.id);if(!m)return;
  if(act==='open'){openModal(m.id);return;}
  if(act==='star'){const v=+el.dataset.v;m.rating=m.rating===v?0:v;if(m.rating)m.watched=true;refresh();}
  else if(act==='watch'){m.watched=!m.watched;refresh();}
  else if(act==='del'){
    if(el.dataset.armed){
      state.movies=state.movies.filter(x=>x.id!==m.id);
      if(lastId===m.id){lastId=null;$('#res').innerHTML=idle('Seu filme será…','?');}
      closeModal();refresh();
    }else{
      const old=el.textContent;el.dataset.armed=1;el.classList.add('arm');el.textContent='Toque de novo para confirmar';
      setTimeout(()=>{el.dataset.armed='';el.classList.remove('arm');el.textContent=old;},2800);
    }
  }
});
document.addEventListener('change',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;const m=byId(el.dataset.id);if(!m)return;
  if(el.dataset.act==='color')m.color=el.value;
  else if(el.dataset.act==='note')m.note=el.value.trim();
  else if(el.dataset.act==='title'){const v=el.value.trim();if(v)m.title=v;else el.value=m.title;}
  else if(el.dataset.act==='watchbox')m.watched=el.checked;
  else return;
  refresh();
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(openId){closeModal();return;}if(app.classList.contains('open')){openPanel(false);return;}}
  if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('row-m')){e.preventDefault();e.target.click();}
});
$('#inc').addEventListener('change',e=>{state.incWatched=e.target.checked;refresh();});
$('#addBtn').addEventListener('click',doSearch);
$('#newTitle').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch();});
$('#q').addEventListener('input',e=>{query=e.target.value;renderList();});
$('#sort').addEventListener('change',e=>{sortBy=e.target.value;renderList();});
$('#genre').addEventListener('change',e=>{genre=e.target.value;renderList();});
document.addEventListener('input',e=>{const k=e.target.dataset&&e.target.dataset.ck;if(k){ui.custom[k]=e.target.value;applyUI();}});
window.addEventListener('resize',fit);
new ResizeObserver(fit).observe($('#stagewrap'));

/* ---------- Ajustes ---------- */
const msg=t=>$('#cfgMsg').textContent=t;
$('#saveKey').addEventListener('click',async()=>{
  state.key=$('#key').value.trim();saveLocal();
  if(!state.key){msg('Chave removida.');return;}
  msg('Testando…');try{await tm('/configuration');msg('✅ Conectado ao TMDB!');}catch(e){msg('❌ Não conectou ('+e.message+'). Confira se copiou a chave inteira.');}
});
$('#enrich').addEventListener('click',async()=>{
  if(!(state.key||'').trim()){msg('Cole e salve sua chave primeiro.');return;}
  const todo=state.movies.filter(m=>(!m.tmdb&&!m.miss)||(m.tmdb&&m.tmdb.backdrop===undefined));if(!todo.length){msg('Todos os filmes já têm dados.');return;}
  let n=0;$('#enrich').disabled=true;
  for(const m of todo){
    msg(`Buscando ${++n}/${todo.length}: ${m.title}`);
    try{if(m.tmdb)m.tmdb=await details(m.tmdb.id);else{const d=await tm('/search/movie',{query:m.title});if(d.results[0])m.tmdb=await details(d.results[0].id);else m.miss=true;}}
    catch(e){if(e.message==='401'){msg('Chave inválida ou sem permissão.');break;}}
    save();
  }
  $('#enrich').disabled=false;refresh();if(n===todo.length)msg('Concluído! Confira em Meus filmes.');
});
/* Apagar só os filmes "Quero ver", com duas verificações: confirmar o aviso e digitar APAGAR */
const queroVer=()=>state.movies.filter(m=>!m.watched);
function wipeReset(){$('#wipeA').hidden=true;$('#wipeB').hidden=true;$('#wipeTxt').value='';$('#wipe3').disabled=true;$('#wipe1').hidden=false;}
$('#wipe1').addEventListener('click',()=>{
  const n=queroVer().length,keep=state.movies.length-n;
  if(!n){msg('Você não tem filmes marcados como “Quero ver”.');return;}
  $('#wipeAmsg').textContent=`Isso vai apagar ${n} filme${n===1?'':'s'} marcado${n===1?'':'s'} como “Quero ver”${user?', inclusive na nuvem':''}. ${keep?(keep===1?'O filme assistido continua na lista.':`Os ${keep} filmes assistidos continuam na lista.`):'Você não tem filmes assistidos.'} Deseja continuar?`;
  $('#wipe1').hidden=true;$('#wipeA').hidden=false;
});
$('#wipeCancelA').addEventListener('click',wipeReset);
$('#wipeCancelB').addEventListener('click',wipeReset);
$('#wipe2').addEventListener('click',()=>{$('#wipeA').hidden=true;$('#wipeB').hidden=false;$('#wipeTxt').focus();});
$('#wipeTxt').addEventListener('input',e=>{$('#wipe3').disabled=norm(e.target.value.trim())!=='apagar';});
$('#wipe3').addEventListener('click',()=>{
  if(norm($('#wipeTxt').value.trim())!=='apagar')return;
  const n=queroVer().length;
  state.movies=state.movies.filter(m=>m.watched);
  if(lastId&&!byId(lastId)){lastId=null;setBackdrop(null);}
  closeModal();refresh();wipeReset();msg(`${n} filme${n===1?'':'s'} apagado${n===1?'':'s'}.`);
});
$('#exp').addEventListener('click',()=>{
  const b=new Blob([JSON.stringify({...state,key:''},null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='roleta-cinema-backup.json';a.click();
});
$('#imp').addEventListener('click',()=>$('#file').click());
$('#file').addEventListener('change',async e=>{
  const f=e.target.files[0];if(!f)return;
  try{const s=JSON.parse(await f.text());if(!Array.isArray(s.movies))throw 0;s.movies.forEach(m=>{if(!isUuid(m.id))m.id=uid();});state={...s,key:state.key};refresh();msg('Backup importado.');}
  catch(err){msg('Arquivo de backup inválido.');}
  e.target.value='';
});

/* ---------- Nuvem (Supabase) ---------- */
let sb=null,user=null,pushTimer=null,cloudIds=new Set(),pulledFor=null;
const setSync=t=>{const el=$('#syncMsg');if(el)el.textContent=t;};
const toRow=(m,i)=>({id:m.id,user_id:user.id,pos:i,title:m.title,color:m.color,watched:!!m.watched,rating:m.rating||0,note:m.note||'',tmdb:m.tmdb||null,miss:!!m.miss});
const fromRow=r=>({id:r.id,title:r.title,color:r.color,watched:r.watched,rating:r.rating,note:r.note||'',tmdb:r.tmdb||null,miss:r.miss});
function schedulePush(){if(!sb||!user)return;clearTimeout(pushTimer);setSync('⏳ Salvando…');pushTimer=setTimeout(pushAll,800);}
async function pushAll(){
  if(!sb||!user)return;
  try{
    if(state.movies.length){const {error}=await sb.from('movies').upsert(state.movies.map(toRow));if(error)throw error;}
    const gone=[...cloudIds].filter(id=>!state.movies.some(m=>m.id===id));
    if(gone.length){const {error}=await sb.from('movies').delete().in('id',gone);if(error)throw error;}
    cloudIds=new Set(state.movies.map(m=>m.id));setSync('☁️ Salvo na nuvem');
  }catch(e){setSync('⚠️ Erro ao salvar: '+(e.message||e));}
}
async function pullCloud(){
  setSync('⏳ Carregando sua lista…');
  const {data,error}=await sb.from('movies').select('*').order('pos');
  if(error){setSync('⚠️ '+error.message);return;}
  if(data.length){
    state.movies=data.map(fromRow);cloudIds=new Set(data.map(r=>r.id));
    if(lastId&&!byId(lastId)){lastId=null;$('#res').innerHTML=idle('Seu filme será…','?');}
    saveLocal();refreshUI();setSync('☁️ Lista sincronizada');
  }else{
    state.movies.forEach(m=>{if(!isUuid(m.id))m.id=uid();});
    await pushAll();saveLocal();setSync('☁️ Sua lista foi enviada para a nuvem');
  }
}
function renderAuth(){
  $('#cloudOff').hidden=!!sb;
  $('#authIn').hidden=!sb||!!user;
  $('#authOut').hidden=!sb||!user;
  $('#who').textContent=user?user.email:'';
  const chip=$('#loginChip');chip.hidden=!sb;chip.textContent=user?'☁️ '+user.email.split('@')[0]:'☁️ Entrar para sincronizar';renderProfile();
}
async function authDo(kind){
  const email=$('#email').value.trim(),password=$('#pass').value;
  if(!email||password.length<6){setSync('Informe e-mail e senha (mínimo de 6 caracteres).');return;}
  setSync('⏳ Aguarde…');
  const {data,error}=await(kind==='up'?sb.auth.signUp({email,password}):sb.auth.signInWithPassword({email,password}));
  if(error){setSync('❌ '+error.message);return;}
  if(kind==='up'&&!data.session)setSync('📧 Conta criada! Confirme pelo e-mail que você recebeu e depois toque em Entrar.');
}
if(window.supabase&&/^https:\/\//.test(window.SUPABASE_URL||'')&&window.SUPABASE_KEY&&!/COLE/.test(window.SUPABASE_KEY)){
  sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_KEY);
  sb.auth.onAuthStateChange((ev,session)=>{
    user=session?session.user:null;renderAuth();
    if(user&&(ev==='INITIAL_SESSION'||ev==='SIGNED_IN')&&pulledFor!==user.id){pulledFor=user.id;setTimeout(pullCloud,0);}
    if(!user){pulledFor=null;cloudIds=new Set();if(ev==='SIGNED_OUT')setSync('Você saiu da conta.');}
  });
  $('#inBtn').addEventListener('click',()=>authDo('in'));
  $('#upBtn').addEventListener('click',()=>authDo('up'));
  $('#outBtn').addEventListener('click',()=>sb.auth.signOut());
}
$('#loginChip').addEventListener('click',()=>setTab(user?'perfil':'ajustes'));

/* ---------- Início ---------- */
$('#inc').checked=state.incWatched;$('#key').value=state.key||'';
renderCgrid();applyUI();fit();renderPoolInfo();renderList();renderAuth();renderProfile();renderIdleHint();
if(!state.movies.length){setTab('filmes');$('#addbox').open=true;}
