const KEY='roleta-cinema-v2', TAU=Math.PI*2, IMG='https://image.tmdb.org/t/p/';
const SEED=["Whiplash","Amélie Poulain","Green Book","V de Vingança","Harry Potter e a Pedra Filosofal","Harry Potter e a Câmara Secreta","Harry Potter e o Prisioneiro de Azkaban","Harry Potter e o Cálice de Fogo","Harry Potter e a Ordem da Fênix","Harry Potter e o Enigma do Príncipe","Harry Potter e as Relíquias da Morte: Parte 1","Harry Potter e as Relíquias da Morte: Parte 2","Gran Torino","O Grande Hotel Budapeste","Ford vs Ferrari","Parasita","O Iluminado","O Sexto Sentido","O Poderoso Chefão","O Poderoso Chefão II","O Poderoso Chefão III","À Espera de um Milagre","Kill Bill","Efeito Borboleta","Brilho Eterno de uma Mente sem Lembranças","A Caça","O Labirinto do Fauno","Sociedade dos Poetas Mortos","A Outra História Americana","O Grande Truque","Quem Quer Ser um Milionário?","As Aventuras de Pi","Tenet"];
const $=s=>document.querySelector(s);
const uid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16);});
const isUuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
function hsl2hex(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));const x=v=>Math.round(255*v).toString(16).padStart(2,'0');return '#'+x(f(0))+x(f(8))+x(f(4));}
const randColor=()=>hsl2hex(Math.floor(Math.random()*360),62,38);
const txtColor=h=>{const n=parseInt(h.slice(1),16);return ((n>>16)*.299+((n>>8)&255)*.587+(n&255)*.114)>150?'#111':'#fff';};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

let state;
function load(){
  try{const r=localStorage.getItem(KEY);if(r){const s=JSON.parse(r);if(s&&Array.isArray(s.movies))return s;}}catch(e){}
  return {incWatched:false,key:'',movies:SEED.map((t,i)=>({id:uid(),title:t,color:hsl2hex(i*360/SEED.length,62,38),watched:false,rating:0,note:'',tmdb:null}))};
}
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
function save(){saveLocal();schedulePush();}
state=load();
const pool=()=>state.movies.filter(m=>state.incWatched||!m.watched);
const byId=id=>state.movies.find(m=>m.id===id);

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
  return {id:d.id,poster:d.poster_path,overview:d.overview||'',year:(d.release_date||'').slice(0,4),genres:(d.genres||[]).map(g=>g.name),runtime:d.runtime||null,vote:d.vote_average?+d.vote_average.toFixed(1):null,director:((d.credits&&d.credits.crew)||[]).filter(c=>c.job==='Director').map(c=>c.name).slice(0,2).join(', ')};
}
const infoLine=t=>t?[t.year,(t.genres||[]).slice(0,3).join(', '),t.runtime?t.runtime+' min':'',t.director?'Dir. '+t.director:'',t.vote?'TMDB ★ '+t.vote:''].filter(Boolean).join(' · '):'';

