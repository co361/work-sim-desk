/* Guest entry uses the existing check/load/save path; work and clock stay manual. */
(function(){
  const key='demo.guests.v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}');}catch(_){return {};}};
  const write=v=>localStorage.setItem(key,JSON.stringify(v));
  const originalHome=window.showHome;
  function labels(){
    document.title='WORK SIM · 책상 근무 1일차';
    $('homeCode').hidden=true;$('homeGo').hidden=true;
    const sel=$('homeTeam');for(const o of [...sel.options])if(o.value!=='cs')o.remove();sel.value='cs';
    const title=$('home').querySelector('h1');const subtitle=title.querySelector('.ws-entry-subtitle');if(subtitle)subtitle.textContent='책상에서 시작하는 첫 출근';else title.textContent='WORK SIM · 책상 근무 1일차';
    $('home').querySelector('.sub').textContent='1인칭 책상에서 전화와 메일로 진행하는 고객상담팀 1일차 · 약 1시간';
    $('homeBackend').textContent='이 브라우저에서 이어 하기 · 업무 기록과 결과 PDF 저장';
    const saved=!!read().cs;$('homeDemo').textContent=saved?'1일차 이어 하기':'1일차 시작';$('homeDemo').classList.add('pri');
    $('homeReset').textContent='새로 시작';paintHomeAvatar();
  }
  window.showHome=async function(){await originalHome();labels();};
  $('homeTeam').onchange=()=>{S.code=null;P=null;renderHomeDays();labels();};
  $('homeDemo').onclick=async()=>{
    const b=$('homeDemo');if(b.disabled)return;b.disabled=true;homeMsg('첫 출근을 준비하고 있어요…');
    try{
      await window.__backendReady;const guests=read();let code=guests.cs;
      if(code){const r=await Backend.check(code);if(!r.ok)code=null;}
      if(!code){const response=await fetch("https://script.google.com/macros/s/AKfycbxhSsgpwpJyQkwzZErA8RW8RfTtndAjJHCt6CYHwPYvYkZB53XR3rWPLfVVVmNV3CQ/exec",{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'ws7demoSession',team:'cs'})});const r=await response.json();if(!r.ok)throw Error(r.reason||'시작하지 못했어요');code=r.code;guests.cs=code;write(guests);}
      $('home').classList.remove('open');$('loading').classList.remove('off');await enterWithCode(code,1);
    }catch(e){await showHome();homeMsg(e.message||'연결 상태를 확인해 주세요.');}finally{b.disabled=false;}
  };
  $('homeReset').onclick=async()=>{
    if(!confirm('1일차를 새로 시작할까요? 현재 브라우저의 이어 하기 연결을 새로 만듭니다.'))return;
    write({});try{localStorage.removeItem(LS_KEY());localStorage.removeItem('ws7.code');}catch(_){}S.code=null;P=null;renderHomeDays();labels();
  };
  labels();
})();
