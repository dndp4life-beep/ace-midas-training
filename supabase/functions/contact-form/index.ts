import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const agentIdentities: Record<string, { name: string; title: string }> = {
  ava: { name: "Ava", title: "Compliance Monitoring" },
  mia: { name: "Mia", title: "Outreach Coordinator" },
  theo: { name: "Theo", title: "Training Bookings Coordinator" },
  nia: { name: "Nia", title: "Content & Engagement" },
  ellis: { name: "Ellis", title: "Inbox Management" },
  rory: { name: "Rory", title: "Research & Partnerships" },
};

const THEO_TRAINING_PAGE_URL = "https://www.ace-midas-training.co.uk/training";
const THEO_PRICING_RULES = [
  { title: "MiDAS Standard", price: "£165", aliases: ["midas standard", "midas"] },
  { title: "MiDAS Accessible", price: "£210", aliases: ["midas accessible", "accessible midas"] },
  { title: "PATS Standard", price: "£125", aliases: ["pats standard", "pats"] },
  { title: "PATS Accessible", price: "£155-£185", aliases: ["pats accessible", "accessible pats"] },
  { title: "First Aid at Work", price: "£205-£225", aliases: ["first aid at work", "faw"] },
  { title: "Children's Transport First Aid", price: "£95-£135", aliases: ["children's transport first aid", "childrens transport first aid", "ctfa"] },
];

function classifyInboundMessage(message: string, subject = "") {
  const text = `${subject} ${message}`.toLowerCase();
  const hasAny = (words: string[]) => words.some((word) => text.includes(word));
  if (hasAny(["unsubscribe", "do not contact", "remove me", "opt out"])) {
    return { classification: "unsubscribe/do not contact", assigned_agent: "ellis", status: "filtered", action_taken: "Do not contact flag identified", approval_required: false };
  }
  if (hasAny(["seo", "backlink", "crypto", "loan", "web design", "marketing agency", "guest post"])) {
    return { classification: "spam/B2B irrelevant", assigned_agent: "ellis", status: "archived", action_taken: "Filtered as low-value B2B/spam", approval_required: false };
  }
  const theoRoute = classifyTheoBookingIntent(text);
  if (theoRoute) {
    return theoRoute;
  }
  if (hasAny(["certificate", "evidence", "proof of training"])) {
    return { classification: "certificate request", assigned_agent: "ava", status: "routed", action_taken: "Routed to Ava for compliance/certificate review", approval_required: false };
  }
  if (hasAny(["refresher", "renew", "expired", "expiry", "training due", "training"])) {
    return { classification: "refresher enquiry", assigned_agent: "mia", status: "routed", action_taken: "Routed to Mia for safe refresher/training follow-up", approval_required: false };
  }
  if (hasAny(["content", "social", "post", "case study", "news"])) {
    return { classification: "new enquiry", assigned_agent: "nia", status: "routed", action_taken: "Routed to Nia for content opportunity review", approval_required: false };
  }
  if (hasAny(["partnership", "provider", "school", "council", "local authority", "trust"])) {
    return { classification: "new enquiry", assigned_agent: "rory", status: "routed", action_taken: "Routed to Rory for research/partnership review", approval_required: false };
  }
  if (hasAny(["information", "details", "tell me more", "course"])) {
    return { classification: "wants more information", assigned_agent: "mia", status: "routed", action_taken: "Routed to Mia for safe information response", approval_required: false };
  }
  return { classification: "new enquiry", assigned_agent: "ellis", status: "routed", action_taken: "Captured by Ellis for inbox triage", approval_required: false };
}

