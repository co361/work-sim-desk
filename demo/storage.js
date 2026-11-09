/* Keep this local demo separate from classroom and previous verification saves. */
(function(){
  const base={get:Storage.prototype.getItem,set:Storage.prototype.setItem,remove:Storage.prototype.removeItem,key:Storage.prototype.key,length:Object.getOwnPropertyDescriptor(Storage.prototype,'length').get},prefix='ws7-day1-first-person-public-v1:';
  Storage.prototype.getItem=function(k){return base.get.call(this,prefix+k);};
  Storage.prototype.setItem=function(k,v){return base.set.call(this,prefix+k,v);};
  Storage.prototype.removeItem=function(k){return base.remove.call(this,prefix+k);};
  // Existing PC icon cleanup enumerates Storage.length/key through an alias.
  // Expose only this variant's keys, without changing the original PC functions.
  function ownKeys(storage){
    const keys=[];
    for(let i=0,n=base.length.call(storage);i<n;i++){
      const key=base.key.call(storage,i);if(key?.startsWith(prefix))keys.push(key);
    }
    return keys;
  }
  Storage.prototype.key=function(index){return ownKeys(this)[Number(index)]?.slice(prefix.length)??null;};
  Object.defineProperty(Storage.prototype,'length',{configurable:true,enumerable:true,get(){return ownKeys(this).length;}});
  Storage.prototype.clear=function(){for(const key of ownKeys(this))base.remove.call(this,key);};
  const url=new URL(location.href);
  for(const k of ['code','api','fresh','speed'])url.searchParams.delete(k);
  if(url.searchParams.has('ep')){
    let code=null;try{code=JSON.parse(base.get.call(localStorage,prefix+'demo.guests.v1')||'{}').cs;}catch(_){}
    if(/^DEMO-[A-F0-9]{32}$/.test(code||'')){url.searchParams.set('team','cs');url.searchParams.set('ep','1');url.searchParams.set('code',code);}
    else{url.searchParams.delete('ep');url.searchParams.delete('team');}
  }
  history.replaceState(null,'',url.pathname+url.search+url.hash);
})();
