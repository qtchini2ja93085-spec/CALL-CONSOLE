/* CALLCONSOLE AERO Script Modes: Auto / AI Tailor / Original Local */
(function(){
  'use strict';
  const endpoint=(window.CALLCONSOLE_AI_CONFIG&&window.CALLCONSOLE_AI_CONFIG.endpoint)||'https://intelligent-outreach-builder.vercel.app/api/callconsole-ai';
  const $=s=>document.querySelector(s);
  const val=ids=>{for(const id of ids){const e=document.getElementById(id);if(e){const v=('value' in e?e.value:e.textContent||'').trim();if(v)return v;}}return '';};
  function localScript(){
    const selectors=['#script-page','#script-output','#generated-script','#call-script','#talk-track','#scriptText','#script-text','textarea[id*="script" i]','[contenteditable="true"][id*="script" i]'];
    for(const sel of selectors){const e=$(sel);if(e){const v=('value' in e?e.value:e.innerText||e.textContent||'').trim();if(v.length>80)return v;}}
    return '';
  }
  function context(){return{prospect:val(['f-name','f-prospect','prospect','prospect-name']),company:val(['f-company','company','company-name']),role:val(['f-role','role','role-input']),department:val(['f-department','department','department-input','function','function-input']),product:val(['f-product','product'])||'Jedox',research:val(['f-research','research','research-notes']),localScript:localScript()};}
  const standardRoles=/\b(cfo|chief financial officer|finance director|finance manager|fp&a|financial planning|controller|chief information officer|cio|it director|it manager|information technology|data analytics|analytics|chief human resources officer|chro|hr director|hr manager|human resources|sales director|sales manager|chief sales officer|marketing director|marketing manager|supply chain|procurement|treasury|accounting|accountant|chief executive officer|ceo|general manager)\b/i;
  const complexRoles=/\b(transformation|operations|strategy|enablement|excellence|business partner|program|portfolio|digital|change|shared services)\b/i;
  const uncertainWords=/\b(unknown|unclear|unsure|maybe|might|probably|appears|possibly|potentially|not sure|could be)\b/i;
  function decision(c){const all=[c.role,c.department,c.research].join(' ');if(uncertainWords.test(all))return{ai:true,reason:'Research contains uncertainty; AI should use cautious discovery-led language.'};if(!c.role&&!c.department)return{ai:true,reason:'No role/function is available; AI should avoid unsupported assumptions.'};if(complexRoles.test(all)&&!standardRoles.test(all))return{ai:true,reason:'Role/function is cross-functional or non-standard; AI can better align the message to the evidence.'};if(c.research.length<25)return{ai:false,reason:'No meaningful research signal requires AI interpretation; use the deterministic local script.'};return{ai:false,reason:'Role/function is sufficiently clear and research is usable; use the proven deterministic local tailoring.'};}
  function findTailorAnchor(){
    const selectors=['#apply-btn','#apply-tailor','#applyTailor','#tailor-button','#apply-and-tailor'];
    for(const sel of selectors){const e=$(sel);if(e)return e;}
    const candidates=[...document.querySelectorAll('button,input[type="button"],input[type="submit"]')];
    return candidates.find(e=>/apply\s*(?:&|and)\s*tailor/i.test(('value' in e?e.value:e.textContent||'').trim()))||null;
  }
  function bind(host){
    if(!host||host.dataset.aeroBound==='1')return;
    host.dataset.aeroBound='1';
    host.querySelectorAll('button[data-mode]').forEach(b=>b.addEventListener('click',()=>run(b.dataset.mode)));
    setMode('auto');
  }
  function add(){
    let host=document.getElementById('aero-script-modes');
    if(host){bind(host);return;}
    host=document.createElement('div');
    host.id='aero-script-modes';
    host.innerHTML='<div class="aero-title">SCRIPT INTELLIGENCE</div><div class="aero-sub">Choose how CALLCONSOLE tailors the script. Original/local is never overwritten.</div><div class="aero-btns"><button type="button" data-mode="auto">⚡ AUTO / SMART</button><button type="button" data-mode="ai">🧠 AI TAILOR</button><button type="button" data-mode="local">📄 ORIGINAL / LOCAL</button></div><div id="aero-script-status">⚡ Auto mode ready.</div><div id="aero-ai-script"><div class="aero-ai-label">🧠 AI TAILORED SCRIPT</div><div id="aero-ai-script-text" class="aero-ai-script-text"></div><div id="aero-ai-meta" class="aero-ai-meta"></div><div id="aero-ai-qs" class="aero-ai-q"></div></div>';
    const anchor=findTailorAnchor();
    if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(host,anchor.nextSibling);
    else{const scriptAnchor=$('#script-page')||$('#script-output')||$('#generated-script')||$('#call-script')||$('#talk-track');(scriptAnchor&&scriptAnchor.parentNode?scriptAnchor.parentNode:(document.querySelector('main')||document.body)).appendChild(host);}
    bind(host);
  }
  function setMode(mode){const box=$('#aero-script-modes');if(!box)return;box.querySelectorAll('button[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));}
  function status(t){const e=$('#aero-script-status');if(e)e.textContent=t;}
  function clearAI(){const a=$('#aero-ai-script');if(a)a.classList.remove('open');}
  function renderQuestions(list){const box=$('#aero-ai-qs');if(!box)return;box.replaceChildren();const strong=document.createElement('strong');strong.textContent='Suggested discovery questions';box.appendChild(strong);if(!Array.isArray(list))return;for(const q of list.slice(0,5)){const div=document.createElement('div');div.textContent='• '+String(q||'').trim();box.appendChild(div);}}
  async function run(mode){const c=context();setMode(mode);if(mode==='local'){status('📄 ORIGINAL / LOCAL ACTIVE — proven deterministic tailoring.');clearAI();return;}if(mode==='auto'){const d=decision(c);if(d.ai){status('⚡ AUTO → 🧠 AI TAILOR — '+d.reason);return run('ai');}status('⚡ AUTO → 📄 ORIGINAL / LOCAL — '+d.reason);clearAI();return;}status('🧠 AI TAILORING…');const out=$('#aero-ai-script');if(out)out.classList.add('open');try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...c,task:'script_tailoring'})});if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();if(!d||!d.script)throw new Error('No tailored script returned');const text=$('#aero-ai-script-text');if(text)text.textContent=d.script;const meta=$('#aero-ai-meta');if(meta)meta.textContent=(d.source==='gemini'?'🧠 AI TAILORED':'⚡ LOCAL FALLBACK')+' • Confidence: '+(d.confidence||'unknown')+' • '+(d.reason||'Evidence-based tailoring');renderQuestions(d.discoveryQuestions);status(d.source==='gemini'?'🧠 AI TAILORING APPLIED — separate AI version generated.':'⚡ AI unavailable — original/local preserved.');}catch(e){clearAI();status('⚠️ AI tailoring failed — ORIGINAL / LOCAL remains available.');}}
  const css=document.createElement('style');css.textContent='#aero-script-modes{margin:12px 0;padding:12px;border:1px solid rgba(127,127,127,.25);border-radius:14px;background:rgba(127,127,127,.06);position:relative;z-index:2}#aero-script-modes .aero-title{font-weight:800;margin-bottom:7px}#aero-script-modes .aero-sub{font-size:12px;opacity:.72;margin-bottom:9px}#aero-script-modes .aero-btns{display:flex;gap:7px;flex-wrap:wrap}#aero-script-modes button{border:1px solid rgba(127,127,127,.35);border-radius:10px;padding:8px 11px;background:transparent;color:inherit;font-weight:700;cursor:pointer}#aero-script-modes button.active{box-shadow:0 0 0 2px rgba(80,160,255,.25);font-weight:900}#aero-script-status{margin-top:9px;font-size:12px;font-weight:700}#aero-ai-script{display:none;margin-top:10px;padding:12px;border-radius:12px;border:1px solid rgba(80,160,255,.35);background:rgba(80,160,255,.06)}#aero-ai-script.open{display:block}.aero-ai-label{font-size:11px;font-weight:900}.aero-ai-script-text{white-space:pre-wrap;line-height:1.5;margin-top:7px}.aero-ai-meta{margin-top:8px;font-size:12px;opacity:.78}.aero-ai-q{margin-top:8px}.aero-ai-q strong{display:block;margin-bottom:3px}';document.head.appendChild(css);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();new MutationObserver(()=>{if(!document.getElementById('aero-script-modes'))add();}).observe(document.body,{childList:true,subtree:true});
})();