/* ---------- Roleta ---------- */
const cv=$('#c'),ctx=cv.getContext('2d'),btn=$('#spin');
let rot=0,spinning=false,lastId=null;
function size(){const r=cv.getBoundingClientRect(),d=Math.min(window.devicePixelRatio||1,2.5);cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);draw();}
function draw(){
  const W=cv.width,R=W/2,P=pool(),n=P.length;
  ctx.clearRect(0,0,W,W);ctx.save();ctx.translate(R,R);
  ctx.beginPath();ctx.arc(0,0,R-2,0,TAU);ctx.fillStyle='#222';ctx.fill();
  if(!n){ctx.beginPath();ctx.arc(0,0,R-8,0,TAU);ctx.fillStyle='#444';ctx.fill();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font=`600 ${W*.04}px system-ui`;ctx.fillText('Nenhum filme disponível',0,-W*.12);ctx.restore();return;}
  const a=TAU/n;
  P.forEach((m,i)=>{
    const s=rot+i*a;
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R-8,s,s+a);ctx.closePath();
    ctx.fillStyle=m.color;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=Math.max(1,W/400);ctx.stroke();
    ctx.save();ctx.rotate(s+a/2);ctx.textAlign='right';ctx.textBaseline='middle';
    const maxW=R*.6;let fs=Math.max(Math.min(W*.036,(R-8)*Math.sin(Math.min(a,Math.PI)/2)*1.25),W*.022);
    ctx.font=`600 ${fs}px system-ui,sans-serif`;let t=m.title;
    while(ctx.measureText(t).width>maxW&&fs>W*.02){fs-=1;ctx.font=`600 ${fs}px system-ui,sans-serif`;}
    if(ctx.measureText(t).width>maxW){while(t.length>3&&ctx.measureText(t+'…').width>maxW)t=t.slice(0,-1);t+='…';}
    const tc=txtColor(m.color);ctx.fillStyle=tc;ctx.shadowColor=tc==='#fff'?'rgba(0,0,0,.5)':'rgba(255,255,255,.4)';ctx.shadowBlur=3;
    ctx.fillText(t,R-W*.045,0);ctx.restore();
  });
  ctx.restore();
}
function spin(){
  const P=pool(),n=P.length;if(spinning||!n)return;
  spinning=true;btn.disabled=true;
  const a=TAU/n,idx=Math.floor(Math.random()*n),off=(Math.random()-.5)*a*.7;
  const final=-Math.PI/2-(idx+.5)*a+off;
  const delta=((final-rot)%TAU+TAU)%TAU+TAU*(5+Math.floor(Math.random()*3));
  const start=rot,dur=5200+Math.random()*1200,t0=performance.now();
  $('#res').innerHTML='<small>Girando…</small><strong>🎞️</strong>';
  (function f(now){
    const p=Math.min((now-t0)/dur,1);rot=start+delta*(1-Math.pow(1-p,4));draw();
    if(p<1)requestAnimationFrame(f);
    else{rot=((rot%TAU)+TAU)%TAU;spinning=false;btn.disabled=false;lastId=P[idx].id;renderResult();if(navigator.vibrate)try{navigator.vibrate(200)}catch(e){}}
  })(t0);
}
function stars(id,v){let h='';for(let i=1;i<=5;i++)h+=`<button class="st${i<=v?' on':''}" data-act="star" data-id="${id}" data-v="${i}" aria-label="${i} estrelas">★</button>`;return h;}
function renderResult(){
  const m=lastId&&byId(lastId);if(!m)return;const t=m.tmdb;
  $('#res').innerHTML=`<small>🎉 Vamos assistir…</small>${t&&t.poster?`<img class="rp" src="${IMG}w185${t.poster}" alt="">`:''}<strong>${esc(m.title)}</strong>
  ${t?`<small>${esc(infoLine(t))}</small>`:''}${t&&t.overview?`<div class="ov">${esc(t.overview)}</div>`:''}
  <div>${stars(m.id,m.rating)}</div>
  <button class="btn${m.watched?'':' pri'}" data-act="watch" data-id="${m.id}">${m.watched?'↩ Desmarcar assistido':'✓ Marcar como assistido'}</button>`;
}
const renderPoolInfo=()=>{const n=pool().length;$('#poolInfo').textContent=`${n} filme${n===1?'':'s'} na roleta`;};

