import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const agentIdentities: Record<string, { name: string; title: string }> = {
  ava: { name: "Ava", title: "Compliance Monitoring" },
  mia: { name: "Mia", title: "Outreach Coordinator" },
  theo: { name: "Theo", title: "Training Bookings & Sales Coordinator" },
  nia: { name: "Nia", title: "Content & Engagement" },
  ellis: { name: "Ellis", title: "Inbox Management" },
  rory: { name: "Rory", title: "Research & Partnerships" },
};

const trainingPageUrl = "https://www.ace-midas-training.co.uk/training";
const pricingRules = [
  { title: "MiDAS Standard", price: "GBP 165", aliases: ["midas standard", "midas"] },
  { title: "MiDAS Accessible", price: "GBP 210", aliases: ["midas accessible", "accessible midas"] },
  { title: "PATS Standard", price: "GBP 125", aliases: ["pats standard", "pats"] },
  { title: "PATS Accessible", price: "GBP 155-185", aliases: ["pats accessible", "accessible pats"] },
  { title: "First Aid at Work", price: "GBP 205-225", aliases: ["first aid at work", "faw"] },
  { title: "Children's Transport First Aid", price: "GBP 95-135", aliases: ["children's transport first aid", "childrens transport first aid", "ctfa"] },
];

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

function matchedKeywords(text: string, words: string[]) {
  return words.filter((word) => text.includes(word));
}

function makeRoute(route: Record<string, unknown>, routingReason: string, matched: string[] = []): any {
  return { ...route, routing_reason: routingReason, matched_keywords: matched };
}

