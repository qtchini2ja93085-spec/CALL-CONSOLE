/* CALLCONSOLE AERO v77 runtime: mode buttons are always switchable. */
(function(){
'use strict';
function unlock(host){
  if(!host)return;
  host.classList.add('aero-runtime-ready');
  host.querySelectorAll('button[data-mode]').forEach(function(b){
    b.disabled=false;
    b.removeAttribute('disabled');
    b.removeAttribute('aria-disabled');
  });
}
function boot(){
  var host=document.getElementById('aero-script-modes');
  if(!host){setTimeout(boot,150);return;}
  unlock(host);
  var observer=new MutationObserver(function(){unlock(host);});
  observer.observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','aria-disabled']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
