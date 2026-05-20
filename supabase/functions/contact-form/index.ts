import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const trainingPageUrl = "https://www.ace-midas-training.co.uk/training";
const compliancePageUrl = "https://www.ace-midas-training.co.uk/compliance";

const agents: Record<string, { name: string; title: string }> = {
  ava: { name: "Ava", title: "Compliance Monitoring" },
  mia: { name: "Mia", title: "Outreach Coordinator" },
  theo: { name: "Theo", title: "Training Bookings & Sales Coordinator" },
  nia: { name: "Nia", title: "Content & Engagement" },
  ellis: { name: "Ellis", title: "Inbox Management" },
  rory: { name: "Rory", title: "Research & Partnerships" },
};

const prices = [
  { title: "MiDAS Standard", price: "£165", aliases: ["midas standard", "midas"] },
  { title: "MiDAS Accessible", price: "£210", aliases: ["midas accessible", "accessible midas"] },
  { title: "PATS Standard", price: "£125", aliases: ["pats standard", "pats"] },
  { title: "PATS Accessible", price: "£155-£185", aliases: ["pats accessible", "accessible pats"] },
  { title: "First Aid at Work", price: "£205-£225", aliases: ["first aid at work", "faw"] },
  { title: "Children's Transport First Aid", price: "£95-£135", aliases: ["children's transport first aid", "childrens transport first aid", "ctfa"] },
];

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function esc(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function words(text: string, list: string[]) {
  return list.filter((word) => text.includes(word));
}

function route(data: Record<string, unknown>, reason: string, matched: string[] = []) {
  return { ...data, routing_reason: reason, matched_keywords: matched };
}

function classify(message: string, subject = "") {
  const text = `${subject} ${message}`.toLowerCase();
  const unsub = words(text, ["unsubscribe", "do not contact", "remove me", "opt out"]);
  if (unsub.length) return route({ classification: "unsubscribe/do not contact", assigned_agent: "ellis", status: "filtered", action_taken: "Do not contact flag identified", approval_required: false }, "Do-not-contact wording matched.", unsub);

  const spam = words(text, ["seo", "backlink", "crypto", "loan", "web design", "marketing agency", "guest post"]);
  if (spam.length) return route({ classification: "spam/B2B irrelevant", assigned_agent: "ellis", status: "archived", action_taken: "Filtered as low-value B2B/spam", approval_required: false }, "Low-value B2B/spam keyword matched.", spam);

  const service = words(text, ["compliance app", "compliance apps", "compliance hub", "monthly fee", "monthly service", "service fee", "subscription", "saas", "safejourney", "safe journey", "medication tracking", "journey tracking", "tracking app", "compliance system", "compliance service", "digital compliance"]);
  if (service.length) return route({ classification: "service enquiry / compliance app enquiry", assigned_agent: "mia", status: "pending_agent_response", action_taken: "Mia can answer compliance app/service information.", approval_required: false }, "Compliance app/service wording matched.", service);

  const exactDate = /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(text) || /\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(text);
  const approval = words(text, ["payment link", "stripe link", "send a link", "send me a link", "invoice", "cancel", "cancellation", "reschedule", "change my booking", "custom discount", "special discount", "custom price", "special price", "confirm", "confirmed", "book us in", "book me in", "reserve", "secure the date", "lock in", "go ahead"]);
  if (approval.length || (exactDate && words(text, ["book", "booking", "available", "availability", "date", "dates"]).length)) {
    return route({ classification: "booking/date/payment approval request", assigned_agent: "theo", status: "pending_approval", action_taken: "Theo approval queue item required.", approval_required: true }, "Booking commitment, payment or custom commercial wording matched.", approval.length ? approval : ["exact date booking request"]);
  }

  const booking = words(text, ["how do i book", "how do we book", "how to book", "arrange training", "arrange a course", "group booking", "group bookings", "multiple staff", "several staff", "onsite", "on-site", "on site", "schedule", "dates", "availability", "available", "next month", "next week", "price", "pricing", "cost", "quote", "how much", "estimate", "discount", "attendees", "delegates", "staff members"]);
  if (booking.length || /\b\d{1,3}\s*(people|persons|attendees|delegates|staff|drivers|passenger assistants|pas|learners|candidates)\b/i.test(text)) {
    return route({ classification: "safe booking/pricing enquiry", assigned_agent: "theo", status: "pending_agent_response", action_taken: "Theo can answer safely without committing dates, bookings or payment links.", approval_required: false }, "Booking, pricing or attendee wording matched.", booking);
  }

  const cert = words(text, ["certificate", "evidence", "proof of training"]);
  if (cert.length) return route({ classification: "certificate request", assigned_agent: "ava", status: "routed", action_taken: "Ava internal certificate/compliance review task created.", approval_required: false }, "Certificate wording matched.", cert);

  const training = words(text, ["what is pats", "what is midas", "difference between pats and midas", "difference between", "explain", "more information", "information about", "course information", "training support", "passenger assistants", "suitable for", "what training", "pats", "midas", "refresher", "renew", "expired", "expiry", "training due", "training", "course", "first aid"]);
  if (training.length) return route({ classification: words(text, ["refresher", "renew", "expired", "expiry", "training due"]).length ? "refresher enquiry" : "general training enquiry", assigned_agent: "mia", status: "pending_agent_response", action_taken: "Mia can answer general training information.", approval_required: false }, "General training/refresher information matched.", training);

  const content = words(text, ["content", "social", "post", "case study", "news"]);
  if (content.length) return route({ classification: "content opportunity", assigned_agent: "nia", status: "routed", action_taken: "Nia content opportunity task created.", approval_required: false }, "Content wording matched.", content);

  const research = words(text, ["partnership", "provider", "school", "council", "local authority", "trust"]);
  if (research.length) return route({ classification: "research/partnership opportunity", assigned_agent: "rory", status: "routed", action_taken: "Rory research/partnership task created.", approval_required: false }, "Research/partnership wording matched.", research);

  return route({ classification: "wants more information", assigned_agent: "mia", status: "pending_agent_response", action_taken: "Mia can answer general information.", approval_required: false }, "Unclear enquiry defaults to Mia.", []);
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

function replyDetails(message: string) {
  const lower = message.toLowerCase();
  const course = ["MiDAS Accessible", "MiDAS Standard", "PATS Accessible", "PATS Standard", "First Aid at Work", "First Aid"].find((name) => lower.includes(name.toLowerCase())) || "";
  const attendees = lower.match(/(\d+)\s*(attendees|delegates|staff|people|drivers|passenger assistants|pas)/i)?.[1] || "";
  const preferred_dates = [...new Set(message.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]+\s+\d{4}|Monday|Tuesday|Wednesday|Thursday|Friday|next week|this week|asap|urgent)\b/gi) || [])].join(", ");
  const location = message.match(/\b(in|at|near)\s+([A-Z][A-Za-z\s]{2,40})(?:[,.]|\s|$)/)?.[2]?.trim() || "";
  const urgency = lower.includes("urgent") || lower.includes("asap") || lower.includes("soon") ? "High" : lower.includes("next month") || lower.includes("flexible") ? "Low" : "Medium";
  return { requested_course: course, attendees, location, preferred_dates, urgency };
}