/* ---------- Biblioteca ---------- */
let flt='all';
const poster=m=>m.tmdb&&m.tmdb.poster?`<img src="${IMG}w154${m.tmdb.poster}" loading="lazy" alt="">`:`<div class="ph" style="background:${m.color};color:${txtColor(m.color)}">🎬</div>`;
function renderList(){
  const rated=state.movies.filter(m=>m.rating>0),avg=rated.length?(rated.reduce((s,m)=>s+m.rating,0)/rated.length).toFixed(1):'–';
  $('#stats').textContent=`${state.movies.length} filmes · ${state.movies.filter(m=>m.watched).length} assistidos · média das notas: ${avg}`;
  const L=state.movies.filter(m=>flt==='all'||(flt==='done'?m.watched:!m.watched));
  $('#list').innerHTML=L.length?L.map(m=>`<div class="mv${m.watched?' done':''}">
    <div class="po">${poster(m)}</div>
    <div class="bd">
      <input type="text" class="t" value="${esc(m.title)}" data-act="title" data-id="${m.id}" maxlength="80">
      ${m.tmdb?`<div class="info">${esc(infoLine(m.tmdb))}</div>`:''}
      ${m.tmdb&&m.tmdb.overview?`<details><summary>Sinopse</summary>${esc(m.tmdb.overview)}</details>`:''}
      <input type="text" class="n" value="${esc(m.note||'')}" placeholder="Anotação (opcional)" data-act="note" data-id="${m.id}" maxlength="200">
      <div class="meta"><div>${stars(m.id,m.rating)}</div>
        <div class="row"><label><input type="checkbox" data-act="watchbox" data-id="${m.id}" ${m.watched?'checked':''}> Assistido</label>
        <input type="color" value="${m.color}" data-act="color" data-id="${m.id}" title="Cor na roleta">
        <button class="x" data-act="del" data-id="${m.id}" title="Excluir">🗑</button></div></div>
    </div></div>`).join(''):'<div class="stats">Nenhum filme aqui ainda.</div>';
}
function refreshUI(){draw();renderPoolInfo();renderList();renderResult();}
function refresh(){save();refreshUI();}

/* ---------- Adicionar / buscar ---------- */
let found=[];
function addMovie(o){
  state.movies.unshift({id:uid(),title:o.title,color:$('#newColor').value,watched:false,rating:0,note:'',tmdb:o.tmdb||null});
  $('#newTitle').value='';$('#results').innerHTML='';$('#newColor').value=randColor();refresh();
}
async function doSearch(){
  const q=$('#newTitle').value.trim();if(!q)return;
  if(!(state.key||'').trim()){addMovie({title:q});return;}
  $('#results').innerHTML='<div class="stats">Buscando…</div>';
  try{
    found=(await tm('/search/movie',{query:q})).results.slice(0,6);
    $('#results').innerHTML=found.map((x,i)=>`<div class="mv res" data-act="pick" data-i="${i}"><div class="po">${x.poster_path?`<img src="${IMG}w154${x.poster_path}" alt="">`:'<div class="ph" style="background:#444">🎬</div>'}</div>
      <div class="bd"><b>${esc(x.title)}</b><div class="info">${esc((x.release_date||'').slice(0,4))}${x.original_title&&x.original_title!==x.title?' · '+esc(x.original_title):''}</div><div class="info">${esc((x.overview||'').slice(0,140))}${(x.overview||'').length>140?'…':''}</div></div></div>`).join('')
      +`<button class="btn" data-act="plain">Adicionar “${esc(q)}” sem dados</button>`;
  }catch(e){$('#results').innerHTML=`<div class="stats">Erro na busca (${esc(e.message)}). Confira sua chave em Ajustes.</div><button class="btn" data-act="plain">Adicionar “${esc(q)}” sem dados</button>`;}
}

