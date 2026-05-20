import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const trainingPageUrl = "https://www.ace-midas-training.co.uk/training";
const compliancePageUrl = "https://www.ace-midas-training.co.uk/compliance";

const agents: Record<string, { name: string; title: string }> = {
  mia: { name: "Mia", title: "Outreach Coordinator" },
  theo: { name: "Theo", title: "Training Bookings & Sales Coordinator" },
  ellis: { name: "Ellis", title: "Inbox Management" },
};

const prices = [
  { title: "MiDAS Standard", price: "GBP 165", aliases: ["midas standard", "midas"] },
  { title: "MiDAS Accessible", price: "GBP 210", aliases: ["midas accessible", "accessible midas"] },
  { title: "PATS Standard", price: "GBP 125", aliases: ["pats standard", "pats"] },
  { title: "PATS Accessible", price: "GBP 155-185", aliases: ["pats accessible", "accessible pats"] },
  { title: "First Aid at Work", price: "GBP 205-225", aliases: ["first aid at work", "faw"] },
  { title: "Children's Transport First Aid", price: "GBP 95-135", aliases: ["children's transport first aid", "childrens transport first aid", "ctfa"] },
];

const serviceTerms = ["pats", "midas", "first aid", "ctfa", "faw", "efaw", "buccal", "midazolam", "refresher", "compliance", "training", "onsite", "group", "discount", "certificate", "wheelchair", "accessible", "monthly fee", "compliance app"];

function cleanKbText(value: unknown) {
  return String(value ?? "").replace(/Â£/g, "£").replace(/\s+/g, " ").trim();
}

