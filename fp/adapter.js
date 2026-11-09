/* Transport adapter only. Cards, scoring, ordering, deadlines and persistence
 * are the original engine. Every call below enters an existing UI flow. */
(function(){
  const dialog=document.createElement('dialog');dialog.id='phoneBook';dialog.setAttribute('aria-labelledby','fp-phone-title');
  dialog.innerHTML='<header><h2 id="fp-phone-title">사내 전화</h2><button class="btn" id="fp-phone-close" type="button" aria-label="전화 목록 닫기">닫기</button></header><p class="fp-sub">이름이나 팀으로 담당자를 찾아 통화하세요. 수신한 전화와 아직 듣지 않은 안내도 여기서 확인합니다.</p><div id="fp-incoming"></div><div class="fp-filters"><input id="fp-search" type="search" aria-label="전화 상대 검색" placeholder="이름 검색"><select id="fp-team" aria-label="팀 선택"><option value="">모든 팀</option></select></div><div id="fp-contacts"></div><footer><span class="muted">메일과 메신저는 컴퓨터에서 확인하세요.</span><button class="btn" id="fp-to-computer" type="button">컴퓨터로</button></footer>';
  document.body.append(dialog);
  const phone=document.createElement('button');phone.id='fp-phone-btn';phone.type='button';phone.textContent='전화';document.getElementById('pcBtn').after(phone);
  const context=document.createElement('div');context.id='fp-call-context';context.hidden=true;context.setAttribute('role','status');document.body.append(context);
  const teamSelect=document.getElementById('fp-team');for(const[k,v]of Object.entries(TEAM_NAMES)){const o=document.createElement('option');o.value=k;o.textContent=v;teamSelect.append(o);}
  let dialing=false,lastContacts='';
  const bookSignature=()=>JSON.stringify([S.phase,S.order.map(id=>[id,S.cards[id]?.status]),Talk.pending()]);
  const active=()=>D&&['briefing','work','triage','wrap'].includes(S.phase)&&!S.paused;
  const blocked=()=>dialing||(window.Talk&&Talk.isOpen());
  function openComputer(){if(!active()||blocked())return false;if(dialog.open)dialog.close();if(!Desk.isOpen())document.getElementById('pcBtn').click();return Desk.isOpen();}
  function closeComputer(){if(Desk.isOpen())document.getElementById('pcOff').click();}
  function contacts(){if(!D)return[];const rows=new Map();
    function add(name,key,seat){if(!name)return;name=Talk.norm(name);const info=npcInfo(name)||{};if(rows.has(name))return;rows.set(name,{name,key:info.teamKey||key||'',seat:info.seat||seat||null,team:info.team||TEAM_NAMES[key]||'외부',role:info.role||''});}
    for(const[k,v]of Object.entries(ORG))for(const role of['lead','senior','chief'])add(v[role],k,null);
    for(const[k,v]of Object.entries(ORG))for(const name of(v.more||[]))add(name,k,null);
    for(const[name,n]of Object.entries(D.npcs||{}))add(name,n.teamKey,n.seat);
    for(const d of D.dests||[])add(d.name,d.key,d.seat);
    for(const c of D.cards||[])if(c.mode==='visit'&&S.cards[c.id]?.arrived&&S.cards[c.id]?.status!=='done')add(c.visitorName||c.from,'','visitor');
    return[...rows.values()];
  }
  function renderBook(){const q=document.getElementById('fp-search').value.trim(),team=teamSelect.value,host=document.getElementById('fp-contacts');host.innerHTML='';
    const items=contacts().filter(r=>(!team||r.key===team)&&(!q||(r.name+' '+r.team).includes(q)));
    for(const r of items){const row=document.createElement('div');row.className='fp-contact';const info=document.createElement('span'),name=document.createElement('b'),meta=document.createElement('small');name.textContent=r.name;meta.textContent=[r.team,r.role,Talk.hasPending(r.name)?'새 안내 있음':''].filter(Boolean).join(' · ');info.append(name,meta);const b=document.createElement('button');b.className='btn';b.type='button';b.textContent='통화';b.dataset.name=r.name;b.onclick=()=>dial(r);row.append(info,b);host.append(row);}
    if(!items.length){const p=document.createElement('p');p.className='fp-sub';p.textContent='일치하는 상대가 없습니다.';host.append(p);}
    const incoming=document.getElementById('fp-incoming');incoming.innerHTML='';
    for(const id of S.order){const c=CARD(id),st=S.cards[id];if(c?.type!=='phone'||!st?.arrived||st.status==='done')continue;const r=document.createElement('div');r.className='fp-ring-row';const name=document.createElement('span');name.textContent=c.from+' · '+c.subj;const b=document.createElement('button');b.className='btn pri';b.textContent='받기';b.type='button';b.dataset.card=id;b.onclick=()=>{if(blocked())return;dialog.close();closeComputer();phoneRing(id);document.getElementById('phoneTake').click();};r.append(name,b);incoming.append(r);}
  }
  function openPhone(){if(!active()||blocked())return false;if(dialog.open)return true;document.getElementById('fp-search').value='';teamSelect.value='';lastContacts=bookSignature();renderBook();dialog.showModal();document.getElementById('fp-search').focus();return true;}
  async function dial(row){if(!active()||blocked())return false;dialing=true;dialog.close();closeComputer();try{await Talk.npc(row.name,row.seat,row.key);return true;}finally{dialing=false;}}
  document.getElementById('fp-phone-close').onclick=()=>dialog.close();document.getElementById('fp-to-computer').onclick=()=>{dialog.close();openComputer();};phone.onclick=openPhone;
  const pcButton=document.getElementById('pcBtn'),originalPcClick=pcButton.onclick;pcButton.onclick=function(ev){if(blocked())return false;if(dialog.open)dialog.close();return originalPcClick.call(this,ev);};
  document.getElementById('fp-search').oninput=renderBook;teamSelect.onchange=renderBook;
  // Change only navigation language in rendered text, never scenario/scoring data.
  const swaps=[[/자리로 가서 T 로/g,'전화로'],[/자리로 가서 T/g,'전화로'],[/가서 T 로/g,'전화로'],[/가서 T/g,'전화로'],[/T — 이야기 듣기/g,'전화 · 안내 듣기'],[/가서 전달하기/g,'전화로 전달하기'],[/가서 묻기/g,'전화로 묻기'],[/보고하러 가기/g,'전화로 보고'],[/전달하러 가기/g,'전화로 전달'],[/응대하러 가기/g,'전화로 응대'],[/직접 질문/g,'전화로 질문'],[/직접 전달/g,'전화로 전달'],[/대면 보고/g,'전화 보고'],[/대면/g,'전화'],[/자리로 가는 중…/g,'전화 연결 중…'],[/이거 전달드리러 왔어요\./g,'이 건을 전화로 전달드려요.'],[/이만 가 볼게요/g,'통화 마칠게요'],[/그냥 갈게요/g,'통화 취소'],[/사무실로/g,'책상으로'],[/사무실 보기/g,'책상 보기'],[/내 자리로/g,'책상으로']];
  const language=t=>swaps.reduce((s,[a,b])=>s.replace(a,b),String(t));
  const originalCall=Talk.call;Talk.call=function(name,lines,opts){return originalCall(name,lines,{...opts,notice:language(opts?.notice||'')});};
  function translate(el){const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){if(n.parentElement?.closest('textarea,input,script,style,#composeText'))continue;let t=language(n.nodeValue);if(el.id==='side')t=t.replace(/직접 가서/g,'전화로').replace(/찾아가서/g,'전화로 연락해').replace(/그 팀에 가서/g,'그 팀에 전화로');if(t!==n.nodeValue)n.nodeValue=t;}}
  const targets=['top','talk','toasts','card','dialog','phoneBar','endNotice','side','debrief'];for(const id of targets){const el=document.getElementById(id);if(el){new MutationObserver(()=>translate(el)).observe(el,{childList:true,subtree:true,characterData:true});translate(el);}}
  document.getElementById('pcOff').textContent='책상으로';document.querySelector('.tb-esc').textContent='ESC 로 책상';document.getElementById('pcBtn').title='컴퓨터 열기';
  const avatar=document.getElementById('homeAvF');if(avatar?.parentElement)avatar.parentElement.hidden=true;
  const homeTitle=document.getElementById('home').querySelector('h1'),homeSubtitle=homeTitle.querySelector('.ws-entry-subtitle');if(homeSubtitle)homeSubtitle.textContent='책상에서 시작하는 업무 실습';
  window.FPDesk={openComputer,openPhone,closePhone:()=>dialog.close(),contacts,language,status:()=>({dialing,phoneOpen:dialog.open,computerOpen:Desk.isOpen(),phase:S.phase,namespace:'ws7-day1-first-person-v1:'})};
  setInterval(()=>{const pending=window.Talk&&Talk.anyPending();phone.classList.toggle('pending',!!pending);phone.textContent=pending?'전화 · 새 안내':'전화';phone.disabled=!active()||blocked();context.hidden=!Talk.isOpen();if(!context.hidden)context.textContent='전화 연결 · '+(Talk.state().sess?.name||Talk.state().showing?.who||'통화 중');if(dialog.open){const sig=bookSignature();if(sig!==lastContacts){lastContacts=sig;renderBook();}}if(!active()&&dialog.open)dialog.close();},350);
})();