/* ---------- Eventos ---------- */
btn.addEventListener('click',spin);
document.addEventListener('click',async e=>{
  const t=e.target.closest('[data-tab]');
  if(t){document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b===t));document.querySelectorAll('section').forEach(s=>s.classList.toggle('on',s.id===t.dataset.tab));if(t.dataset.tab==='wheel')size();return;}
  const fb=e.target.closest('[data-f]');
  if(fb){flt=fb.dataset.f;document.querySelectorAll('#filters .btn').forEach(b=>b.classList.toggle('on',b===fb));renderList();return;}
  const el=e.target.closest('[data-act]');if(!el)return;const act=el.dataset.act;
  if(act==='plain'){addMovie({title:$('#newTitle').value.trim()});return;}
  if(act==='pick'){
    const x=found[+el.dataset.i];if(!x)return;$('#results').innerHTML='<div class="stats">Adicionando…</div>';
    let d=null;try{d=await details(x.id);}catch(err){}
    addMovie({title:x.title,tmdb:d});return;}
  const m=byId(el.dataset.id);if(!m)return;
  if(act==='star'){const v=+el.dataset.v;m.rating=m.rating===v?0:v;if(m.rating)m.watched=true;refresh();}
  else if(act==='watch'){m.watched=!m.watched;refresh();}
  else if(act==='del'){
    if(el.dataset.armed){state.movies=state.movies.filter(x=>x.id!==m.id);if(lastId===m.id){lastId=null;$('#res').innerHTML='<small>Seu filme será…</small><strong>?</strong>';}refresh();}
    else{el.dataset.armed=1;el.classList.add('arm');el.textContent='Confirmar?';setTimeout(()=>{el.dataset.armed='';el.classList.remove('arm');el.textContent='🗑';},2500);}
  }
});
document.addEventListener('change',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;const m=byId(el.dataset.id);if(!m)return;
  if(el.dataset.act==='color')m.color=el.value;
  else if(el.dataset.act==='note')m.note=el.value.trim();
  else if(el.dataset.act==='title'){const v=el.value.trim();if(v)m.title=v;else el.value=m.title;}
  else if(el.dataset.act==='watchbox')m.watched=el.checked;
  refresh();
});
$('#inc').addEventListener('change',e=>{state.incWatched=e.target.checked;refresh();});
$('#addBtn').addEventListener('click',doSearch);
$('#newTitle').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch();});
window.addEventListener('resize',size);

/* ---------- Ajustes ---------- */
const msg=t=>$('#cfgMsg').textContent=t;
$('#saveKey').addEventListener('click',async()=>{
  state.key=$('#key').value.trim();save();
  if(!state.key){msg('Chave removida.');return;}
  msg('Testando…');try{await tm('/configuration');msg('✅ Conectado ao TMDB!');}catch(e){msg('❌ Não conectou ('+e.message+'). Confira se copiou a chave inteira.');}
});
$('#enrich').addEventListener('click',async()=>{
  if(!(state.key||'').trim()){msg('Cole e salve sua chave primeiro.');return;}
  const todo=state.movies.filter(m=>!m.tmdb&&!m.miss);if(!todo.length){msg('Todos os filmes já têm dados.');return;}
  let n=0;$('#enrich').disabled=true;
  for(const m of todo){
    msg(`Buscando ${++n}/${todo.length}: ${m.title}`);
    try{const d=await tm('/search/movie',{query:m.title});if(d.results[0])m.tmdb=await details(d.results[0].id);else m.miss=true;}
    catch(e){if(e.message==='401'){msg('Chave inválida ou sem permissão.');break;}}
    save();
  }
  $('#enrich').disabled=false;refresh();if(n===todo.length)msg('Concluído! Confira na aba Meus filmes.');
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

$('#inc').checked=state.incWatched;$('#key').value=state.key||'';$('#newColor').value=randColor();
size();renderPoolInfo();renderList();

/* ---------- Nuvem (Supabase) ---------- */
let sb=null,user=null,pushTimer=null,cloudIds=new Set();
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
    state.movies=data.map(fromRow);cloudIds=new Set(data.map(r=>r.id));lastId=null;
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
    if(user&&(ev==='INITIAL_SESSION'||ev==='SIGNED_IN'))setTimeout(pullCloud,0);
    if(!user){cloudIds=new Set();if(ev==='SIGNED_OUT')setSync('Você saiu da conta.');}
  });
  $('#inBtn').addEventListener('click',()=>authDo('in'));
  $('#upBtn').addEventListener('click',()=>authDo('up'));
  $('#outBtn').addEventListener('click',()=>sb.auth.signOut());
}
renderAuth();