function normalise(value: unknown) {
  return cleanKbText(value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9£\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenise(value: unknown) {
  const stopWords = new Set(["the", "and", "for", "with", "that", "this", "you", "your", "our", "are", "can", "what", "how", "does", "will", "from", "about", "please", "provide"]);
  return normalise(value).split(" ").filter((token) => token.length > 2 && !stopWords.has(token));
}

function scoreKnowledgeEntry(question: string, entry: any) {
  const qNorm = normalise(question);
  const qTokens = new Set(tokenise(question));
  const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
  const entryText = normalise(`${entry.title || ""} ${entry.question || ""} ${entry.category || ""} ${keywords.join(" ")} ${entry.approved_answer || ""}`);
  const exactText = normalise(`${entry.title || ""} ${entry.question || ""}`);
  let score = 0;
  if (exactText && (qNorm === exactText || exactText.includes(qNorm) || qNorm.includes(exactText))) score += 90;
  const keywordHits = keywords.filter((keyword: string) => {
    const text = normalise(keyword);
    return text && (qNorm.includes(text) || text.includes(qNorm));
  });
  score += Math.min(45, keywordHits.length * 12);
  const tokenHits = [...qTokens].filter((token) => entryText.includes(token));
  score += Math.min(35, tokenHits.length * 5);
  const serviceHits = serviceTerms.filter((term) => qNorm.includes(term) && entryText.includes(term));
  score += Math.min(30, serviceHits.length * 8);
  score += Math.min(12, Number(entry.priority || 50) / 10);
  return Math.round(score);
}

async function getKnowledgeContext(supabase: ReturnType<typeof createClient>, item: any) {
  try {
    const { data, error } = await supabase
      .from("mia_knowledge_base_entries")
      .select("id, category, title, question, approved_answer, keywords, priority, confidence_threshold")
      .eq("status", "approved")
      .order("priority", { ascending: false })
      .limit(200);
    if (error || !Array.isArray(data) || !data.length) return { context: "No approved knowledge base entries were available.", matches: [] as Record<string, unknown>[] };
    const question = `${item.subject || ""} ${item.message_body || ""}`;
    const matches = data
      .map((entry) => ({ entry, score: scoreKnowledgeEntry(question, entry) }))
      .filter((match) => match.score >= Number(match.entry.confidence_threshold || 35))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    if (!matches.length) return { context: "No strong approved knowledge base match was found. Use only the general approved rules and avoid inventing details.", matches: [] as Record<string, unknown>[] };
    const context = matches.map(({ entry, score }, index) => `${index + 1}. ${entry.category} - ${entry.title} (score ${score})\nApproved answer/fact: ${cleanKbText(entry.approved_answer)}`).join("\n\n");
    return {
      context,
      matches: matches.map(({ entry, score }) => ({ id: entry.id, category: entry.category, title: entry.title, score })),
    };
  } catch (error) {
    console.error("Mia knowledge base lookup error:", error);
    return { context: "Knowledge base lookup failed. Use only the general approved rules and avoid inventing details.", matches: [] as Record<string, unknown>[] };
  }
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

function esc(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function html(text: string) {
  return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">${esc(text).replace(/\n/g, "<br />")}</div>`;
}

function estimate(message: string) {
  const text = message.toLowerCase();
  const course = prices.find((item) => item.aliases.some((alias) => text.includes(alias)));
  const count = Number((text.match(/\b(\d{1,3})\s*(people|persons|attendees|delegates|staff|drivers|passenger assistants|pas|learners|candidates)?\b/i) || [])[1] || 0);
  if (!course || !count) return null;
  const nums = course.price.match(/\d+/g)?.map(Number) || [];
  if (!nums.length) return null;
  const unit = Math.max(...nums);
  return { course_title: course.title, attendee_count: count, listed_price: course.price, estimated_subtotal: unit * count };
}

async function sendEmail(resendKey: string, body: Record<string, unknown>) {
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: response.ok, status: response.status, data, text };
}

async function logAgent(supabase: ReturnType<typeof createClient>, agent: string, action_type: string, summary: string, status: string, metadata: Record<string, unknown>) {
  const identity = agents[agent] || agents.ellis;
  const { error } = await supabase.from("agent_activity_logs").insert({
    agent_key: agent,
    agent_name: identity.name,
    agent_role: identity.title,
    action_type,
    action_label: summary,
    summary,
    status,
    approval_required: false,
    metadata,
  });
  if (error) console.error("Agent activity insert error:", error);
}

async function logAudit(supabase: ReturnType<typeof createClient>, agent: string, action_type: string, summary: string, status: string, metadata: Record<string, unknown>) {
  const identity = agents[agent] || agents.ellis;
  const { error } = await supabase.from("audit_logs").insert({ actor_type: "agent", actor_name: `${identity.name} - ${identity.title}`, action_type, summary, status, metadata });
  if (error) console.error("Audit log error:", error);
}

const rules = `
You write natural customer-facing email replies for ACE MiDAS Training.
Answer the actual question first. Give one clear next step.
Never mention routing, classification, assigned agents, approval rules, workflow status, system decisions or internal rules.
Mia can answer training, refresher, PATS, MiDAS, First Aid, compliance app/service and monthly fee enquiries in general terms.
Theo can answer booking process, group booking, onsite training and safe pricing estimate questions from supplied prices.
Theo must not confirm dates, promise availability, confirm bookings, send payment links, agree custom discounts or invent prices.
If exact information is missing, say: "I can help with that, but I may need a little more information to give the most accurate answer."
Return only the email body as plain text, including the correct signature.
`;

function schema() {
  return { type: "object", properties: { email_body: { type: "string" } }, required: ["email_body"], additionalProperties: false };
}

function prompt(message: any, currentEstimate: ReturnType<typeof estimate>, knowledgeContext: string) {
  const agent = agents[message.assigned_agent] || agents.mia;
  return `${rules}

Agent: ${agent.name}
Signature:
Kind regards,
${agent.name}
${agent.title}
ACE MiDAS Training

Customer name: ${message.from_name || "there"}
Organisation: ${message.organisation || "Not provided"}
Subject: ${message.subject || "Website enquiry"}
Classification context: ${message.classification}

Useful context:
- Training page: ${trainingPageUrl}
- Compliance page: ${compliancePageUrl}
- Approved course prices: ${prices.map((item) => `${item.title}: ${item.price}`).join("; ")}
- Compliance app/service support can include training records, certificate oversight, refresher reminders, reporting, medication tracking, journey tracking and setup support.
- Monthly/service fees depend on package, tools and organisation requirements unless an approved figure is supplied.
${currentEstimate ? `- Indicative estimate: ${currentEstimate.attendee_count} attendee(s), ${currentEstimate.course_title}, listed price ${currentEstimate.listed_price}, approximate subtotal GBP ${currentEstimate.estimated_subtotal}. Say it is indicative and excludes travel/custom requirements.` : ""}

Approved ACE MiDAS Training knowledge base matches:
${knowledgeContext}

Use the approved knowledge base matches above as the source of truth. Do not add claims, services, prices, dates, availability, accreditations, certificate validity, medical advice, legal advice or safeguarding advice unless they are present in the approved context.

Customer message:
${message.message_body}`;
}

function clean(text: string, agentKey: string) {
  const blocked = ["routed", "classified", "assigned agent", "approval_required", "approval required", "internal rule", "system decision", "workflow status", "this message does not confirm"];
  const cleaned = String(text || "").split(/\r?\n/).filter((line) => !blocked.some((word) => line.toLowerCase().includes(word))).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const agent = agents[agentKey] || agents.mia;
  if (cleaned.toLowerCase().includes(agent.name.toLowerCase()) && cleaned.includes("ACE MiDAS Training")) return cleaned;
  return `${cleaned}\n\nKind regards,\n${agent.name}\n${agent.title}\nACE MiDAS Training`.trim();
}

async function generateWithManus(apiKey: string, message: any, currentEstimate: ReturnType<typeof estimate>, knowledgeContext: string) {
  const created = await fetch("https://api.manus.ai/v2/task.create", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-manus-api-key": apiKey },
    body: JSON.stringify({
      title: "ACE MiDAS customer response",
      hide_in_task_list: true,
      interactive_mode: false,
      agent_profile: "manus-1.6-lite",
      message: { content: prompt(message, currentEstimate, knowledgeContext) },
      structured_output_schema: schema(),
    }),
  });
  const createText = await created.text();
  const createData = createText ? JSON.parse(createText) : null;
  if (!created.ok || !createData?.ok || !createData?.task_id) throw new Error(createData?.error?.message || createText || "Manus task creation failed.");

  for (let attempt = 0; attempt < 18; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 2500 : 2500));
    const listed = await fetch(`https://api.manus.ai/v2/task.listMessages?task_id=${encodeURIComponent(createData.task_id)}&order=desc&limit=30`, { headers: { "x-manus-api-key": apiKey } });
    const listText = await listed.text();
    const listData = listText ? JSON.parse(listText) : null;
    if (!listed.ok || !listData?.ok) {
      const detail = listData?.error?.message || listText || "Manus polling failed.";
      if (detail.toLowerCase().includes("task not found") && attempt < 17) continue;
      throw new Error(detail);
    }
    const messages = Array.isArray(listData.messages) ? listData.messages : [];
    const structured = messages.find((item: any) => item?.type === "structured_output_result" && item?.structured_output_result);
    if (structured?.structured_output_result?.success) {
      const body = clean(structured.structured_output_result.value?.email_body || "", message.assigned_agent);
      if (body) return { body, task_id: createData.task_id };
    }
    const errorMessage = messages.find((item: any) => item?.type === "error_message")?.error_message?.content;
    if (errorMessage) throw new Error(errorMessage);
    const stopped = messages.some((item: any) => item?.type === "status_update" && item?.status_update?.agent_status === "stopped");
    if (stopped) {
      const body = clean(messages.find((item: any) => item?.type === "assistant_message" && item?.assistant_message?.content)?.assistant_message?.content || "", message.assigned_agent);
      if (body) return { body, task_id: createData.task_id };
      throw new Error("Manus completed without a usable response.");
    }
  }
  throw new Error("Manus response was not ready before timeout.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const manusKey = Deno.env.get("MANUS_API_KEY");
  if (!supabaseUrl || !serviceRoleKey || !resendKey || !manusKey) return json({ error: "Agent response processor is not configured." }, 500);

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: pending, error } = await supabase
    .from("inbound_messages")
    .select("*")
    .eq("status", "pending_agent_response")
    .eq("approval_required", false)
    .in("assigned_agent", ["mia", "theo"])
    .order("created_at", { ascending: true })
    .limit(3);

  if (error) return json({ error: error.message }, 500);

  const summary = { found: pending?.length || 0, sent: 0, failed: 0, results: [] as Record<string, unknown>[] };
  const sender = Deno.env.get("EMAIL_FROM") || "ACE MiDAS Training <onboarding@resend.dev>";
  const adminBcc = Deno.env.get("AGENT_EMAIL_BCC") || "info@ace-midas-training.co.uk";

  for (const item of pending || []) {
    const metadata = { inbound_message_id: item.id, classification: item.classification, assigned_agent: item.assigned_agent, message_snippet: String(item.message_body || "").slice(0, 240), ai_provider: "manus", ai_model: "manus-1.6-lite" };
    try {
      await supabase.from("inbound_messages").update({ status: "processing_agent_response", updated_at: new Date().toISOString() }).eq("id", item.id);
      const currentEstimate = item.assigned_agent === "theo" ? estimate(item.message_body || "") : null;
      const knowledge = await getKnowledgeContext(supabase, item);
      const generated = await generateWithManus(manusKey, item, currentEstimate, knowledge.context);
      const subject = item.assigned_agent === "theo" ? "Booking information from ACE MiDAS Training" : "Thanks for contacting ACE MiDAS Training";
      const sent = await sendEmail(resendKey, { from: sender, to: [item.from_email], bcc: adminBcc ? [adminBcc] : undefined, subject, html: html(generated.body) });
      if (!sent.ok) throw new Error(typeof sent.data === "string" ? sent.data : JSON.stringify(sent.data || { status: sent.status }));
      await supabase.from("inbound_messages").update({ status: "agent_response_sent", action_taken: "Dynamic Manus response sent.", updated_at: new Date().toISOString() }).eq("id", item.id);
      await logAgent(supabase, item.assigned_agent, `${item.assigned_agent}_dynamic_response_sent`, `${agents[item.assigned_agent]?.name || "Agent"} sent a dynamic Manus response using approved knowledge base context.`, "sent", { ...metadata, recipient_email: item.from_email, admin_bcc: adminBcc, resend_status: sent.status, resend_response: sent.data, dynamic_response_used: true, manus_task_id: generated.task_id, email_sent: true, knowledge_matches: knowledge.matches });
      await logAudit(supabase, item.assigned_agent, "dynamic_agent_response_sent", "Dynamic agent response sent through Manus, Resend and approved knowledge base context.", "sent", { ...metadata, recipient_email: item.from_email, admin_bcc: adminBcc, resend_status: sent.status, resend_response: sent.data, dynamic_response_used: true, manus_task_id: generated.task_id, email_sent: true, knowledge_matches: knowledge.matches });
      summary.sent += 1;
      summary.results.push({ id: item.id, status: "sent", agent: item.assigned_agent });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown processor error.";
      await supabase.from("inbound_messages").update({ status: "agent_response_failed", action_taken: "Dynamic Manus response failed.", updated_at: new Date().toISOString() }).eq("id", item.id);
      await logAgent(supabase, item.assigned_agent, `${item.assigned_agent}_dynamic_response_failed`, `${agents[item.assigned_agent]?.name || "Agent"} could not send a dynamic Manus response.`, "failed", { ...metadata, dynamic_response_used: false, ai_error: message, email_sent: false });
      summary.failed += 1;
      summary.results.push({ id: item.id, status: "failed", agent: item.assigned_agent, error: message });
    }
  }

  return json(summary);
});