function classifyTheoBookingIntent(text: string) {
  const hasAny = (words: string[]) => words.some((word) => text.includes(word));
  const hasExactDate =
    /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(text) ||
    /\b\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{2,4}\b/.test(text) ||
    /\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(text);

  const paymentLinkRequest = hasAny(["payment link", "stripe link", "checkout link", "send a link", "send me a link"]);
  const bookingChangeRequest = hasAny(["cancel", "cancellation", "reschedule", "change my booking", "change the booking", "move my booking"]);
  const customCommercialRequest = hasAny(["discount", "custom price", "special price", "price match", "bespoke price"]);
  const commitmentRequest =
    hasAny(["confirm", "confirmed", "book us in", "book me in", "reserve", "secure the date", "lock in", "go ahead"]) ||
    (hasExactDate && hasAny(["book", "booking", "available", "availability", "date", "dates"]));

  if (paymentLinkRequest) {
    return { classification: "payment link request", assigned_agent: "theo", status: "pending_approval", action_taken: "Routed to Theo approval queue because payment links require human approval", approval_required: true, decision_reason: "Payment/custom Stripe links require human approval." };
  }
  if (bookingChangeRequest) {
    return { classification: "booking change request", assigned_agent: "theo", status: "pending_approval", action_taken: "Routed to Theo approval queue because booking changes/cancellations require human approval", approval_required: true, decision_reason: "Booking changes and cancellations require human approval." };
  }
  if (customCommercialRequest) {
    return { classification: "pricing exception request", assigned_agent: "theo", status: "pending_approval", action_taken: "Routed to Theo approval queue because pricing exceptions require human approval", approval_required: true, decision_reason: "Discounts, custom prices and exceptions require human approval." };
  }
  if (commitmentRequest) {
    return { classification: "booking confirmation request", assigned_agent: "theo", status: "pending_approval", action_taken: "Routed to Theo approval queue because the message asks for a booking/date commitment", approval_required: true, decision_reason: "Exact dates, confirmed availability or booking commitments require human approval." };
  }

  if (hasAny(["how do i book", "how do we book", "how to book", "what information do you need", "what info do you need", "what details do you need"])) {
    return { classification: "booking process question", assigned_agent: "theo", status: "auto_reply", action_taken: "Theo can safely explain the booking process and ask for required details", approval_required: false, decision_reason: "General booking process question with no commitment requested." };
  }
  if (hasAny(["group booking", "group bookings", "multiple staff", "several staff", "team booking"])) {
    return { classification: "group booking enquiry", assigned_agent: "theo", status: "auto_reply", action_taken: "Theo can safely explain group booking requirements", approval_required: false, decision_reason: "Group booking explanation is allowed without confirming dates, prices or availability." };
  }
  if (hasAny(["onsite", "on-site", "on site", "come to us", "at our site", "at our depot"])) {
    return { classification: "onsite training enquiry", assigned_agent: "theo", status: "auto_reply", action_taken: "Theo can safely explain onsite training requirements", approval_required: false, decision_reason: "Onsite training explanation is allowed without making a commitment." };
  }
  if (hasAny(["what dates are available", "dates available", "availability", "available dates", "course availability", "are you available"])) {
    return { classification: "availability enquiry", assigned_agent: "theo", status: "auto_reply", action_taken: "Theo can ask for preferred timeframe, location and attendee count without promising availability", approval_required: false, decision_reason: "General availability enquiry can be answered safely without confirming exact dates." };
  }
  if (hasAny(["price", "pricing", "cost", "quote", "how much"])) {
    return { classification: "pricing enquiry", assigned_agent: "theo", status: "auto_reply", action_taken: "Theo can explain pricing depends on course type, attendee numbers and location", approval_required: false, decision_reason: "General pricing structure enquiry can be answered safely without confirming a final price." };
  }
  if (hasAny(["book", "booking", "attendees", "delegates", "drivers", "refresher booking"])) {
    return { classification: "booking information request", assigned_agent: "theo", status: "auto_reply", action_taken: "Theo can gather course type, attendee numbers, location and preferred timeframe", approval_required: false, decision_reason: "Safe booking information gathering does not confirm dates, prices or payment links." };
  }

  return null;
}

function extractAttendeeCount(text: string) {
  const match = text.match(/\b(\d{1,3})\s*(people|persons|attendees|delegates|staff|drivers|passenger assistants|pas|learners|candidates)?\b/i);
  return match ? Math.max(1, Number(match[1])) : null;
}

function findPricingCourse(text: string) {
  return THEO_PRICING_RULES.find((course) => course.aliases.some((alias) => text.includes(alias)));
}

