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
      console.error("Resend contact email error:", resendResponse.status, resendText);
      return jsonResponse({ error: "Your enquiry was saved, but the email notification could not be sent." }, 502);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return jsonResponse({ error: "Unable to send your enquiry. Please try again." }, 500);
  }
});
