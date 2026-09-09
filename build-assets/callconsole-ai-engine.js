/* CALLCONSOLE AI Intelligence Layer — AERO Live Coach */
(function(){
  "use strict";
  const cfg = window.CALLCONSOLE_AI_CONFIG || {};
  const endpoint = cfg.endpoint || "https://intelligent-outreach-builder.vercel.app/api/callconsole-ai";
  const timeoutMs = Number(cfg.timeoutMs || 10000);
  const sessions = new Map();

  function clean(v){ return String(v || "").replace(/\s+/g," ").trim(); }
  function sessionKey(ctx){ return [clean(ctx.company),clean(ctx.prospect),clean(ctx.role)].join("|").toLowerCase() || "default"; }
  function systemsFrom(text){
    const t=clean(text).toLowerCase();
    const names=["SAP S/4HANA","SAP Analytics Cloud","SAP Business One","SAP","Anaplan","Jedox","OneStream","Oracle EPM","Oracle Fusion","NetSuite","JD Edwards","Workday Adaptive Planning","Workday","IBM Planning Analytics","TM1","Power BI","Microsoft Fabric","Excel","Google Sheets","QuickBooks","Salesforce","HubSpot","SuccessFactors","Snowflake","Databricks","Digiwin"];
    return names.filter(n=>t.includes(n.toLowerCase()));
  }
  function classify(text){
    const t=clean(text).toLowerCase();
    if(/send (?:me )?(?:an )?(?:email|info)|email me|information/.test(t)) return "information_request";
    if(/busy|not a good time|call back|later|in a meeting/.test(t)) return "timing";
    if(/not interested|no interest|not a priority|no priority/.test(t)) return "low_priority";
    if(/no budget|not budgeted|unfunded|too expensive|cost too much/.test(t)) return "budget";
    if(/already use|already have|current system|happy with|works fine|sap|oracle|anaplan|excel|power bi|quickbooks|workday|salesforce/.test(t)) return "existing_stack";
    if(/wrong person|not me|not responsible|someone else|who handles/.test(t)) return "routing";
    if(/interested|sounds good|makes sense|tell me more|demo|next step|show me|how does it work/.test(t)) return "interest";
    return "discovery";
  }
  function signals(text){
    const t=clean(text).toLowerCase();
    return {
      interest:/interested|sounds good|makes sense|tell me more|demo|next step|show me/.test(t),
      defer:/later|next month|next quarter|next year|planning cycle|budget cycle|not now|revisit/.test(t),
      objection:/not interested|no budget|too expensive|already have|already use|happy with|send info|email me|busy/.test(t),
      stakeholder:/decision maker|decide|approv|management|cfo|controller|it|finance team|other stakeholders/.test(t),
      pain:/manual|spreadsheet|limitation|problem|issue|challenge|disconnected|reconcile|consolidat/.test(t)
    };
  }
  function gaps(ctx){
    const all=(clean(ctx.research)+" "+clean(ctx.prospectSaid)).toLowerCase();
    const out=[];
    if(!/budget|funded|cost|spend/.test(all))out.push("budget/funding");
    if(!/timeline|when|month|quarter|year|planning cycle/.test(all))out.push("timeline");
    if(!/decision|approv|stakeholder|cfo|controller|management/.test(all))out.push("decision process/stakeholders");
    if(!/pain|challenge|manual|spreadsheet|limitation|problem|issue|disconnected/.test(all))out.push("business pain/priority");
    return out;
  }
  function qualification(ctx,history){
    const all=(clean(ctx.research)+" "+history.map(x=>x.prospectSaid).join(" ")).toLowerCase();
    const checks={need:/pain|challenge|manual|spreadsheet|limitation|problem|issue|disconnected|reconcile/.test(all),timeline:/timeline|when|month|quarter|year|planning cycle|budget cycle/.test(all),budget:/budget|funded|cost|spend/.test(all),authority:/decision|approv|stakeholder|cfo|controller|management/.test(all)};
    const score=Object.values(checks).filter(Boolean).length*25;
    return {score,checks,stage:score>=75?"qualified":score>=50?"developing":"early"};
  }
  function historyFor(ctx){ return sessions.get(sessionKey(ctx)) || []; }
  function saveTurn(ctx,kind,result){
    const key=sessionKey(ctx), h=historyFor(ctx);
    h.push({prospectSaid:clean(ctx.prospectSaid),kind,response:clean(result.response),question:clean(result.question),at:Date.now()});
    sessions.set(key,h.slice(-8));
  }
  function localNextMove(ctx){
    const text=clean(ctx.prospectSaid).toLowerCase(), role=clean(ctx.role)||"the team", systems=systemsFrom(ctx.research), primary=systems[0]||"the current setup", kind=classify(text);
    let response,question;
    if(kind==="information_request"){
      response="Absolutely. I can send a short overview. I just want to make sure it is relevant rather than generic.";
      question="Before I do, which area would be most useful for you to look at first — planning, forecasting, consolidation, or reporting?";
    }else if(kind==="timing"){
      response="Completely understand. I do not want to catch you at a bad time.";
      question="Would it be better if I briefly reconnect at a more convenient time, or should I send a short overview first?";
    }else if(kind==="low_priority"){
      response="Understood. I will not force the conversation where there is no current priority.";
      question="Just so I can close the loop correctly, is that because the current process is working well, or simply because there is no initiative around it right now?";
    }else if(kind==="budget"){
      response="That makes sense. I am not asking you to create a project where there is no priority or funding today.";
      question="Is the need something the team expects to revisit during the next planning or budget cycle, or is it not on the roadmap at all?";
    }else if(kind==="existing_stack"){
      response=systems.length?`That makes sense — and I am not suggesting you replace ${primary} if it is already serving its purpose.`:"That makes sense — I am not assuming the current system should be replaced.";
      question=`For ${role}, where does the current setup still create the most manual effort or limitation around planning, forecasting, consolidation, or reporting?`;
    }else if(kind==="routing"){
      response="Thanks for letting me know — I appreciate the clarification.";
      question="Who would normally be closest to planning, forecasting, performance management, or the systems supporting those processes?";
    }else if(kind==="interest"){
      response="Great. Rather than jump straight into a demo, I would like to understand the part of the process you would want to improve first.";
      question="What would you most want to improve today — speed of planning, forecast accuracy, visibility across teams, or reducing manual work?";
    }else{
      response="Totally understand. I am not trying to jump straight into a product pitch before understanding the situation.";
      question=systems.length?`How does ${primary} fit into the process today, and where does the team still spend the most effort outside the core system?`:"Where does the team currently spend the most effort, time, or manual work in this process?";
    }
    const h=historyFor(ctx), q=qualification(ctx,h), result={response,question,signals:signals(ctx.prospectSaid),qualificationGaps:gaps(ctx),qualification:q,systems,classification:kind,source:"offline"};
    saveTurn(ctx,kind,result);
    return result;
  }
  async function nextMove(ctx){
    const fallback=ctx.localFallback?ctx.localFallback():localNextMove(ctx);
    if(!endpoint)return fallback;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const h=historyFor(ctx);
      const payload={task:"live_call_coaching",prospect:clean(ctx.prospect),company:clean(ctx.company),role:clean(ctx.role),product:clean(ctx.product),research:clean(ctx.research),prospectSaid:clean(ctx.prospectSaid),conversationHistory:h.slice(-6),qualification:qualification(ctx,h),classification:classify(ctx.prospectSaid)};
      const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:controller.signal});
      if(!res.ok)throw new Error("AI endpoint "+res.status);
      const data=await res.json();
      if(!data||!clean(data.response)||!clean(data.question))throw new Error("Invalid AI response");
      const result={response:clean(data.response),question:clean(data.question),signals:data.signals||signals(ctx.prospectSaid),qualificationGaps:Array.isArray(data.qualificationGaps)?data.qualificationGaps:gaps(ctx),qualification:data.qualification||qualification(ctx,h),systems:Array.isArray(data.systems)?data.systems:systemsFrom(ctx.research),classification:data.classification||classify(ctx.prospectSaid),source:data.source||"ai"};
      saveTurn(ctx,result.classification,result);
      return result;
    }catch(e){ return fallback; }
    finally{ clearTimeout(timer); }
  }
  window.CALLCONSOLE_AI={nextMove,localNextMove,classify,qualification};
})();
