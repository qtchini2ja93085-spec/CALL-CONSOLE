/* CALLCONSOLE AERO runtime safety/visibility fix */
(function(){
'use strict';
function boot(){
  var host=document.getElementById('aero-script-modes');
  if(!host){setTimeout(boot,250);return;}
  host.classList.add('aero-runtime-ready');
  var buttons=host.querySelectorAll('button[data-mode]');
  buttons.forEach(function(b){b.disabled=false;b.removeAttribute('aria-disabled');});
  host.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('button[data-mode]');
    if(!b)return;
    if(b.disabled){b.disabled=false;}
    var mode=b.getAttribute('data-mode');
    if(mode==='ai'){
      var st=document.getElementById('aero-script-status');
      if(st)st.textContent='🧠 AI TAILORING… connecting to AI engine';
      var ind=document.getElementById('aero-ai-indicator');
      if(ind){ind.className='aero-indicator ai loading';ind.innerHTML='<span class="aero-spinner" aria-hidden="true"></span> AI TAILORING…';}
    }
  },true);
  var observer=new MutationObserver(function(){
    host.querySelectorAll('button[data-mode]').forEach(function(b){
      if(!host.classList.contains('aero-busy'))b.disabled=false;
    });
  });
  observer.observe(host,{subtree:true,attributes:true,attributeFilter:['disabled','class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