function calculateTheoEstimate(message: string) {
  const text = message.toLowerCase();
  const course = findPricingCourse(text);
  const attendees = extractAttendeeCount(text);
  if (!course || !attendees) return null;
  const nums = course.price.match(/\d+/g)?.map(Number) || [];
  if (!nums.length) return null;
  const high = Math.max(...nums);
  const low = Math.min(...nums);
  const unit = nums.length > 1 ? (attendees >= 9 ? low : attendees >= 4 ? Math.round(high * 0.9) : high) : attendees >= 9 ? Math.round(high * 0.8) : attendees >= 4 ? Math.round(high * 0.9) : high;
  const standardUnit = high;
  const subtotal = unit * attendees;
  const saving = Math.max(0, (standardUnit - unit) * attendees);
  const discountText = saving > 0 ? `This includes the website group discount shown for ${attendees} attendees, saving approximately £${saving}.` : "No group discount is triggered at this attendee number.";
  return {
    course_title: course.title,
    attendee_count: attendees,
    listed_price: course.price,
    estimated_unit_price: unit,
    estimated_subtotal: subtotal,
    estimated_saving: saving,
    discount_text: discountText,
    caveat: "Estimate excludes any travel fee or custom requirements and does not confirm a final booking price.",
  };
}

function classifyReply(message: string) {
  const route = classifyInboundMessage(message);
  if (route.assigned_agent === "theo") {
    return {
      classification: route.classification,
      requested_action: route.action_taken,
      assigned_agent: "theo",
      approval_required: route.approval_required,
    };
  }
  return {
    classification: route.classification,
    requested_action: route.action_taken,
    assigned_agent: route.assigned_agent,
    approval_required: route.approval_required,
  };
}

function createTheoDecisionTrace(
  inboundMessageId: string,
  route: ReturnType<typeof classifyInboundMessage>,
  overrides: Record<string, unknown> = {},
) {
  const approvalRequired = route.approval_required === true;
  return {
    inbound_message_id: inboundMessageId,
    classification_result: route.classification,
    assigned_agent: route.assigned_agent,
    approval_required: approvalRequired,
    approval_reason: approvalRequired ? String((route as Record<string, unknown>).decision_reason || route.action_taken || "Theo approval is required.") : "",
    theo_auto_reply_allowed: route.assigned_agent === "theo" && !approvalRequired,
    theo_response_draft_generated: route.assigned_agent === "theo" && !approvalRequired,
    resend_send_attempted: false,
    resend_response_status: null,
    thrown_error: null,
    theo_queue_item_created: false,
    decision_reason: String((route as Record<string, unknown>).decision_reason || "Ellis routing rule matched the message content."),
    pricing_estimate_calculated: false,
    training_page_referred: false,
    ...overrides,
  };
}

function extractReplyDetails(message: string) {
  const lower = message.toLowerCase();
  const course = ["MiDAS Accessible", "MiDAS Standard", "PATS Accessible", "PATS Standard", "First Aid at Work", "First Aid"].find((name) => lower.includes(name.toLowerCase())) || "";
  const attendeesMatch = lower.match(/(\d+)\s*(attendees|delegates|staff|people|drivers|passenger assistants|pas)/i);
  const dateMatches = message.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]+\s+\d{4}|Monday|Tuesday|Wednesday|Thursday|Friday|next week|this week|asap|urgent)\b/gi) || [];
  const locationMatch = message.match(/\b(in|at|near)\s+([A-Z][A-Za-z\s]{2,40})(?:[,.]|\s|$)/);
  const urgency = lower.includes("urgent") || lower.includes("asap") || lower.includes("soon") ? "High" : lower.includes("next month") || lower.includes("flexible") ? "Low" : "Medium";
  return {
    requested_course: course,
    attendees: attendeesMatch ? attendeesMatch[1] : "",
    location: locationMatch ? locationMatch[2].trim() : "",
    preferred_dates: [...new Set(dateMatches)].join(", "),
    urgency,
  };
}

async function logAgentRouting(supabase: ReturnType<typeof createClient>, route: ReturnType<typeof classifyInboundMessage>, metadata: Record<string, unknown>) {
  const identity = agentIdentities[route.assigned_agent] || agentIdentities.ellis;
  await insertAgentActivity(supabase, {
    agent_key: route.assigned_agent,
    agent_name: identity.name,
    agent_role: identity.title,
    action_type: route.approval_required ? "inbound_routed_for_approval" : "inbound_routed",
    action_label: route.action_taken,
    summary: `${identity.name} (${identity.title}) classified contact form message as ${route.classification}.`,
    status: route.status,
    approval_required: route.approval_required,
    metadata,
  });

  await supabase.from("audit_logs").insert({
    actor_type: "agent",
    actor_name: `${identity.name} - ${identity.title}`,
    action_type: "contact_form_inbound_routed",
    summary: `Contact form message routed to ${identity.name} as ${route.classification}.`,
    status: route.status,
    metadata,
  });
}

