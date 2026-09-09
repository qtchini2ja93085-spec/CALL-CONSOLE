/* CALLCONSOLE AERO Script Modes: Auto / AI Tailor / Original Local */
(function(){
  'use strict';
  const endpoint=(window.CALLCONSOLE_AI_CONFIG&&window.CALLCONSOLE_AI_CONFIG.endpoint)||'https://intelligent-outreach-builder.vercel.app/api/callconsole-ai';
  const $=s=>document.querySelector(s);
  const val=ids=>{for(const id of ids){const e=document.getElementById(id);if(e){const v=('value' in e?e.value:e.textContent||'').trim();if(v)return v;}}return '';};
  function localScript(){
    const selectors=['#script-output','#generated-script','#call-script','#talk-track','#scriptText','#script-text','textarea[id*="script" i]','[contenteditable="true"][id*="script" i]'];
    for(const sel of selectors){const e=$(sel);if(e){const v=('value' in e?e.value:e.innerText||e.textContent||'').trim();if(v.length>80)return v;}}
    return [...document.querySelectorAll('textarea,[contenteditable="true"]')].map(e=>('value' in e?e.value:e.innerText||e.textContent||'').trim()).filter(v=>v.length>120).sort((a,b)=>b.length-a.length)[0]||'';
  }
  function context(){return{prospect:val(['f-prospect','prospect','prospect-name']),company:val(['f-company','company','company-name']),role:val(['f-role','role','role-input']),department:val(['f-department','department','department-input','function','function-input']),product:val(['f-product','product'])||'Jedox',research:val(['f-research','research','research-notes']),localScript:localScript()};}
  function uncertain(c){const r=c.role.toLowerCase(),d=c.department.toLowerCase(),x=c.research.toLowerCase(),all=r+' '+d+' '+x;return !r||!d||r.length<4||/unknown|unclear|unsure|maybe|might|probably|appears|possibly/.test(all)||(/transformation|operations|strategy|enablement|excellence|business partner|program|portfolio/.test(all)&&!/(cfo|controller|fp&a|finance|it|cio|hr|human resources|sales|marketing|supply chain|procurement|treasury|accounting)/.test(all));}
  function add(){
    if(document.getElementById('aero-script-modes'))return;
    const anchor=$('#script-output')||$('#generated-script')||$('#call-script')||$('#talk-track')||document.querySelector('[id*="script" i]');
    const host=document.createElement('div');host.id='aero-script-modes';
    host.innerHTML='<div class="aero-title">SCRIPT INTELLIGENCE</div><div class="aero-sub">The local script stays untouched. AI creates a separate tailored version.</div><div class="aero-btns"><button type="button" data-mode="auto">⚡ AUTO / SMART</button><button type="button" data-mode="ai">🧠 AI TAILOR</button><button type="button" data-mode="local">📄 ORIGINAL / LOCAL</button></div><div id="aero-script-status">⚡ Auto mode ready.</div><div id="aero-ai-script"><div class="aero-ai-label">🧠 AI TAILORED SCRIPT</div><div id="aero-ai-script-text" class="aero-ai-script-text"></div><div id="aero-ai-meta" class="aero-ai-meta"></div><div id="aero-ai-qs" class="aero-ai-q"></div></div>';
    (anchor&&anchor.parentNode?anchor.parentNode:(document.querySelector('main')||document.body)).appendChild(host);
    host.querySelectorAll('button[data-mode]').forEach(b=>b.addEventListener('click',()=>run(b.dataset.mode)));
    setMode('auto');
  }
  function setMode(mode){const box=$('#aero-script-modes');if(!box)return;box.querySelectorAll('button[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));}
  function status(t){const e=$('#aero-script-status');if(e)e.textContent=t;}
  async function run(mode){
    const c=context();setMode(mode);
    if(mode==='local'){status('📄 ORIGINAL / LOCAL ACTIVE — proven deterministic tailoring.');const a=$('#aero-ai-script');if(a)a.classList.remove('open');return;}
    if(mode==='auto'){
      if(uncertain(c)){status('⚡ AUTO selected 🧠 AI TAILOR — context is uncertain or complex.');return run('ai');}
      status('⚡ AUTO selected 📄 ORIGINAL / LOCAL — context is sufficiently reliable.');const a=$('#aero-ai-script');if(a)a.classList.remove('open');return;
    }
    status('🧠 AI TAILORING…');const out=$('#aero-ai-script');if(out)out.classList.add('open');
    try{
      const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...c,task:'script_tailoring'})});
      const d=await r.json();if(!d||!d.script)throw new Error('No tailored script returned');
      $('#aero-ai-script-text').textContent=d.script;
      $('#aero-ai-meta').textContent=(d.source==='gemini'?'🧠 AI TAILORED':'⚡ LOCAL FALLBACK')+' • Confidence: '+(d.confidence||'unknown')+' • '+(d.reason||'Evidence-based tailoring');
      $('#aero-ai-qs').innerHTML='<strong>Suggested discovery questions</strong>'+(Array.isArray(d.discoveryQuestions)?d.discoveryQuestions.map(q=>'<div>• '+String(q).replace(/</g,'&lt;')+'</div>').join(''):'');
      status(d.source==='gemini'?'🧠 AI TAILORING APPLIED — separate AI version generated.':'⚡ AI unavailable — original/local preserved.');
    }catch(e){status('⚠️ AI tailoring failed — ORIGINAL / LOCAL remains available.');}
  }
  const css=document.createElement('style');css.textContent='#aero-script-modes{margin:12px 0;padding:12px;border:1px solid rgba(127,127,127,.25);border-radius:14px;background:rgba(127,127,127,.06)}#aero-script-modes .aero-title{font-weight:800;margin-bottom:7px}#aero-script-modes .aero-sub{font-size:12px;opacity:.72;margin-bottom:9px}#aero-script-modes .aero-btns{display:flex;gap:7px;flex-wrap:wrap}#aero-script-modes button{border:1px solid rgba(127,127,127,.35);border-radius:10px;padding:8px 11px;background:transparent;color:inherit;font-weight:700;cursor:pointer}#aero-script-modes button.active{box-shadow:0 0 0 2px rgba(80,160,255,.25);font-weight:900}#aero-script-status{margin-top:9px;font-size:12px;font-weight:700}#aero-ai-script{display:none;margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(80,160,255,.35);background:rgba(80,160,255,.06)}#aero-ai-script.open{display:block}.aero-ai-label{font-size:11px;font-weight:900}.aero-ai-script-text{white-space:pre-wrap;line-height:1.5;margin-top:7px}.aero-ai-meta{margin-top:8px;font-size:12px;opacity:.78}.aero-ai-q{margin-top:8px}.aero-ai-q strong{display:block;margin-bottom:3px}';document.head.appendChild(css);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
  new MutationObserver(()=>{if(!document.getElementById('aero-script-modes'))add();}).observe(document.body,{childList:true,subtree:true});
})();