function classifyTheoBookingIntent(text: string) {
  const hasAny = (words: string[]) => matchedKeywords(text, words).length > 0;
  const hasExactDate =
    /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/.test(text) ||
    /\b\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{2,4}\b/.test(text) ||
    /\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(text);

  const paymentMatches = matchedKeywords(text, ["payment", "payment link", "stripe link", "checkout link", "send a link", "send me a link", "invoice"]);
  const bookingChangeMatches = matchedKeywords(text, ["cancel", "cancellation", "reschedule", "change my booking", "change the booking", "move my booking"]);
  const customCommercialMatches = matchedKeywords(text, ["custom discount", "special discount", "extra discount", "custom price", "special price", "price match", "bespoke price"]);
  const commitmentRequest = hasAny(["confirm", "confirmed", "book us in", "book me in", "reserve", "secure the date", "lock in", "go ahead"]) || (hasExactDate && hasAny(["book", "booking", "available", "availability", "date", "dates"]));

  if (paymentMatches.length) return makeRoute({ classification: "payment link request", assigned_agent: "theo", status: "pending_approval", action_taken: "Routed to Theo approval queue because payment links require human approval", approval_required: true, decision_reason: "Payment/custom Stripe links require human approval." }, "Payment or invoice wording matched.", paymentMatches);
  if (bookingChangeMatches.length) return makeRoute({ classification: "booking change request", assigned_agent: "theo", status: "pending_approval", action_taken: "Routed to Theo approval queue because booking changes/cancellations require human approval", approval_required: true, decision_reason: "Booking changes and cancellations require human approval." }, "Booking change/cancellation wording matched.", bookingChangeMatches);
  if (customCommercialMatches.length) return makeRoute({ classification: "pricing exception request", assigned_agent: "theo", status: "pending_approval", action_taken: "Routed to Theo approval queue because pricing exceptions require human approval", approval_required: true, decision_reason: "Discounts, custom prices and exceptions require human approval." }, "Custom commercial request matched.", customCommercialMatches);
  if (commitmentRequest) return makeRoute({ classification: "booking confirmation request", assigned_agent: "theo", status: "pending_approval", action_taken: "Routed to Theo approval queue because the message asks for a booking/date commitment", approval_required: true, decision_reason: "Exact dates, confirmed availability or booking commitments require human approval." }, "Booking/date commitment wording matched.", ["commitment request"]);

  const bookingProcessMatches = matchedKeywords(text, ["how do i book", "how do we book", "how to book", "what information do you need to book", "what details do you need to book", "arrange training", "arrange a course", "arrange a group booking"]);
  if (bookingProcessMatches.length) return makeRoute({ classification: "booking process question", assigned_agent: "theo", status: "auto_reply", action_taken: "Theo can safely explain the booking process and ask for required details", approval_required: false, decision_reason: "General booking process question with no commitment requested." }, "Clear booking process/arrangement wording matched.", bookingProcessMatches);

  const groupBookingMatches = matchedKeywords(text, ["group booking", "group bookings", "multiple staff", "several staff", "team booking", "staff members needing training"]);
  if (groupBookingMatches.length) return makeRoute({ classification: "group booking enquiry", assigned_agent: "theo", status: "auto_reply", action_taken: "Theo can safely explain group booking value and configured website discounts", approval_required: false, decision_reason: "Group booking and configured website discount explanations are allowed without confirming dates, final prices or availability." }, "Group booking wording matched.", groupBookingMatches);

  const onsiteMatches = matchedKeywords(text, ["onsite", "on-site", "on site", "come to us", "at our site", "at our depot"]);
  if (onsiteMatches.length) return makeRoute({ classification: "onsite training enquiry", assigned_agent: "theo", status: "auto_reply", action_taken: "Theo can safely explain onsite training requirements", approval_required: false, decision_reason: "Onsite training explanation is allowed without making a commitment." }, "Onsite training logistics wording matched.", onsiteMatches);

  const dateMatches = matchedKeywords(text, ["schedule", "dates", "date", "availability", "available", "available dates", "course availability", "next month", "next week", "this week"]);
  if (dateMatches.length || hasExactDate) return makeRoute({ classification: "availability enquiry", assigned_agent: "theo", status: "auto_reply", action_taken: "Theo can ask for preferred timeframe, location and attendee count without promising availability", approval_required: false, decision_reason: "General availability enquiry can be answered safely without confirming exact dates." }, "Date/schedule/availability wording matched.", dateMatches.length ? dateMatches : ["date pattern"]);

  const pricingMatches = matchedKeywords(text, ["price", "pricing", "cost", "quote", "how much", "estimate", "discount"]);
  if (pricingMatches.length) return makeRoute({ classification: "pricing enquiry", assigned_agent: "theo", status: "auto_reply", action_taken: "Theo can explain pricing and calculate estimates only from configured pricing rules", approval_required: false, decision_reason: "Standard pricing enquiries can be answered safely when estimates are labelled and based on configured rules." }, "Pricing/estimate wording matched.", pricingMatches);

  const attendeeMatches = matchedKeywords(text, ["attendees", "delegates", "staff members", "people to complete", "people for", "drivers to train", "staff to complete"]);
  const attendeeCountMatch = text.match(/\b\d{1,3}\s*(people|persons|attendees|delegates|staff|drivers|passenger assistants|pas|learners|candidates)\b/i);
  if (attendeeMatches.length || attendeeCountMatch) return makeRoute({ classification: "booking information request", assigned_agent: "theo", status: "auto_reply", action_taken: "Theo can qualify the lead and gather course type, attendee numbers, location, refresher/full training need, expiry deadline and preferred timeframe", approval_required: false, decision_reason: "Attendee/logistics wording means this is a booking or estimate enquiry." }, "Attendee/logistics wording matched.", attendeeMatches.length ? attendeeMatches : [attendeeCountMatch?.[0] || "attendee count"]);

  return null;
}