async function sendEmail(resendApiKey: string, body: Record<string, unknown>) {
  return fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

async function logAgent(supabase: ReturnType<typeof createClient>, agent: string, action_type: string, summary: string, status: string, metadata: Record<string, unknown>, approval_required = false) {
  const id = agents[agent] || agents.ellis;
  const { error } = await supabase.from("agent_activity_logs").insert({ agent_key: agent, agent_name: id.name, agent_role: id.title, action_type, action_label: summary, summary, status, approval_required, metadata });
  if (error) console.error("Agent activity insert error:", error);
}

async function logAudit(supabase: ReturnType<typeof createClient>, agent: string, action_type: string, summary: string, status: string, metadata: Record<string, unknown>) {
  const id = agents[agent] || agents.ellis;
  const { error } = await supabase.from("audit_logs").insert({ actor_type: "agent", actor_name: `${id.name} - ${id.title}`, action_type, summary, status, metadata });
  if (error) console.error("Audit log error:", error);
}

async function triggerAgentProcessor(supabaseUrl: string, functionInvokeKey: string, supabase: ReturnType<typeof createClient>, metadata: Record<string, unknown>) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/process-agent-responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${functionInvokeKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: "contact-form", inbound_message_id: metadata.inbound_message_id }),
    });
    const body = await response.text();
    await logAgent(supabase, "ellis", response.ok ? "agent_processor_triggered" : "agent_processor_trigger_failed", response.ok ? "Ellis triggered the agent response processor." : "Ellis could not trigger the agent response processor.", response.ok ? "triggered" : "failed", {
      ...metadata,
      processor_status: response.status,
      processor_response: body.slice(0, 1000),
    });
  } catch (error) {
    await logAgent(supabase, "ellis", "agent_processor_trigger_failed", "Ellis could not trigger the agent response processor.", "failed", {
      ...metadata,
      processor_error: error instanceof Error ? error.message : "Unknown processor trigger error.",
    });
  }
}

