import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const notificationLabels: Record<string, string> = {
  training_expiry_90_days: "Training expires in 90 days",
  training_expiry_60_days: "Training expires in 60 days",
  training_expiry_30_days: "Training expires in 30 days",
  training_expiry_7_days: "Training expires in 7 days",
  training_expired: "Training has expired",
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

function formatDate(value: unknown) {
  if (!value) return "Not recorded";
  const text = String(value);
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

async function sendEmail(resendApiKey: string, payload: Record<string, unknown>) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: response.ok, status: response.status, body };
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
    const sender = Deno.env.get("EMAIL_FROM") || "ACE MiDAS Training <onboarding@resend.dev>";
    const fallbackRecipient = Deno.env.get("REMINDER_FALLBACK_EMAIL") || "info@ace-midas-training.co.uk";
    const replyTo = Deno.env.get("AGENT_REPLY_TO") || "info@ace-midas-training.co.uk";

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      return jsonResponse({ error: "Reminder processor is not configured." }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const now = new Date().toISOString();
    const { data: reminders, error: remindersError } = await supabase
      .from("notification_queue")
      .select("id, organisation_id, member_id, training_record_id, type, status, scheduled_for")
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (remindersError) throw remindersError;
    if (!reminders?.length) return jsonResponse({ success: true, processed: 0, sent: 0, failed: 0 });

    const memberIds = [...new Set(reminders.map((item) => item.member_id).filter(Boolean))];
    const organisationIds = [...new Set(reminders.map((item) => item.organisation_id).filter(Boolean))];
    const recordIds = [...new Set(reminders.map((item) => item.training_record_id).filter(Boolean))];

    const [membersResult, organisationsResult, recordsResult] = await Promise.all([
      memberIds.length
        ? supabase.from("members").select("id, organisation_id, full_name, email, role").in("id", memberIds)
        : Promise.resolve({ data: [], error: null }),
      organisationIds.length
        ? supabase.from("organisations").select("id, name, contact_name, contact_email, phone").in("id", organisationIds)
        : Promise.resolve({ data: [], error: null }),
      recordIds.length
        ? supabase.from("training_records").select("id, member_id, course_id, date_completed, expiry_date, status").in("id", recordIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const lookupError = membersResult.error || organisationsResult.error || recordsResult.error;
    if (lookupError) throw lookupError;

    const courseIds = [...new Set((recordsResult.data || []).map((record) => record.course_id).filter(Boolean))];
    const coursesResult = courseIds.length
      ? await supabase.from("courses").select("id, name, validity_months").in("id", courseIds)
      : { data: [], error: null };
    if (coursesResult.error) throw coursesResult.error;

    const membersById = new Map((membersResult.data || []).map((item) => [item.id, item]));
    const organisationsById = new Map((organisationsResult.data || []).map((item) => [item.id, item]));
    const recordsById = new Map((recordsResult.data || []).map((item) => [item.id, item]));
    const coursesById = new Map((coursesResult.data || []).map((item) => [item.id, item]));

    let sent = 0;
    let failed = 0;
    const results = [];

    for (const reminder of reminders) {
      const member = membersById.get(reminder.member_id);
      const organisation = organisationsById.get(reminder.organisation_id || member?.organisation_id);
      const record = recordsById.get(reminder.training_record_id);
      const course = record ? coursesById.get(record.course_id) : null;
      const recipient = member?.email || organisation?.contact_email || fallbackRecipient;
      const label = notificationLabels[reminder.type] || reminder.type;
      const subject = `${label}: ${course?.name || "Training record"}`;

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h1>${escapeHtml(label)}</h1>
          <p>This is an automated ACE MiDAS Training compliance reminder.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Organisation</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(organisation?.name || "Not recorded")}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Staff member</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(member?.full_name || "Not recorded")}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Course</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(course?.name || "Not recorded")}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Date completed</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(formatDate(record?.date_completed))}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Expiry date</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(formatDate(record?.expiry_date))}</td></tr>
          </table>
          <p>Please review this training record and arrange renewal where required.</p>
        </div>
      `;

      const { data: outbox, error: outboxError } = await supabase.from("agent_email_outbox").insert({
        agent_key: "mia",
        agent_name: "Mia",
        purpose: "scheduled_training_reminder",
        recipient_email: recipient,
        sender_email: sender,
        reply_to_email: replyTo,
        bcc_emails: recipient === fallbackRecipient ? [] : [fallbackRecipient],
        subject,
        html_body: html,
        status: "sending",
        organisation_id: reminder.organisation_id || member?.organisation_id || null,
        member_id: reminder.member_id || null,
        training_record_id: reminder.training_record_id || null,
      }).select("id").single();
      if (outboxError || !outbox?.id) throw new Error("Outbound audit record could not be created. Reminder email was not sent.");

      const providerResponse = await sendEmail(resendApiKey, {
        from: sender,
        to: [recipient],
        reply_to: replyTo,
        bcc: recipient === fallbackRecipient ? undefined : [fallbackRecipient],
        subject,
        html,
      });

      const status = providerResponse.ok ? "sent" : "failed";
      const sentAt = providerResponse.ok ? new Date().toISOString() : null;
      const errorMessage = providerResponse.ok ? null : JSON.stringify(providerResponse.body).slice(0, 1000);
      const resendEmailId = typeof providerResponse.body === "object" && providerResponse.body ? (providerResponse.body as Record<string, unknown>).id || null : null;
      await supabase.from("agent_email_outbox").update({
        status: providerResponse.ok ? "accepted" : "failed",
        resend_email_id: resendEmailId,
        provider_response: providerResponse,
        failure_reason: errorMessage,
        sent_at: sentAt,
        updated_at: new Date().toISOString(),
      }).eq("id", outbox.id);

      const [queueUpdate, logInsert] = await Promise.all([
        supabase
          .from("notification_queue")
          .update({ status, sent_at: sentAt, error_message: errorMessage })
          .eq("id", reminder.id),
        supabase.from("notification_logs").insert({
          organisation_id: reminder.organisation_id || member?.organisation_id || null,
          member_id: reminder.member_id || null,
          training_record_id: reminder.training_record_id || null,
          type: reminder.type,
          recipient_email: recipient,
          status,
          provider_response: { ...providerResponse, agent_email_outbox_id: outbox.id, resend_email_id: resendEmailId, reply_to: replyTo },
        }),
      ]);

      if (queueUpdate.error) throw queueUpdate.error;
      if (logInsert.error) throw logInsert.error;

      if (providerResponse.ok) sent += 1;
      else failed += 1;
      results.push({ id: reminder.id, type: reminder.type, status, recipient });
    }

    return jsonResponse({ success: true, processed: reminders.length, sent, failed, results });
  } catch (error) {
    console.error("Reminder processor error:", error);
    return jsonResponse({ error: "Unable to process reminders." }, 500);
  }
});