function classifyInboundMessage(message: string, subject = "") {
  const text = `${subject} ${message}`.toLowerCase();
  const hasAny = (words: string[]) => matchedKeywords(text, words).length > 0;

  const unsubscribeMatches = matchedKeywords(text, ["unsubscribe", "do not contact", "remove me", "opt out"]);
  if (unsubscribeMatches.length) return makeRoute({ classification: "unsubscribe/do not contact", assigned_agent: "ellis", status: "filtered", action_taken: "Do not contact flag identified", approval_required: false }, "Do-not-contact wording matched.", unsubscribeMatches);

  const spamMatches = matchedKeywords(text, ["seo", "backlink", "crypto", "loan", "web design", "marketing agency", "guest post"]);
  if (spamMatches.length) return makeRoute({ classification: "spam/B2B irrelevant", assigned_agent: "ellis", status: "archived", action_taken: "Filtered as low-value B2B/spam", approval_required: false }, "Low-value B2B/spam keyword matched.", spamMatches);

  const theoRoute = classifyTheoBookingIntent(text);
  if (theoRoute) return theoRoute;

  const certificateMatches = matchedKeywords(text, ["certificate", "evidence", "proof of training"]);
  if (certificateMatches.length) return makeRoute({ classification: "certificate request", assigned_agent: "ava", status: "routed", action_taken: "Routed to Ava for compliance/certificate review", approval_required: false }, "Certificate/compliance evidence wording matched.", certificateMatches);

  const trainingMatches = matchedKeywords(text, ["what is pats", "what is midas", "difference between pats and midas", "difference between", "explain", "more information", "information about", "course information", "training support", "passenger assistants", "suitable for", "what training", "pats", "midas", "refresher", "renew", "expired", "expiry", "training due", "training", "course"]);
  if (trainingMatches.length) return makeRoute({ classification: hasAny(["refresher", "renew", "expired", "expiry", "training due"]) ? "refresher enquiry" : "general training enquiry", assigned_agent: "mia", status: "routed", action_taken: "Routed to Mia for safe general training information response", approval_required: false }, "General training/refresher information matched without booking, pricing, dates, attendee logistics or payment intent.", trainingMatches);

  const contentMatches = matchedKeywords(text, ["content", "social", "post", "case study", "news"]);
  if (contentMatches.length) return makeRoute({ classification: "new enquiry", assigned_agent: "nia", status: "routed", action_taken: "Routed to Nia for content opportunity review", approval_required: false }, "Content opportunity wording matched.", contentMatches);

  const researchMatches = matchedKeywords(text, ["partnership", "provider", "school", "council", "local authority", "trust"]);
  if (researchMatches.length) return makeRoute({ classification: "new enquiry", assigned_agent: "rory", status: "routed", action_taken: "Routed to Rory for research/partnership review", approval_required: false }, "Research/partnership wording matched.", researchMatches);

  const infoMatches = matchedKeywords(text, ["information", "details", "tell me more", "course"]);
  if (infoMatches.length) return makeRoute({ classification: "wants more information", assigned_agent: "mia", status: "routed", action_taken: "Routed to Mia for safe information response", approval_required: false }, "Unclear information request defaults to Mia.", infoMatches);

  return makeRoute({ classification: "wants more information", assigned_agent: "mia", status: "routed", action_taken: "Routed to Mia for safe general information response", approval_required: false }, "Unclear enquiry defaults to Mia rather than Theo.", []);
}

function extractAttendeeCount(text: string) {
  const match = text.match(/\b(\d{1,3})\s*(people|persons|attendees|delegates|staff|drivers|passenger assistants|pas|learners|candidates)?\b/i);
  return match ? Math.max(1, Number(match[1])) : null;
}

function findPricingCourse(text: string) {
  return pricingRules.find((course) => course.aliases.some((alias) => text.includes(alias)));
}

