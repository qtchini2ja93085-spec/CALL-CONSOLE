// CALLCONSOLE AI endpoint compatible with script tailoring and live-call coaching.
// Keep provider keys server-side. Configure OPENAI_API_KEY in Vercel and redeploy.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI service is not configured" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const task = body.task || "script_tailoring";
    const context = body.context && typeof body.context === "object" ? body.context : body;
    const localScript = String(context.localScript || "").trim();
    const role = String(context.role || "the prospect's role").trim();
    const company = String(context.company || "the company").trim();
    const research = String(context.research || "").trim();
    const prospect = String(context.prospect || "").trim();

    const system = task === "live_call_coaching"
      ? "You are CALLCONSOLE, a concise B2B live-call coach. Use only supplied facts; do not invent company details. Be consultative and discovery-led. Return JSON only with response, question, signals, qualificationGaps, systems, classification."
      : "You are CALLCONSOLE, a B2B prospecting script tailoring specialist for EPM Solutions and Jedox. Tailor to the stated role and evidence, never invent facts. Preserve the original script's structure, styling, and intent; suggest only exact surgical text replacements. Return JSON only with script (brief description), replacements (array of {find,replace}), and source='openai'. Each find must be an exact substring from localScript, replacements must be specific, and do not return empty replacements. If the role is CCO/chief commercial officer, focus on commercial performance, revenue visibility, sales/commercial planning, forecasting, and cross-functional alignment only where relevant; use discovery questions rather than assuming pain. Also return response, question, signals, qualificationGaps, systems if useful.";

    const user = task === "live_call_coaching"
      ? JSON.stringify(context)
      : JSON.stringify({ prospect, company, role, research, product: context.product || "Jedox", localScript });

    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: process.env.CALLCONSOLE_AI_MODEL || "gpt-5-mini",
        input: [
          { role: "system", content: system },
          { role: "user", content: "Process this CALLCONSOLE request: " + user }
        ],
        text: { format: { type: "json_object" } }
      })
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("CALLCONSOLE OpenAI error", upstream.status, detail.slice(0, 500));
      return res.status(502).json({ error: "AI provider request failed", providerStatus: upstream.status });
    }

    const payload = await upstream.json();
    const outputText = payload.output_text || "";
    if (!outputText) return res.status(502).json({ error: "AI provider returned no output" });
    const result = JSON.parse(outputText);

    if (task !== "live_call_coaching") {
      if (!Array.isArray(result.replacements) || result.replacements.length === 0) {
        return res.status(502).json({ error: "AI returned no usable script edits" });
      }
      result.source = "openai";
      result.script = String(result.script || "Tailored script edits generated.");
      result.replacements = result.replacements.slice(0, 12).filter(item =>
        item && typeof item.find === "string" && item.find &&
        typeof item.replace === "string" && item.find !== item.replace &&
        localScript.includes(item.find)
      );
      if (!result.replacements.length) return res.status(502).json({ error: "AI edits did not match the original script" });
    } else {
      if (!result.response || !result.question) return res.status(502).json({ error: "AI returned an incomplete coaching response" });
      result.source = "openai";
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error("CALLCONSOLE AI processing error", error && error.message);
    return res.status(502).json({ error: "AI processing failed" });
  }
}