const promptRules = `
You write customer-facing email replies for ACE MiDAS Training.
Answer the customer's actual question first. Use plain English. Give one clear next step.
Never mention routing, classification, assigned agents, approval rules, workflow status, system decisions, or internal rules.
Mia can answer training, refresher, PATS, MiDAS, First Aid, compliance app/service and monthly fee enquiries in general terms.
Theo can answer booking process, group booking, onsite training and safe pricing estimate questions from supplied prices.
Theo must not confirm dates, promise availability, confirm bookings, send payment links, agree custom discounts or invent prices.
Ava is internal only and must not email customers.
If the exact answer is not known, say: "I can help with that, but I may need a little more information to give the most accurate answer."
Return only the email body as plain text, including the correct signature.
`;

function customerEmailSchema() {
  return { type: "object", properties: { email_body: { type: "string", description: "Complete customer-facing email body as plain text." } }, required: ["email_body"], additionalProperties: false };
}

function dynamicInput(args: { agent: string; name: string; organisation: string; enquiryType: string; message: string; route: any; estimate: ReturnType<typeof estimate> }) {
  const id = agents[args.agent] || agents.mia;
  return `${promptRules}

Agent: ${id.name}
Signature:
Kind regards,
${id.name}
${id.title}
ACE MiDAS Training

Customer name: ${args.name || "there"}
Organisation: ${args.organisation || "Not provided"}
Enquiry type: ${args.enquiryType || "Website enquiry"}
Internal classification for context only: ${args.route.classification}

Useful context:
- Training page: ${trainingPageUrl}
- Compliance page: ${compliancePageUrl}
- Approved course prices: ${prices.map((item) => `${item.title}: ${item.price}`).join("; ")}
- Compliance app/service support can include training records, certificate oversight, refresher reminders, reporting, medication tracking, journey tracking and setup support.
- Monthly/service fees depend on the package, tools and organisation requirements unless an approved figure is supplied.
${args.estimate ? `- Indicative estimate: ${args.estimate.attendee_count} attendee(s), ${args.estimate.course_title}, listed price ${args.estimate.listed_price}, approximate subtotal £${args.estimate.estimated_subtotal}. Say it is indicative and excludes travel/custom requirements.` : ""}

Customer message:
${args.message}`;
}

function cleanCustomerText(text: string, agent: string) {
  const blocked = ["routed", "classified", "assigned agent", "approval_required", "approval required", "internal rule", "system decision", "workflow status", "this message does not confirm"];
  const cleaned = String(text || "").split(/\r?\n/).filter((line) => !blocked.some((word) => line.toLowerCase().includes(word))).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const id = agents[agent] || agents.mia;
  if (cleaned.toLowerCase().includes(id.name.toLowerCase()) && cleaned.includes("ACE MiDAS Training")) return cleaned;
  return `${cleaned}\n\nKind regards,\n${id.name}\n${id.title}\nACE MiDAS Training`.trim();
}