function calculateTheoEstimate(message: string) {
  const text = message.toLowerCase();
  const course = findPricingCourse(text);
  const attendees = extractAttendeeCount(text);
  if (!course || !attendees) return null;
  const nums = course.price.match(/\d+/g)?.map(Number) || [];
  if (!nums.length) return null;
  const unit = Math.max(...nums);
  return {
    course_title: course.title,
    attendee_count: attendees,
    listed_price: course.price,
    estimated_unit_price: unit,
    estimated_subtotal: unit * attendees,
    caveat: "Indicative estimate only. It excludes travel fees or custom requirements and does not confirm final pricing, payment amount, dates, availability or a booking.",
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

async function insertAgentActivity(supabase: ReturnType<typeof createClient>, row: Record<string, unknown>) {
  const { error } = await supabase.from("agent_activity_logs").insert(row);
  if (!error) return;
  console.error("Agent activity insert error:", error);
}

async function logAgentActivity(supabase: ReturnType<typeof createClient>, agentKey: string, actionType: string, summary: string, status: string, metadata: Record<string, unknown>, approvalRequired = false) {
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

async function logAuditActivity(supabase: ReturnType<typeof createClient>, agentKey: string, actionType: string, summary: string, status: string, metadata: Record<string, unknown>) {
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

async function sendEmail(resendApiKey: string, body: Record<string, unknown>) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function sendMiaSafeResponse(resendApiKey: string, sender: string, to: string, name: string, enquiryType: string) {
  return sendEmail(resendApiKey, {
    from: sender,
    to: [to],
    subject: "Thanks for contacting ACE MiDAS Training",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <p>Hello ${escapeHtml(name || "there")},</p>
        <p>Thank you for contacting ACE MiDAS Training about ${escapeHtml(enquiryType || "training")}.</p>
        <p>Mia has routed this as a general training information enquiry. The team can help explain MiDAS, PATS, refresher training and the right course route for your organisation.</p>
        <p>If you would like to arrange training, please reply with the course type, attendee numbers, location and preferred timeframe.</p>
        <p>This message does not confirm dates, availability, pricing, bookings or payment links.</p>
        <p>Kind regards,<br />Mia<br />Outreach Coordinator<br />ACE MiDAS Training</p>
      </div>
    `,
  });
}

async function sendTheoSafeResponse(resendApiKey: string, sender: string, to: string, name: string, route: any, estimate: ReturnType<typeof calculateTheoEstimate>) {
  const classification = String(route.classification || "");
  let answer = "We can help with booking enquiries and point you towards the right next step.";
  let nextStep = "Please reply with the course required, number of attendees, location and preferred timeframe.";
  let includeSafetyNote = false;

  if (classification === "group booking enquiry") answer = "Group bookings can be useful when several staff need the same training or refresher route.";
  if (classification === "onsite training enquiry") answer = "Onsite training may be possible depending on the course, attendee numbers, suitable facilities, location and trainer availability.";
  if (classification === "availability enquiry") {
    answer = "Availability has to be checked by the team before anything is confirmed.";
    nextStep = "Please send your preferred timeframe, location, course type and attendee count.";
    includeSafetyNote = true;
  }
  if (classification === "pricing enquiry") {
    answer = estimate ? "I can give an indicative estimate from configured pricing rules." : "Pricing depends on course type, attendee numbers and location.";
  }
  if (classification === "booking process question") answer = "To start a booking request, send the key training details and the team will review the best route.";

  const estimateHtml = estimate ? `<p>Indicative estimate: ${escapeHtml(estimate.course_title)}, ${escapeHtml(estimate.attendee_count)} attendee(s), approximately GBP ${escapeHtml(estimate.estimated_subtotal)} before any travel fee or custom requirements.</p><p>${escapeHtml(estimate.caveat)}</p>` : "";
  const safetyHtml = includeSafetyNote ? "<p>This does not confirm dates, availability or a booking; the team will confirm those separately.</p>" : "";

  return sendEmail(resendApiKey, {
    from: sender,
    to: [to],
    subject: "Booking information from ACE MiDAS Training",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <p>Hello ${escapeHtml(name || "there")},</p>
        <p>Thanks for getting in touch.</p>
        <p>${escapeHtml(answer)}</p>
        ${estimateHtml}
        <p>Current training options and visible group booking information are available here: <a href="${trainingPageUrl}">${trainingPageUrl}</a></p>
        <p>${escapeHtml(nextStep)}</p>
        ${safetyHtml}
        <p>Kind regards,<br />Theo<br />Training Bookings &amp; Sales Coordinator<br />ACE MiDAS Training</p>
      </div>
    `,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) return jsonResponse({ error: "Contact form is not configured." }, 500);

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") return jsonResponse({ error: "Invalid request body." }, 400);

    const name = String(payload.name || payload.fullName || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const phone = String(payload.phone || "").trim();
    const organisation = String(payload.organisation || "").trim();
    const message = String(payload.message || "").trim();
    const source = String(payload.source || "website").trim() || "website";
    const enquiryType = String(payload.enquiryType || "Website enquiry").trim();

    if (!name || !email || !message) return jsonResponse({ error: "Name, email and message are required." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse({ error: "Please enter a valid email address." }, 400);

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
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
    const notification = await sendEmail(resendApiKey, {
      from: sender,
      to: ["info@ace-midas-training.co.uk"],
      reply_to: email,
      subject: `New website enquiry - ${enquiryType}`,
      html: `
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
      `,
    });
    if (!notification.ok) {
      const body = await notification.text();
      console.error("Resend contact email error:", { status: notification.status, body, sender });
      return jsonResponse({ error: "Your enquiry was saved, but the email notification could not be sent." }, 502);
    }

    const route = classifyInboundMessage(message, enquiryType);
    const { data: inboundMessage, error: inboundError } = await supabase.from("inbound_messages").insert({
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
    }).select("id").single();
    if (inboundError) {
      console.error("Inbound message insert error:", inboundError);
      return jsonResponse({ success: true, notification_sent: true, agent_routing_success: false, agent_routing_error: "Inbound message could not be created." });
    }

    const estimate = route.assigned_agent === "theo" && !route.approval_required ? calculateTheoEstimate(message) : null;
    const metadata = {
      contact_submission_id: contactSubmission?.id,
      inbound_message_id: inboundMessage?.id,
      classification: route.classification,
      assigned_agent: route.assigned_agent,
      action_taken: route.action_taken,
      routing_reason: route.routing_reason || "",
      matched_keywords: route.matched_keywords || [],
      approval_required: route.approval_required,
      message_snippet: message.slice(0, 240),
      source: "contact_form",
      from_email: email,
      enquiry_type: enquiryType,
      estimate_calculated: Boolean(estimate),
      training_page_referred: route.assigned_agent === "theo" && !route.approval_required,
      email_sent: false,
    };

    await logAgentActivity(supabase, "ellis", "inbound_message_created", "Ellis captured a contact form message in inbound_messages.", "captured", metadata);
    await logAgentActivity(supabase, "ellis", "inbound_classified", `Ellis classified the contact form message as ${route.classification}.`, "classified", metadata);

    if (route.assigned_agent === "theo" && route.approval_required) {
      const replyDetails = extractReplyDetails(message);
      const { data: theoTask, error: replyError } = await supabase.from("reply_intake").insert({
        contact_name: name,
        contact_email: email,
        message,
        classification: route.classification,
        requested_action: route.action_taken,
        assigned_agent: "theo",
        approval_required: true,
        approval_status: "pending",
        notes: `Created from contact form inbound message ${inboundMessage?.id}`,
        ...replyDetails,
      }).select("id").single();
      if (replyError) {
        console.error("Theo reply intake insert error:", replyError);
        await logAgentActivity(supabase, "theo", "theo_approval_create_failed", "Theo approval task could not be created from contact form message.", "failed", { ...metadata, error: replyError.message }, true);
      } else {
        await logAgentActivity(supabase, "theo", "theo_approval_created", "Theo approval task created from contact form message.", "pending_approval", { ...metadata, reply_intake_id: theoTask?.id }, true);
        await logAuditActivity(supabase, "theo", "theo_approval_created", "Contact form booking/payment enquiry routed to Theo approval queue.", "pending_approval", { ...metadata, reply_intake_id: theoTask?.id });
      }
    } else if (route.assigned_agent === "theo") {
      const theoResponse = await sendTheoSafeResponse(resendApiKey, sender, email, name, route, estimate);
      if (theoResponse.ok) {
        await logAgentActivity(supabase, "theo", "theo_auto_response_sent", "Theo sent a safe booking information response.", "sent", { ...metadata, email_sent: true });
        await logAuditActivity(supabase, "theo", "theo_auto_response_sent", "Theo sent a safe booking information response.", "sent", { ...metadata, email_sent: true });
      } else {
        const error = await theoResponse.text();
        console.error("Theo safe response error:", { status: theoResponse.status, body: error });
        await logAgentActivity(supabase, "theo", "theo_auto_response_failed", "Theo could not send the safe booking information response.", "failed", { ...metadata, error });
      }
    } else if (route.assigned_agent === "mia") {
      const miaResponse = await sendMiaSafeResponse(resendApiKey, sender, email, name, enquiryType);
      if (miaResponse.ok) {
        await logAgentActivity(supabase, "mia", "mia_contact_response_sent", "Mia sent a safe contact form acknowledgement.", "sent", { ...metadata, email_sent: true });
        await logAuditActivity(supabase, "mia", "mia_contact_response_sent", "Mia sent a safe contact form acknowledgement.", "sent", { ...metadata, email_sent: true });
      } else {
        const error = await miaResponse.text();
        console.error("Mia safe response error:", { status: miaResponse.status, body: error });
        await logAgentActivity(supabase, "mia", "mia_contact_response_failed", "Mia could not send the safe contact form acknowledgement.", "failed", { ...metadata, error });
      }
    } else {
      await logAgentActivity(supabase, route.assigned_agent, "agent_task_created", `${agentIdentities[route.assigned_agent]?.name || "Agent"} task created from contact form message.`, route.status, metadata, route.approval_required);
    }

    return jsonResponse({ success: true, notification_sent: true, agent_routing_success: true, inbound_message_id: inboundMessage?.id, assigned_agent: route.assigned_agent, classification: route.classification, action_taken: route.action_taken });
  } catch (error) {
    console.error("Contact form error:", error);
    return jsonResponse({ error: "Unable to send your enquiry. Please try again." }, 500);
  }
});
