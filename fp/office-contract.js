/* Explicit compatibility surface for the existing engine, with no actors/routes. */
(function(){let ready=false,control=true,screen;const labels={},hints={};
  const go=kind=>{if(!control)return;if(parent.FPDesk){kind==='computer'?parent.FPDesk.openComputer():parent.FPDesk.openPhone();}else if(kind==='computer'&&screen)screen();};
  for(const id of ['desk-computer','fallback-computer'])document.getElementById(id).onclick=()=>go('computer');
  for(const id of ['desk-phone','fallback-phone'])document.getElementById(id).onclick=()=>go('phone');
  window.__office={firstPerson:true,ready:()=>ready,full:()=>ready,warmupInfo:()=>({ready,stage:'책상 준비',ms:0}),setLabel:(s,n)=>labels[s]=n,setTalkHint:(s,t)=>hints[s]=t,labels,hints,npcAt:()=>null,isSeated:()=>true,goSeat:async()=>true,setControl:on=>{control=!!on;for(const e of document.querySelectorAll('button'))e.disabled=!control;},get control(){return control;},busy:false,walking:false,roomOf:()=>new URLSearchParams(location.search).get('team')||'cs',view(){},camFollow(){},hush(){},freeze(){},setPlayerChar(){},onScreenClick:fn=>screen=fn,sceneReady(ok=true){ready=true;this.webgl=ok;if(!ok)document.body.classList.add('fallback');},onTalk(){},onSay(){},onChoose(){}};
  // The same desk controls remain usable when WebGL is unavailable.
  setTimeout(()=>{if(!ready)__office.sceneReady(false);},6000);
})();
