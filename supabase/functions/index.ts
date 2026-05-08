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

function classifyInboundMessage(message: string, subject = "") {
  const text = `${subject} ${message}`.toLowerCase();
  const hasAny = (words: string[]) => words.some((word) => text.includes(word));
  if (hasAny(["unsubscribe", "do not contact", "remove me", "opt out"])) {
    return { classification: "unsubscribe/do not contact", assigned_agent: "ellis", status: "filtered", action_taken: "Do not contact flag identified", approval_required: false };
  }
  if (hasAny(["seo", "backlink", "crypto", "loan", "web design", "marketing agency", "guest post"])) {
    return { classification: "spam/B2B irrelevant", assigned_agent: "ellis", status: "archived", action_taken: "Filtered as low-value B2B/spam", approval_required: false };
  }
  if (hasAny(["date", "availability", "available", "book", "booking", "cancel", "reschedule", "payment link", "stripe", "price", "pricing", "quote", "invoice"])) {
    return { classification: hasAny(["price", "pricing", "quote", "payment link", "stripe", "invoice"]) ? "wants pricing" : "booking request", assigned_agent: "theo", status: "pending_approval", action_taken: "Routed to Theo approval queue", approval_required: true };
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

function classifyReply(message: string) {
  const route = classifyInboundMessage(message);
  if (route.assigned_agent === "theo") {
    return {
      classification: route.classification === "wants pricing" ? "wants pricing" : "wants dates",
      requested_action: route.classification === "wants pricing" ? "Review pricing/payment request" : "Review date/booking request",
      assigned_agent: "theo",
      approval_required: true,
    };
  }
  return {
    classification: route.classification,
    requested_action: route.action_taken,
    assigned_agent: route.assigned_agent,
    approval_required: route.approval_required,
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
  await supabase.from("agent_activity_logs").insert({
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

    const { error: insertError } = await supabase.from("contact_submissions").insert({
      name,
      email,
      phone: phone || null,
      organisation: organisation || null,
      message,
      source,
      status: "new",
    });

    if (insertError) {
      console.error("Contact submission insert error:", insertError);
      return jsonResponse({ error: "Unable to save your enquiry. Please try again." }, 500);
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
      return jsonResponse({ error: "Your enquiry was saved, but the agent routing could not be created." }, 500);
    }

    const metadata = {
      inbound_message_id: inboundMessage?.id,
      classification: route.classification,
      source: "contact_form",
      from_email: email,
      enquiry_type: enquiryType,
    };

    if (route.assigned_agent === "theo") {
      const replyRoute = classifyReply(message);
      const replyDetails = extractReplyDetails(message);
      const { error: replyError } = await supabase.from("reply_intake").insert({
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
      });
      if (replyError) {
        console.error("Theo reply intake insert error:", replyError);
        return jsonResponse({ error: "Your enquiry was saved, but the Theo approval task could not be created." }, 500);
      }
    }

    try {
      await logAgentRouting(supabase, route, metadata);
    } catch (logError) {
      console.error("Agent/audit routing log error:", logError);
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

    return jsonResponse({ success: true, inbound_message_id: inboundMessage?.id, assigned_agent: route.assigned_agent, classification: route.classification });
  } catch (error) {
    console.error("Contact form error:", error);
    return jsonResponse({ error: "Unable to send your enquiry. Please try again." }, 500);
  }
});