async function insertAgentActivity(supabase: ReturnType<typeof createClient>, row: Record<string, unknown>) {
  const { error } = await supabase.from("agent_activity_logs").insert(row);
  if (!error) return;

  console.error("Agent activity full insert error:", error);
  const fallbackRow = {
    agent_key: row.agent_key,
    agent_name: row.agent_name,
    action_type: row.action_type,
    summary: row.summary,
    status: row.status,
    approval_required: row.approval_required,
    metadata: {
      ...(row.metadata as Record<string, unknown> || {}),
      fallback_reason: "Optional agent_activity_logs columns were not available",
      original_error: error.message,
      agent_role: row.agent_role,
      action_label: row.action_label,
    },
  };
  const { error: fallbackError } = await supabase.from("agent_activity_logs").insert(fallbackRow);
  if (fallbackError) console.error("Agent activity fallback insert error:", fallbackError);
}

async function logAgentActivity(
  supabase: ReturnType<typeof createClient>,
  agentKey: string,
  actionType: string,
  summary: string,
  status: string,
  metadata: Record<string, unknown>,
  approvalRequired = false,
) {
  const identity = agentIdentities[agentKey] || agentIdentities.ellis;
  await insertAgentActivity(supabase, {
    agent_key: agentKey,
    agent_name: identity.name,
    agent_role: identity.title,
    action_type: actionType,
    action_label: summary,
    summary,
    status,
    approval_required: approvalRequired,
    metadata,
  });
}

async function logAuditActivity(
  supabase: ReturnType<typeof createClient>,
  agentKey: string,
  actionType: string,
  summary: string,
  status: string,
  metadata: Record<string, unknown>,
) {
  const identity = agentIdentities[agentKey] || agentIdentities.ellis;
  const { error } = await supabase.from("audit_logs").insert({
    actor_type: "agent",
    actor_name: `${identity.name} - ${identity.title}`,
    action_type: actionType,
    summary,
    status,
    metadata,
  });
  if (error) console.error("Audit log error:", error);
}

