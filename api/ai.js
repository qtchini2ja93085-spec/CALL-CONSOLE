// Vercel-compatible CALLCONSOLE AI proxy.
// Keep OPENAI_API_KEY server-side. Never place the key in the Android/web bundle.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({error:"AI service is not configured"});
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const c = body.context || {};
    const system = [
      "You are the AI intelligence layer for CALLCONSOLE, a B2B prospecting and live-call assistant.",
      "Use the supplied prospect/company/research context as evidence, not as permission to invent facts.",
      "Follow a discovery-led, consultative approach. Do not force a product pitch.",
      "Treat Jedox/EPM context as the solution context when supplied.",
      "Return concise, natural language suitable for a salesperson speaking live.",
      "Identify useful signals and qualification gaps from the actual text.",
      "Output JSON only with keys: response, question, signals, qualificationGaps, systems."
    ].join(" ");
    const user = JSON.stringify(c);
    const r = await fetch("https://api.openai.com/v1/responses", {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer "+process.env.OPENAI_API_KEY
      },
      body:JSON.stringify({
        model: process.env.CALLCONSOLE_AI_MODEL || "gpt-5-mini",
        input:[
          {role:"system",content:system},
          {role:"user",content:"Analyze this live call context and produce the next best response and one next-best discovery question. Context: "+user}
        ],
        text:{format:{type:"json_object"}}
      })
    });
    if(!r.ok) return res.status(r.status).json({error:"OpenAI request failed"});
    const data=await r.json();
    const text = data.output_text || "";
    const out = JSON.parse(text);
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({error:"AI processing failed"});
  }
}