/* Local, unsubmitted form recovery. Never changes card progress or grading. */
(function(){
  const storageKey='fp.compose.drafts.v1';
  let cache=null,timer=null,discarding=false;
  const owner=()=>S.code?JSON.stringify([S.code,S.team,S.ep]):null;
  function state(){
    const id=owner();if(!id)return null;
    if(!cache||cache.owner!==id){
      let saved;try{saved=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}
      cache=saved&&saved.owner===id&&saved.items&&typeof saved.items==='object'?saved:{owner:id,items:{}};
    }
    return cache;
  }
  const key=cp=>JSON.stringify([cp.id,cp.which||'reply',cp.key||'reply']);
  function flush(){clearTimeout(timer);timer=null;if(cache)try{localStorage.setItem(storageKey,JSON.stringify(cache));}catch{}}
  function capture(){
    if(discarding||!S.composing)return;
    const s=state(),cp=S.composing;if(!s)return;
    s.items[key(cp)]={text:$('composeText').value,answer:$('cpWorkIn').value};
    clearTimeout(timer);timer=setTimeout(flush,200);
  }
  function forget(cp){const s=state();if(s){delete s.items[key(cp)];flush();}}
  for(const id of['composeText','cpWorkIn'])$(id).addEventListener('input',capture);
  const open=openComposer,close=closeComposer,send=sendCompose;
  window.openComposer=openComposer=function(id,which,action){
    const result=open(id,which,action),cp=S.composing,s=state(),d=cp&&s&&s.items[key(cp)],st=S.cards[id];
    if(d&&st?.status!=='done'&&!st?.steps?.[cp.which]){
      $('composeText').value=String(d.text||'');$('cpWorkIn').value=String(d.answer||'');
      $('composeText').dispatchEvent(new Event('input',{bubbles:true}));
    }
    return result;
  };
  window.closeComposer=closeComposer=function(){capture();flush();return close();};
  window.sendCompose=sendCompose=async function(id,text,which,action,answer){
    const cp={id,which:which||'reply',key:action||'reply'};
    try{return await send(id,text,which,action,answer);}
    finally{const st=S.cards[id];if(st?.status==='done'||st?.steps?.[cp.which])forget(cp);}
  };
  const cancel=$('composeCancel').onclick;
  $('composeCancel').onclick=function(event){
    const cp=S.composing;discarding=true;
    try{if(cp)forget(cp);return cancel.call(this,event);}finally{discarding=false;}
  };
  addEventListener('pagehide',()=>{capture();flush();});
})();

/* Variant presentation text only. Canonical scoring and stored answers stay intact. */
(function(){
  const wording=text=>String(text).replace(/첫\s*출근/g,'업무 시작');
  function presentation(value){
    if(typeof value==='string')return wording(value);
    if(Array.isArray(value))return value.map(presentation);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,presentation(v)]));
    return value;
  }
  const original=loadStory;
  window.loadStory=loadStory=async function(team,day){
    const story=presentation(await original(team,day));
    if(window.STORY)window.STORY[team+'-ep'+day]=story;
    return story;
  };
  function clean(node){
    if(node.nodeType===Node.TEXT_NODE){
      if(node.parentElement?.closest('textarea,input,script,style'))return;
      const next=wording(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next;
    }else if(node.nodeType===Node.ELEMENT_NODE){
      if(node.matches('textarea,input,script,style'))return;
      const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text;while((text=walker.nextNode()))clean(text);
    }
  }
  new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')clean(record.target);else for(const node of record.addedNodes)clean(node);}}).observe(document.body,{subtree:true,childList:true,characterData:true});
  clean(document.body);
})();