async function sendMiaSafeResponse(resendApiKey: string, sender: string, to: string, name: string, enquiryType: string) {
  const subject = "Thanks for contacting ACE MiDAS Training";
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <p>Hello ${escapeHtml(name || "there")},</p>
      <p>Thank you for contacting ACE MiDAS Training about ${escapeHtml(enquiryType || "training")}.</p>
      <p>Your enquiry has been received and the team will review the details. If you are looking for refresher training or general course information, we will come back to you with the next appropriate step.</p>
      <p>This message does not confirm dates, availability, pricing, bookings or payment links.</p>
      <p>Kind regards,<br />Mia<br />Outreach Coordinator<br />ACE MiDAS Training</p>
    </div>
  `;
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      to: [to],
      subject,
      html,
    }),
  });
}

async function sendTheoSafeResponse(resendApiKey: string, sender: string, to: string, name: string, route: ReturnType<typeof classifyInboundMessage>, estimate: ReturnType<typeof calculateTheoEstimate>) {
  const subject = "Booking information from ACE MiDAS Training";
  const classification = String(route.classification || "");
  let guidance = "To help the team advise you properly, please reply with the course type, number of attendees, training location and your preferred timeframe.";

  if (classification === "group booking enquiry") {
    guidance = "We can support group bookings. Please send the course type, approximate number of delegates, training location, and preferred timeframe so the team can review the best next step.";
  } else if (classification === "onsite training enquiry") {
    guidance = "Onsite training may be possible depending on course type, attendee numbers, facilities, location and trainer availability. Please send your site location, course type, number of attendees and preferred timeframe.";
  } else if (classification === "availability enquiry") {
    guidance = "Availability depends on course type, location, trainer availability and attendee numbers. Please send your preferred timeframe, location and attendee count and the team will review suitable options.";
  } else if (classification === "pricing enquiry") {
    guidance = "Pricing depends on the course type, attendee numbers, training location and any travel requirements. Please send those details and the team will advise on the appropriate next step.";
  } else if (classification === "booking process question") {
    guidance = "To start a booking request, the team normally needs the course type, number of attendees, organisation name, training location, contact details and preferred timeframe.";
  } else if (classification === "booking information request") {
    guidance = "Please send the course type, attendee numbers, training location and preferred timeframe. The team will then review the request and guide you through the next step.";
  }

  const estimateHtml = estimate ? `
      <p>Based on the current website pricing rules, an indicative estimate for ${escapeHtml(estimate.attendee_count)} attendee(s) on ${escapeHtml(estimate.course_title)} is £${escapeHtml(estimate.estimated_subtotal)} before any travel fee or custom requirements.</p>
      <p>${escapeHtml(estimate.discount_text)}</p>
      <p>${escapeHtml(estimate.caveat)}</p>
    ` : `
      <p>Pricing depends on the course type, attendee numbers, training location and any travel requirements. Full training details and the current website pricing/discount structure are available on the training page.</p>
    `;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <p>Hello ${escapeHtml(name || "there")},</p>
      <p>Thank you for contacting ACE MiDAS Training.</p>
      <p>${escapeHtml(guidance)}</p>
      ${estimateHtml}
      <p>You can view training options, current prices and visible group booking discounts here: <a href="${THEO_TRAINING_PAGE_URL}">${THEO_TRAINING_PAGE_URL}</a></p>
      <p>The booking process is: send the course type, number of attendees, preferred location and preferred timeframe; ACE MiDAS Training then checks suitability and availability; the booking is only confirmed after admin approval/confirmation.</p>
      <p>This message does not confirm dates, availability, pricing, bookings or payment links. The team will confirm any final arrangements separately.</p>
      <p>Kind regards,<br />Theo<br />Training Bookings Coordinator<br />ACE MiDAS Training</p>
    </div>
  `;
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      to: [to],
      subject,
      html,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      return jsonResponse({ error: "Contact form is not configured." }, 500);
    }

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return jsonResponse({ error: "Invalid request body." }, 400);
    }

    const name = String(payload.name || payload.fullName || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const phone = String(payload.phone || "").trim();
    const organisation = String(payload.organisation || "").trim();
    const message = String(payload.message || "").trim();
    const source = String(payload.source || "website").trim() || "website";
    const enquiryType = String(payload.enquiryType || "Website enquiry").trim();

    if (!name || !email || !message) {
      return jsonResponse({ error: "Name, email and message are required." }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: "Please enter a valid email address." }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: contactSubmission, error: insertError } = await supabase.from("contact_submissions").insert({
      name,
      email,
      phone: phone || null,
      organisation: organisation || null,
      message,
      source,
      status: "new",
    }).select("id").single();

    if (insertError) {
      console.error("Contact submission insert error:", insertError);
      return jsonResponse({ error: "Unable to save your enquiry. Please try again." }, 500);
    }

    const sender = Deno.env.get("EMAIL_FROM") || "ACE MiDAS Training <onboarding@resend.dev>";
    const subject = `New website enquiry - ${enquiryType}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h1>New website enquiry</h1>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
        <p><strong>Organisation:</strong> ${escapeHtml(organisation || "Not provided")}</p>
        <p><strong>Enquiry type:</strong> ${escapeHtml(enquiryType)}</p>
        <p><strong>Source:</strong> ${escapeHtml(source)}</p>
        <h2>Message</h2>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: ["info@ace-midas-training.co.uk"],
        reply_to: email,
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const resendText = await resendResponse.text();
      console.error("Resend contact email error:", {
        status: resendResponse.status,
        body: resendText,
        sender,
      });
      return jsonResponse({ error: "Your enquiry was saved, but the email notification could not be sent." }, 502);
    }

    const route = classifyInboundMessage(message, enquiryType);
    const { data: inboundMessage, error: inboundError } = await supabase
      .from("inbound_messages")
      .insert({
        source: "contact_form",
        from_name: name,
        from_email: email,
        organisation: organisation || null,
        subject: enquiryType,
        message_body: message,
        classification: route.classification,
        assigned_agent: route.assigned_agent,
        status: route.status,
        action_taken: route.action_taken,
        approval_required: route.approval_required,
      })
      .select("id")
      .single();

    if (inboundError) {
      console.error("Inbound message insert error:", inboundError);
      return jsonResponse({ success: true, notification_sent: true, agent_routing_success: false, agent_routing_error: "Inbound message could not be created." });
    }

    const metadata = {
      contact_submission_id: contactSubmission?.id,
      inbound_message_id: inboundMessage?.id,
      classification: route.classification,
      assigned_agent: route.assigned_agent,
      action_taken: route.action_taken,
      decision_reason: String((route as Record<string, unknown>).decision_reason || "Ellis routing rule matched the message content."),
      source: "contact_form",
      from_email: email,
      enquiry_type: enquiryType,
    };

    await logAgentActivity(supabase, "ellis", "inbound_message_created", "Ellis captured a contact form message in inbound_messages.", "captured", metadata);
    await logAgentActivity(supabase, "ellis", "inbound_classified", `Ellis classified the contact form message as ${route.classification}.`, "classified", metadata);

    if (route.assigned_agent === "theo" && route.approval_required) {
      let theoTrace = createTheoDecisionTrace(inboundMessage?.id || "", route);
      const replyRoute = classifyReply(message);
      const replyDetails = extractReplyDetails(message);
      const { data: theoTask, error: replyError } = await supabase.from("reply_intake").insert({
        contact_name: name,
        contact_email: email,
        message,
        classification: replyRoute.classification,
        requested_action: replyRoute.requested_action,
        assigned_agent: "theo",
        approval_required: true,
        approval_status: "pending",
        notes: `Created from contact form inbound message ${inboundMessage?.id}`,
        ...replyDetails,
      }).select("id").single();
      if (replyError) {
        console.error("Theo reply intake insert error:", replyError);
        theoTrace = createTheoDecisionTrace(inboundMessage?.id || "", route, { thrown_error: replyError.message, theo_queue_item_created: false });
        await logAgentActivity(supabase, "theo", "theo_decision_trace", "Theo decision trace: approval required, queue item failed.", "failed", { ...metadata, theo_trace: theoTrace, error: replyError.message }, true);
        await logAgentActivity(supabase, "theo", "theo_approval_create_failed", "Theo approval task could not be created from contact form message.", "failed", { ...metadata, theo_trace: theoTrace, error: replyError.message }, true);
      } else {
        theoTrace = createTheoDecisionTrace(inboundMessage?.id || "", route, { theo_queue_item_created: true, reply_intake_id: theoTask?.id });
        await logAgentActivity(supabase, "theo", "theo_decision_trace", "Theo decision trace: approval required, queue item created.", "pending_approval", { ...metadata, theo_trace: theoTrace, reply_intake_id: theoTask?.id }, true);
        await logAgentActivity(supabase, "theo", "theo_approval_created", "Theo approval task created from contact form message.", "pending_approval", { ...metadata, theo_trace: theoTrace, reply_intake_id: theoTask?.id }, true);
        await logAuditActivity(supabase, "theo", "theo_approval_created", "Contact form booking/payment enquiry routed to Theo approval queue.", "pending_approval", { ...metadata, theo_trace: theoTrace, reply_intake_id: theoTask?.id });
      }
    } else if (route.assigned_agent === "theo" && !route.approval_required) {
      const estimate = calculateTheoEstimate(message);
      let theoTrace = createTheoDecisionTrace(inboundMessage?.id || "", route, { resend_send_attempted: true, pricing_estimate_calculated: Boolean(estimate), training_page_referred: true, pricing_estimate: estimate });
      await logAgentActivity(supabase, "theo", "theo_enquiry_received", "Theo received a safe booking enquiry.", "received", { ...metadata, theo_trace: theoTrace });
      if (estimate) {
        await logAgentActivity(supabase, "theo", "theo_pricing_estimate_calculated", `Theo calculated an indicative estimate for ${estimate.course_title}.`, "calculated", { ...metadata, theo_trace: theoTrace, pricing_estimate: estimate });
      }
      await logAgentActivity(supabase, "theo", "theo_training_page_referred", "Theo referred the customer to the training page for current details and visible discounts.", "referred", { ...metadata, theo_trace: theoTrace, training_page_url: THEO_TRAINING_PAGE_URL });
      try {
        const theoResponse = await sendTheoSafeResponse(resendApiKey, sender, email, name, route, estimate);
        if (theoResponse.ok) {
          theoTrace = createTheoDecisionTrace(inboundMessage?.id || "", route, { resend_send_attempted: true, resend_response_status: theoResponse.status, pricing_estimate_calculated: Boolean(estimate), training_page_referred: true, pricing_estimate: estimate });
          await logAgentActivity(supabase, "theo", "theo_decision_trace", "Theo decision trace: auto-reply allowed and sent.", "sent", { ...metadata, theo_trace: theoTrace });
          await logAgentActivity(supabase, "theo", "theo_auto_response_sent", "Theo sent a safe booking information response.", "sent", { ...metadata, theo_trace: theoTrace });
          await logAuditActivity(supabase, "theo", "theo_auto_response_sent", "Theo sent a safe booking information response.", "sent", { ...metadata, theo_trace: theoTrace });
        } else {
          const theoError = await theoResponse.text();
          theoTrace = createTheoDecisionTrace(inboundMessage?.id || "", route, { resend_send_attempted: true, resend_response_status: theoResponse.status, thrown_error: theoError, pricing_estimate_calculated: Boolean(estimate), training_page_referred: true, pricing_estimate: estimate });
          console.error("Theo safe response error:", { status: theoResponse.status, body: theoError });
          await logAgentActivity(supabase, "theo", "theo_decision_trace", "Theo decision trace: auto-reply allowed but email failed.", "failed", { ...metadata, theo_trace: theoTrace, error: theoError });
          await logAgentActivity(supabase, "theo", "theo_auto_response_failed", "Theo could not send the safe booking information response.", "failed", { ...metadata, theo_trace: theoTrace, error: theoError });
        }
      } catch (theoError) {
        const errorMessage = theoError instanceof Error ? theoError.message : String(theoError);
        theoTrace = createTheoDecisionTrace(inboundMessage?.id || "", route, { resend_send_attempted: true, thrown_error: errorMessage, pricing_estimate_calculated: Boolean(estimate), training_page_referred: true, pricing_estimate: estimate });
        console.error("Theo safe response thrown error:", theoError);
        await logAgentActivity(supabase, "theo", "theo_decision_trace", "Theo decision trace: auto-reply allowed but an error was thrown.", "failed", { ...metadata, theo_trace: theoTrace, error: errorMessage });
      }
    } else if (route.assigned_agent === "mia" && ["refresher enquiry", "wants more information"].includes(route.classification)) {
      const miaResponse = await sendMiaSafeResponse(resendApiKey, sender, email, name, enquiryType);
      if (miaResponse.ok) {
        await logAgentActivity(supabase, "mia", "mia_contact_response_sent", "Mia sent a safe contact form acknowledgement.", "sent", metadata);
        await logAuditActivity(supabase, "mia", "mia_contact_response_sent", "Mia sent a safe contact form acknowledgement.", "sent", metadata);
      } else {
        const miaError = await miaResponse.text();
        console.error("Mia safe response error:", { status: miaResponse.status, body: miaError });
        await logAgentActivity(supabase, "mia", "mia_contact_response_failed", "Mia could not send the safe contact form acknowledgement.", "failed", { ...metadata, error: miaError });
      }
    } else {
      await logAgentActivity(supabase, route.assigned_agent, "agent_task_created", `${agentIdentities[route.assigned_agent]?.name || "Agent"} task created from contact form message.`, route.status, metadata, route.approval_required);
    }

    try {
      await logAgentRouting(supabase, route, metadata);
    } catch (logError) {
      console.error("Agent/audit routing log error:", logError);
    }

    return jsonResponse({ success: true, notification_sent: true, agent_routing_success: true, inbound_message_id: inboundMessage?.id, assigned_agent: route.assigned_agent, classification: route.classification, action_taken: route.action_taken });
  } catch (error) {
    console.error("Contact form error:", error);
    return jsonResponse({ error: "Unable to send your enquiry. Please try again." }, 500);
  }
});