async function generateWithManus(args: { apiKey: string; agent: string; name: string; organisation: string; enquiryType: string; message: string; route: any; estimate: ReturnType<typeof estimate> }) {
  try {
    const created = await fetch("https://api.manus.ai/v2/task.create", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-manus-api-key": args.apiKey },
      body: JSON.stringify({
        title: "ACE MiDAS customer response",
        hide_in_task_list: true,
        interactive_mode: false,
        agent_profile: "manus-1.6-lite",
        message: { content: dynamicInput(args) },
        structured_output_schema: customerEmailSchema(),
      }),
    });
    const createText = await created.text();
    const createData = createText ? JSON.parse(createText) : null;
    if (!created.ok || !createData?.ok || !createData?.task_id) {
      return { used: false, provider: "manus", model: "manus-1.6-lite", text: "", error: createData?.error?.message || createText || "Manus task creation failed." };
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 2000 : 1500));
      const listed = await fetch(`https://api.manus.ai/v2/task.listMessages?task_id=${encodeURIComponent(createData.task_id)}&order=desc&limit=20`, { headers: { "x-manus-api-key": args.apiKey } });
      const listText = await listed.text();
      const listData = listText ? JSON.parse(listText) : null;
      if (!listed.ok || !listData?.ok) {
        const message = listData?.error?.message || listText || "";
        if (message.toLowerCase().includes("task not found") && attempt < 7) continue;
        return { used: false, provider: "manus", model: "manus-1.6-lite", text: "", error: listData?.error?.message || listText || "Manus polling failed.", task_id: createData.task_id };
      }
      const messages = Array.isArray(listData.messages) ? listData.messages : [];
      const structured = messages.find((item: any) => item?.type === "structured_output_result" && item?.structured_output_result);
      if (structured?.structured_output_result?.success) {
        const raw = structured.structured_output_result.value?.email_body || "";
        const text = cleanCustomerText(raw, args.agent);
        if (text) return { used: true, provider: "manus", model: "manus-1.6-lite", text, error: "", task_id: createData.task_id };
      }
      const errorMessage = messages.find((item: any) => item?.type === "error_message")?.error_message?.content;
      if (errorMessage) return { used: false, provider: "manus", model: "manus-1.6-lite", text: "", error: errorMessage, task_id: createData.task_id };
      const stopped = messages.some((item: any) => item?.type === "status_update" && item?.status_update?.agent_status === "stopped");
      if (stopped) {
        const raw = messages.find((item: any) => item?.type === "assistant_message" && item?.assistant_message?.content)?.assistant_message?.content || "";
        const text = cleanCustomerText(raw, args.agent);
        return text ? { used: true, provider: "manus", model: "manus-1.6-lite", text, error: "", task_id: createData.task_id } : { used: false, provider: "manus", model: "manus-1.6-lite", text: "", error: "Manus completed without a usable response.", task_id: createData.task_id };
      }
    }
    return { used: false, provider: "manus", model: "manus-1.6-lite", text: "", error: "Manus response was not ready before timeout.", task_id: createData.task_id };
  } catch (error) {
    return { used: false, provider: "manus", model: "manus-1.6-lite", text: "", error: error instanceof Error ? error.message : "Manus response generation failed." };
  }
}

function fallbackMia(name: string, enquiryType: string, currentRoute: any) {
  const classification = String(currentRoute?.classification || "");
  if (classification.includes("compliance app") || classification.includes("service enquiry")) {
    return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;"><p>Hello ${esc(name || "there")},</p><p>Thank you for getting in touch.</p><p>ACE MiDAS Training can support organisations with compliance app and digital compliance service setup, including training records, certificate oversight, refresher reminders, reporting and operational evidence in one more structured place.</p><p>Where relevant, the compliance support can also sit alongside tools such as medication tracking, journey tracking and audit-ready reporting, depending on what your organisation needs.</p><p>Monthly or service fees depend on the package, tools and setup required, so the best next step is to tell us which parts of the compliance system you are interested in and roughly how many staff or sites you need to cover.</p><p>You can view the compliance information here: <a href="${compliancePageUrl}">${compliancePageUrl}</a></p><p>Kind regards,<br />Mia<br />Outreach Coordinator<br />ACE MiDAS Training</p></div>`;
  }
  return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;"><p>Hello ${esc(name || "there")},</p><p>Thank you for contacting ACE MiDAS Training about ${esc(enquiryType || "training")}.</p><p>PATS training is designed for passenger assistants who support children, young people or vulnerable passengers during transport. MiDAS training is designed for minibus drivers and focuses on safer, more confident minibus driving.</p><p>ACE MiDAS Training provides PATS, MiDAS and First Aid training support for organisations that need staff to stay trained and up to date.</p><p>If helpful, we can also explain which course route may be most suitable for your staff.</p><p>Kind regards,<br />Mia<br />Outreach Coordinator<br />ACE MiDAS Training</p></div>`;
}

