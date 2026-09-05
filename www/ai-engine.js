/* CALLCONSOLE AI Intelligence Layer
 * Uses the Intelligent Outreach Builder-style reasoning pattern while preserving
 * CALLCONSOLE's existing UI and offline workflow.
 *
 * Online mode: POSTs structured call context to /api/ai (or a configured endpoint).
 * Offline mode: uses the existing CALLCONSOLE coach logic as a deterministic fallback.
 */
(function(){
  "use strict";

  const cfg = window.CALLCONSOLE_AI_CONFIG || {};
  const endpoint = cfg.endpoint || (location.protocol === "http:" || location.protocol === "https:" ? "/api/ai" : "");
  const timeoutMs = Number(cfg.timeoutMs || 7000);

  function clean(v){ return String(v || "").replace(/\s+/g," ").trim(); }
  function systemsFrom(text){
    const t=clean(text).toLowerCase();
    const names=["SAP S/4HANA","SAP","Anaplan","Oracle","NetSuite","JD Edwards","OneStream","Excel","Power BI","QuickBooks","Workday","Salesforce","Digiwin"];
    return names.filter(n=>t.includes(n.toLowerCase()));
  }
  function signals(text){
    const t=clean(text).toLowerCase();
    return {
      interest:/interested|sounds good|makes sense|tell me more|demo|next step|show me/.test(t),
      defer:/later|next month|next quarter|next year|planning cycle|budget cycle|not now|revisit/.test(t),
      objection:/not interested|no budget|too expensive|already have|already use|happy with|send info|email me|busy/.test(t),
      stakeholder:/decision maker|decide|approv|management|cfo|controller|it|finance team|other stakeholders/.test(t)
    };
  }
  function gaps(ctx){
    const all=(clean(ctx.research)+" "+clean(ctx.prospectSaid)).toLowerCase();
    const out=[];
    if(!/budget|funded|cost|spend/.test(all)) out.push("budget/funding");
    if(!/timeline|when|month|quarter|year|planning cycle/.test(all)) out.push("timeline");
    if(!/decision|approv|stakeholder|cfo|controller|management/.test(all)) out.push("decision process/stakeholders");
    if(!/pain|challenge|manual|spreadsheet|limitation|problem|issue/.test(all)) out.push("business pain/priority");
    return out;
  }

  function localNextMove(ctx){
    const text=clean(ctx.prospectSaid).toLowerCase();
    const role=clean(ctx.role)||"the team";
    const systems=systemsFrom(ctx.research);
    const primary=systems[0]||"the current setup";
    let response, question;
    if(/send (?:me )?(?:an )?(?:email|info)|email me|information/.test(text)){
      response="Absolutely. I can send a short overview. I just want to make sure it is relevant rather than generic.";
      question="Before I do, which area would be most useful for you to look at first — planning, forecasting, consolidation, or reporting?";
    } else if(/busy|not a good time|call back|later/.test(text)){
      response="Completely understand. I do not want to catch you at a bad time.";
      question="Would it be better if I briefly reconnect at a more convenient time, or should I send a short overview first?";
    } else if(/not interested|no interest|not a priority|no priority/.test(text)){
      response="Understood. I will not force the conversation where there is no current priority.";
      question="Just so I can close the loop correctly, is that because the current process is working well, or simply because there is no initiative around it right now?";
    } else if(/no budget|not budgeted|unfunded/.test(text)){
      response="That makes sense. I am not asking you to create a project where there is no priority or funding today.";
      question="Is the need something the team expects to revisit during the next planning or budget cycle, or is it not on the roadmap at all?";
    } else if(/already use|we have|current system|sap|oracle|anaplan|excel|power bi|quickbooks|workday|salesforce/.test(text)){
      response=systems.length ? `That makes sense — and I am not suggesting you replace ${primary} if it is already serving its purpose.` : "That makes sense — I am not assuming the current system should be replaced.";
      question=`For ${role}, where does the current setup still create the most manual effort or limitation around planning, forecasting, consolidation, or reporting?`;
    } else if(/wrong person|not me|not responsible/.test(text)){
      response="Thanks for letting me know — I appreciate the clarification.";
      question="Who would normally be closest to planning, forecasting, performance management, or the systems supporting those processes?";
    } else {
      response="Totally understand. I am not trying to jump straight into a product pitch before understanding the situation.";
      question=systems.length ? `How does ${primary} fit into the process today, and where does the team still spend the most effort outside the core system?` : "Where does the team currently spend the most effort, time, or manual work in this process?";
    }
    return {response,question,signals:signals(ctx.prospectSaid),qualificationGaps:gaps(ctx),systems,source:"offline"};
  }

  async function nextMove(ctx){
    const fallback=ctx.localFallback ? ctx.localFallback() : localNextMove(ctx);
    if(!endpoint) return fallback;
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const payload={
        task:"live_call_coaching",
        context:{
          prospect:clean(ctx.prospect), company:clean(ctx.company), role:clean(ctx.role),
          product:clean(ctx.product), research:clean(ctx.research), prospectSaid:clean(ctx.prospectSaid)
        }
      };
      const res=await fetch(endpoint,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload), signal:controller.signal
      });
      if(!res.ok) throw new Error("AI endpoint "+res.status);
      const data=await res.json();
      if(!data || !clean(data.response) || !clean(data.question)) throw new Error("Invalid AI response");
      return {
        response:clean(data.response), question:clean(data.question),
        signals:data.signals || signals(ctx.prospectSaid),
        qualificationGaps:Array.isArray(data.qualificationGaps)?data.qualificationGaps:gaps(ctx),
        systems:Array.isArray(data.systems)?data.systems:systemsFrom(ctx.research),
        source:"openai"
      };
    }catch(e){
      return fallback;
    }finally{ clearTimeout(timer); }
  }

  window.CALLCONSOLE_AI={nextMove,localNextMove};
})();