function textHtml(text: string) {
  return `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">${esc(text).replace(/\n/g, "<br />")}</div>`;
}

async function sendMia(resendApiKey: string, sender: string, to: string, name: string, enquiryType: string, dynamicText: string, currentRoute: any) {
  return sendEmail(resendApiKey, { from: sender, to: [to], subject: "Thanks for contacting ACE MiDAS Training", html: dynamicText ? textHtml(dynamicText) : fallbackMia(name, enquiryType, currentRoute) });
}

async function sendTheo(resendApiKey: string, sender: string, to: string, name: string, currentRoute: any, currentEstimate: ReturnType<typeof estimate>, dynamicText: string) {
  if (dynamicText) return sendEmail(resendApiKey, { from: sender, to: [to], subject: "Booking information from ACE MiDAS Training", html: textHtml(dynamicText) });
  const est = currentEstimate ? `<p>For ${esc(currentEstimate.attendee_count)} attendee(s) on ${esc(currentEstimate.course_title)}, the indicative course subtotal is approximately £${esc(currentEstimate.estimated_subtotal)} before travel fees or custom requirements.</p>` : "";
  return sendEmail(resendApiKey, { from: sender, to: [to], subject: "Booking information from ACE MiDAS Training", html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;"><p>Hello ${esc(name || "there")},</p><p>Thanks for getting in touch.</p><p>We can help with booking enquiries, group training and pricing guidance. To guide you properly, please reply with the course required, number of attendees, location and preferred timeframe.</p>${est}<p>Current training options are available here: <a href="${trainingPageUrl}">${trainingPageUrl}</a></p><p>Kind regards,<br />Theo<br />Training Bookings &amp; Sales Coordinator<br />ACE MiDAS Training</p></div>` });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonInvokeKey = Deno.env.get("SB_ANON_KEY") || "";
    const functionInvokeKey = anonInvokeKey || serviceRoleKey;
    const functionInvokeKeySource = anonInvokeKey ? "SB_ANON_KEY" : "SUPABASE_SERVICE_ROLE_KEY_FALLBACK";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const manusApiKey = Deno.env.get("MANUS_API_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) return json({ error: "Contact form is not configured." }, 500);

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") return json({ error: "Invalid request body." }, 400);

    const name = String(payload.name || payload.fullName || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const phone = String(payload.phone || "").trim();
    const organisation = String(payload.organisation || "").trim();
    const message = String(payload.message || "").trim();
    const source = String(payload.source || "website").trim() || "website";
    const enquiryType = String(payload.enquiryType || "Website enquiry").trim();
    if (!name || !email || !message) return json({ error: "Name, email and message are required." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email address." }, 400);

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: contactSubmission, error: contactError } = await supabase.from("contact_submissions").insert({ name, email, phone: phone || null, organisation: organisation || null, message, source, status: "new" }).select("id").single();
    if (contactError) {
      console.error("Contact submission insert error:", contactError);
      return json({ error: "Unable to save your enquiry. Please try again." }, 500);
    }

    const sender = Deno.env.get("EMAIL_FROM") || "ACE MiDAS Training <onboarding@resend.dev>";
    const notification = await sendEmail(resendApiKey, {
      from: sender,
      to: ["info@ace-midas-training.co.uk"],
      reply_to: email,
      subject: `New website enquiry - ${enquiryType}`,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;"><h1>New website enquiry</h1><p><strong>Name:</strong> ${esc(name)}</p><p><strong>Email:</strong> ${esc(email)}</p><p><strong>Phone:</strong> ${esc(phone || "Not provided")}</p><p><strong>Organisation:</strong> ${esc(organisation || "Not provided")}</p><p><strong>Enquiry type:</strong> ${esc(enquiryType)}</p><p><strong>Source:</strong> ${esc(source)}</p><h2>Message</h2><p>${esc(message).replace(/\n/g, "<br />")}</p></div>`,
    });
    if (!notification.ok) {
      console.error("Resend contact email error:", { status: notification.status, body: await notification.text(), sender });
      return json({ error: "Your enquiry was saved, but the email notification could not be sent." }, 502);
    }

    const currentRoute = classify(message, enquiryType);
    const { data: inbound, error: inboundError } = await supabase.from("inbound_messages").insert({ source: "contact_form", from_name: name, from_email: email, organisation: organisation || null, subject: enquiryType, message_body: message, classification: currentRoute.classification, assigned_agent: currentRoute.assigned_agent, status: currentRoute.status, action_taken: currentRoute.action_taken, approval_required: currentRoute.approval_required }).select("id").single();
    if (inboundError) {
      console.error("Inbound message insert error:", inboundError);
      return json({ success: true, notification_sent: true, agent_routing_success: false, agent_routing_error: "Inbound message could not be created." });
    }

    const currentEstimate = currentRoute.assigned_agent === "theo" && !currentRoute.approval_required ? estimate(message) : null;
    const metadata = { contact_submission_id: contactSubmission?.id, inbound_message_id: inbound?.id, classification: currentRoute.classification, assigned_agent: currentRoute.assigned_agent, action_taken: currentRoute.action_taken, routing_reason: currentRoute.routing_reason || "", matched_keywords: currentRoute.matched_keywords || [], approval_required: currentRoute.approval_required, message_snippet: message.slice(0, 240), source: "contact_form", from_email: email, enquiry_type: enquiryType, estimate_calculated: Boolean(currentEstimate), dynamic_response_used: false, ai_provider: "manus", ai_model: "manus-1.6-lite", ai_error: "", manus_task_id: null, email_sent: false, function_invoke_key_source: functionInvokeKeySource };

    await logAgent(supabase, "ellis", "inbound_message_created", "Ellis captured a contact form message in inbound_messages.", "captured", metadata);
    await logAgent(supabase, "ellis", "inbound_classified", `Ellis classified the contact form message as ${currentRoute.classification}.`, "classified", metadata);

    if (currentRoute.assigned_agent === "theo" && currentRoute.approval_required) {
      const { data: theoTask, error } = await supabase.from("reply_intake").insert({ contact_name: name, contact_email: email, message, classification: currentRoute.classification, requested_action: currentRoute.action_taken, assigned_agent: "theo", approval_required: true, approval_status: "pending", notes: `Created from contact form inbound message ${inbound?.id}`, ...replyDetails(message) }).select("id").single();
      if (error) await logAgent(supabase, "theo", "theo_approval_create_failed", "Theo approval task could not be created from contact form message.", "failed", { ...metadata, error: error.message }, true);
      else {
        await logAgent(supabase, "theo", "theo_approval_created", "Theo approval task created from contact form message.", "pending_approval", { ...metadata, reply_intake_id: theoTask?.id }, true);
        await logAudit(supabase, "theo", "theo_approval_created", "Contact form booking/payment enquiry routed to Theo approval queue.", "pending_approval", { ...metadata, reply_intake_id: theoTask?.id });
      }
    } else if (["mia", "theo"].includes(String(currentRoute.assigned_agent))) {
      await logAgent(supabase, String(currentRoute.assigned_agent), "agent_response_queued", `${agents[String(currentRoute.assigned_agent)]?.name || "Agent"} response queued for Manus generation.`, "pending_agent_response", metadata);
      const processorPromise = triggerAgentProcessor(supabaseUrl, functionInvokeKey, supabase, metadata);
      const edgeRuntime = (globalThis as unknown as { EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void } }).EdgeRuntime;
      if (edgeRuntime?.waitUntil) edgeRuntime.waitUntil(processorPromise);
      else processorPromise.catch((error) => console.error("Agent processor trigger error:", error));
    } else {
      await logAgent(supabase, String(currentRoute.assigned_agent), "agent_task_created", `${agents[String(currentRoute.assigned_agent)]?.name || "Agent"} task created from contact form message.`, String(currentRoute.status), metadata, Boolean(currentRoute.approval_required));
    }

    return json({ success: true, notification_sent: true, agent_routing_success: true, inbound_message_id: inbound?.id, assigned_agent: currentRoute.assigned_agent, classification: currentRoute.classification, action_taken: currentRoute.action_taken });
  } catch (error) {
    console.error("Contact form error:", error);
    return json({ error: "Unable to send your enquiry. Please try again." }, 500);
  }
});
