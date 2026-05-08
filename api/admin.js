import { createClient } from "@supabase/supabase-js";

const defaultCourses = [
  { name: "PATS Standard", validity_months: 12 },
  { name: "PATS Accessible", validity_months: 12 },
  { name: "MiDAS Standard", validity_months: 48 },
  { name: "MiDAS Accessible", validity_months: 48 },
  { name: "Children's Transport First Aid", validity_months: 36 },
  { name: "First Aid at Work", validity_months: 36 }
];

function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const trainingNotificationTypes = [
  { type: "training_expiry_90_days", daysBefore: 90 },
  { type: "training_expiry_60_days", daysBefore: 60 },
  { type: "training_expiry_30_days", daysBefore: 30 },
  { type: "training_expiry_7_days", daysBefore: 7 },
  { type: "training_expired", daysBefore: 0 }
];

const evidenceBucket = "training-evidence";
const allowedEvidenceTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const emailSender = process.env.EMAIL_FROM || "ACE MiDAS Training <onboarding@resend.dev>";
const agentIdentities = {
  ava: { name: "Ava", title: "Compliance Monitoring", tone: "Calm, precise and compliance-led", signature: "Ava<br />Compliance Monitoring<br />ACE MiDAS Training" },
  mia: { name: "Mia", title: "Outreach Coordinator", tone: "Helpful, clear and professional", signature: "Mia<br />Outreach Coordinator<br />ACE MiDAS Training" },
  theo: { name: "Theo", title: "Training Bookings Coordinator", tone: "Careful, factual and approval-led", signature: "Theo<br />Training Bookings Coordinator<br />ACE MiDAS Training" },
  nia: { name: "Nia", title: "Content & Engagement", tone: "Warm, practical and brand-aware", signature: "Nia<br />Content & Engagement<br />ACE MiDAS Training" },
  ellis: { name: "Ellis", title: "Inbox Management", tone: "Concise, organised and selective", signature: "Ellis<br />Inbox Management<br />ACE MiDAS Training" },
  rory: { name: "Rory", title: "Research & Partnerships", tone: "Curious, careful and public-data only", signature: "Rory<br />Research & Partnerships<br />ACE MiDAS Training" }
};

function getAgentIdentity(key) {
  return agentIdentities[key] || { name: "ACE Agent", title: "Operations", tone: "Professional", signature: "ACE MiDAS Training" };
}

function safeFileName(name) {
  return String(name || "evidence")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "evidence";
}

function scheduledDateFromExpiry(expiryDate, daysBefore) {
  const expiry = new Date(`${expiryDate}T09:00:00.000Z`);
  if (Number.isNaN(expiry.getTime())) return null;
  expiry.setUTCDate(expiry.getUTCDate() - daysBefore);
  return expiry;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatUkDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB");
}

async function sendAgentEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) throw new Error("Email is not configured. Missing RESEND_API_KEY.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from: emailSender, to: [to], subject, html })
  });
  const body = await response.text();
  if (!response.ok) {
    console.error("Agent Resend error:", { status: response.status, body });
    throw new Error("Unable to send refresher reminder email.");
  }
  let parsedBody = null;
  try {
    parsedBody = body ? JSON.parse(body) : null;
  } catch {
    parsedBody = body;
  }
  return { status: response.status, body: parsedBody };
}

async function insertAgentLog(supabase, log) {
  const { data, error } = await supabase
    .from("agent_activity_logs")
    .insert({
      agent_key: log.agent_key,
      agent_name: log.agent_name,
      agent_role: log.agent_role || log.metadata?.agent_title || null,
      action_type: log.action_type,
      action_label: log.action_label || null,
      organisation_id: log.organisation_id || log.metadata?.organisation_id || null,
      member_id: log.member_id || log.metadata?.member_id || null,
      training_record_id: log.training_record_id || log.metadata?.training_record_id || null,
      summary: log.summary,
      status: log.status || "completed",
      approval_required: log.approval_required === true,
      metadata: log.metadata || {}
    })
    .select("id, agent_key, agent_name, agent_role, action_type, action_label, organisation_id, member_id, training_record_id, summary, status, approval_required, metadata, created_at")
    .single();
  if (error) throw error;
  return data;
}

async function insertAuditLog(supabase, log) {
  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      actor_type: log.actor_type || "agent",
      actor_name: log.actor_name || "ACE Agent",
      action_type: log.action_type || "agent_action",
      summary: log.summary || "",
      status: log.status || "completed",
      metadata: log.metadata || {}
    })
    .select("id, actor_type, actor_name, action_type, summary, status, metadata, created_at")
    .single();
  if (error) throw error;
  return data;
}

async function scheduleTrainingNotifications(supabase, trainingRecord) {
  const expiryDate = String(trainingRecord?.expiry_date || "");
  const trainingRecordId = String(trainingRecord?.id || "");
  const memberId = String(trainingRecord?.member_id || "");
  if (!expiryDate || !trainingRecordId || !memberId) return [];

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, organisation_id")
    .eq("id", memberId)
    .maybeSingle();
  if (memberError) throw memberError;

  const now = new Date();
  const expiry = scheduledDateFromExpiry(expiryDate, 0);
  if (!expiry) return [];

  const rows = trainingNotificationTypes
    .map(({ type, daysBefore }) => ({ type, scheduledFor: scheduledDateFromExpiry(expiryDate, daysBefore) }))
    .filter(({ type, scheduledFor }) => {
      if (!scheduledFor) return false;
      if (type === "training_expired") return true;
      return scheduledFor >= now;
    })
    .map(({ type, scheduledFor }) => ({
      organisation_id: member?.organisation_id || null,
      member_id: memberId,
      training_record_id: trainingRecordId,
      type,
      status: "pending",
      scheduled_for: scheduledFor.toISOString()
    }));

  const types = trainingNotificationTypes.map((item) => item.type);
  const { error: deleteError } = await supabase
    .from("notification_queue")
    .delete()
    .eq("training_record_id", trainingRecordId)
    .in("type", types)
    .eq("status", "pending");
  if (deleteError) throw deleteError;

  if (!rows.length) return [];
  const { data, error } = await supabase
    .from("notification_queue")
    .insert(rows)
    .select("id, organisation_id, member_id, training_record_id, type, status, scheduled_for, created_at");
  if (error) throw error;
  return data || [];
}

async function ensureCourses(supabase) {
  const { data, error } = await supabase.from("courses").select("id, name, validity_months, created_at").order("name", { ascending: true });
  if (error) throw error;
  if (data?.length) return data;
  const { data: seeded, error: seedError } = await supabase.from("courses").insert(defaultCourses).select("id, name, validity_months, created_at");
  if (seedError) throw seedError;
  return (seeded || []).sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

async function getTrainingCompliance(supabase) {
  const courses = await ensureCourses(supabase);
  const [organisationsResult, membersResult, recordsResult, evidenceResult, remindersResult, reminderLogsResult, agentLogsResult, prospectsResult, repliesResult] = await Promise.all([
    supabase.from("organisations").select("id, name, contact_name, contact_email, phone, created_at").order("name", { ascending: true }),
    supabase.from("members").select("id, organisation_id, full_name, email, role, created_at").order("full_name", { ascending: true }),
    supabase.from("training_records").select("id, member_id, course_id, date_completed, expiry_date, status, created_at").order("expiry_date", { ascending: true }),
    supabase.from("training_evidence").select("id, organisation_id, member_id, training_record_id, file_name, file_path, file_type, uploaded_by, uploaded_at").order("uploaded_at", { ascending: false }),
    supabase.from("notification_queue").select("id, organisation_id, member_id, training_record_id, type, status, scheduled_for, sent_at, error_message, created_at").order("created_at", { ascending: false }),
    supabase.from("notification_logs").select("id, organisation_id, member_id, training_record_id, type, recipient_email, status, provider_response, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("agent_activity_logs").select("id, agent_key, agent_name, agent_role, action_type, action_label, organisation_id, member_id, training_record_id, summary, status, approval_required, metadata, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("prospects").select("id, organisation_name, website, location, sector, likely_training_need, contact_email, phone, decision_maker_name, source_url, notes, priority, relevance_reason, review_status, created_by_agent, created_at, updated_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("reply_intake").select("id, organisation_id, member_id, training_record_id, contact_name, contact_email, message, classification, requested_action, assigned_agent, approval_required, approval_status, requested_course, attendees, location, preferred_dates, urgency, approved_dates, approved_availability_wording, approved_price_payment_instruction, theo_notes, draft_response, notes, created_at, updated_at").order("created_at", { ascending: false }).limit(100)
  ]);
  const error = organisationsResult.error || membersResult.error || recordsResult.error;
  if (error) throw error;
  return {
    success: true,
    organisations: organisationsResult.data || [],
    members: membersResult.data || [],
    courses,
    records: recordsResult.data || [],
    evidence: evidenceResult.error ? [] : evidenceResult.data || [],
    reminders: remindersResult.error ? [] : remindersResult.data || [],
    reminderLogs: reminderLogsResult.error ? [] : reminderLogsResult.data || [],
    agentLogs: agentLogsResult.error ? [] : agentLogsResult.data || [],
    prospects: prospectsResult.error ? [] : prospectsResult.data || [],
    replies: repliesResult.error ? [] : repliesResult.data || [],
    counts: {
      organisations: organisationsResult.data?.length || 0,
      members: membersResult.data?.length || 0,
      courses: courses.length,
      records: recordsResult.data?.length || 0,
      evidence: evidenceResult.error ? 0 : evidenceResult.data?.length || 0,
      reminders: remindersResult.error ? 0 : remindersResult.data?.length || 0,
      reminderLogs: reminderLogsResult.error ? 0 : reminderLogsResult.data?.length || 0,
      agentLogs: agentLogsResult.error ? 0 : agentLogsResult.data?.length || 0,
      prospects: prospectsResult.error ? 0 : prospectsResult.data?.length || 0,
      replies: repliesResult.error ? 0 : repliesResult.data?.length || 0
    }
  };
}

async function getSettings(supabase) {
  const { data, error } = await supabase.from("site_settings").select("setting_value, updated_at").eq("setting_key", "business_settings").maybeSingle();
  if (error) throw error;
  return { success: true, settings: data?.setting_value || null, updated_at: data?.updated_at || null };
}

async function getReportHistory(supabase) {
  const { data, error } = await supabase
    .from("report_history")
    .select("id, organisation_id, report_type, file_name, generated_by, status, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw error;
  return { success: true, reports: data || [] };
}

async function saveReportHistory(supabase, payload) {
  const report = payload?.report || {};
  const row = {
    organisation_id: report.organisation_id || null,
    report_type: String(report.report_type || "").trim(),
    file_name: String(report.file_name || "").trim(),
    generated_by: String(report.generated_by || "Back Office").trim(),
    status: String(report.status || "generated").trim()
  };
  if (!row.report_type || !row.file_name) throw new Error("Report type and file name are required.");
  const { data, error } = await supabase
    .from("report_history")
    .insert(row)
    .select("id, organisation_id, report_type, file_name, generated_by, status, created_at")
    .single();
  if (error) throw error;
  return { success: true, report: data };
}

async function saveSettings(supabase, payload) {
  const settings = payload?.settings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) throw new Error("Settings payload is required.");
  const savedAt = new Date().toISOString();
  const { error } = await supabase.from("site_settings").upsert({
    setting_key: "business_settings",
    setting_value: settings,
    updated_at: savedAt
  }, { onConflict: "setting_key" });
  if (error) throw error;
  const verified = await getSettings(supabase);
  if (!verified.settings) throw new Error("Save could not be verified.");
  return { ...verified, updated_at: verified.updated_at || savedAt };
}

async function saveOrganisation(supabase, payload) {
  const organisation = payload?.organisation || {};
  const id = organisation.id ? String(organisation.id) : "";
  const row = {
    name: String(organisation.name || "").trim(),
    contact_name: String(organisation.contact_name || "").trim(),
    contact_email: String(organisation.contact_email || "").trim(),
    phone: String(organisation.phone || "").trim()
  };
  if (!row.name) throw new Error("Organisation name is required.");
  const query = id ? supabase.from("organisations").update(row).eq("id", id) : supabase.from("organisations").insert(row);
  const { data, error } = await query.select("id, name, contact_name, contact_email, phone, created_at").single();
  if (error) throw error;
  const compliance = await getTrainingCompliance(supabase);
  if (!compliance.organisations.some((item) => item.id === data.id)) throw new Error("Organisation saved but could not be verified.");
  return { success: true, organisation: data, organisations: compliance.organisations, count: compliance.organisations.length };
}

async function deleteOrganisation(supabase, payload) {
  const id = String(payload?.id || "");
  if (!id) throw new Error("Organisation id is required.");
  const { error } = await supabase.from("organisations").delete().eq("id", id);
  if (error) throw error;
  return { success: true, id };
}

async function saveMember(supabase, payload) {
  const member = payload?.member || {};
  const id = member.id ? String(member.id) : "";
  const row = {
    organisation_id: String(member.organisation_id || ""),
    full_name: String(member.full_name || "").trim(),
    email: String(member.email || "").trim(),
    role: String(member.role || "").trim()
  };
  if (!row.organisation_id || !row.full_name || !row.email || !row.role) throw new Error("Organisation, staff name, email and role are required.");
  const query = id ? supabase.from("members").update(row).eq("id", id) : supabase.from("members").insert(row);
  const { data, error } = await query.select("id, organisation_id, full_name, email, role, created_at").single();
  if (error) throw error;
  return { success: true, member: data };
}

async function deleteMember(supabase, payload) {
  const id = String(payload?.id || "");
  if (!id) throw new Error("Member id is required.");
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw error;
  return { success: true, id };
}

async function saveTrainingRecord(supabase, payload) {
  const record = payload?.record || {};
  const row = {
    member_id: String(record.member_id || ""),
    course_id: String(record.course_id || ""),
    date_completed: String(record.date_completed || ""),
    expiry_date: String(record.expiry_date || ""),
    status: String(record.status || "valid")
  };
  if (!row.member_id || !row.course_id || !row.date_completed || !row.expiry_date) throw new Error("Staff member, course and completed date are required.");
  const { data, error } = await supabase.from("training_records").insert(row).select("id, member_id, course_id, date_completed, expiry_date, status, created_at").single();
  if (error) throw error;
  const notifications = await scheduleTrainingNotifications(supabase, data);
  return { success: true, record: data, notifications };
}

async function deleteTrainingRecord(supabase, payload) {
  const id = String(payload?.id || "");
  if (!id) throw new Error("Training record id is required.");
  const { data: evidenceRows, error: evidenceFetchError } = await supabase
    .from("training_evidence")
    .select("file_path")
    .eq("training_record_id", id);
  if (evidenceFetchError) throw evidenceFetchError;
  const evidencePaths = (evidenceRows || []).map((item) => item.file_path).filter(Boolean);
  if (evidencePaths.length) {
    const { error: storageError } = await supabase.storage.from(evidenceBucket).remove(evidencePaths);
    if (storageError) throw storageError;
  }
  const { error: notificationError } = await supabase
    .from("notification_queue")
    .delete()
    .eq("training_record_id", id)
    .in("type", trainingNotificationTypes.map((item) => item.type));
  if (notificationError) throw notificationError;
  const { error } = await supabase.from("training_records").delete().eq("id", id);
  if (error) throw error;
  return { success: true, id };
}

async function uploadTrainingEvidence(supabase, payload) {
  const evidence = payload?.evidence || {};
  const organisationId = String(evidence.organisation_id || "");
  const memberId = String(evidence.member_id || "");
  const trainingRecordId = String(evidence.training_record_id || "");
  const fileName = safeFileName(evidence.file_name);
  const fileType = String(evidence.file_type || "");
  const fileData = String(evidence.file_data || "");
  if (!organisationId || !memberId || !trainingRecordId) throw new Error("Training record details are required.");
  if (!allowedEvidenceTypes.has(fileType)) throw new Error("Only PDF and image uploads are allowed.");
  if (!fileData) throw new Error("Evidence file is required.");

  const buffer = Buffer.from(fileData, "base64");
  if (!buffer.length) throw new Error("Evidence file could not be read.");
  if (buffer.length > 10485760) throw new Error("Evidence file must be 10MB or smaller.");

  const filePath = `${organisationId}/${memberId}/${trainingRecordId}/${Date.now()}-${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from(evidenceBucket)
    .upload(filePath, buffer, { contentType: fileType, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("training_evidence")
    .insert({
      organisation_id: organisationId,
      member_id: memberId,
      training_record_id: trainingRecordId,
      file_name: fileName,
      file_path: filePath,
      file_type: fileType,
      uploaded_by: evidence.uploaded_by || null
    })
    .select("id, organisation_id, member_id, training_record_id, file_name, file_path, file_type, uploaded_by, uploaded_at")
    .single();
  if (error) throw error;
  return { success: true, evidence: data };
}

async function deleteTrainingEvidence(supabase, payload) {
  const id = String(payload?.id || "");
  if (!id) throw new Error("Evidence id is required.");
  const { data: evidence, error: fetchError } = await supabase
    .from("training_evidence")
    .select("id, file_path")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!evidence) throw new Error("Evidence file was not found.");

  const { error: storageError } = await supabase.storage.from(evidenceBucket).remove([evidence.file_path]);
  if (storageError) throw storageError;
  const { error } = await supabase.from("training_evidence").delete().eq("id", id);
  if (error) throw error;
  return { success: true, id };
}

async function getTrainingEvidenceUrl(supabase, payload) {
  const id = String(payload?.id || "");
  const download = payload?.download !== false;
  if (!id) throw new Error("Evidence id is required.");
  const { data: evidence, error: fetchError } = await supabase
    .from("training_evidence")
    .select("id, file_name, file_path, file_type")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!evidence) throw new Error("Evidence file was not found.");
  const options = download ? { download: evidence.file_name } : undefined;
  const { data, error } = await supabase.storage.from(evidenceBucket).createSignedUrl(evidence.file_path, 300, options);
  if (error) throw error;
  return { success: true, url: data?.signedUrl || "", evidence };
}

function normaliseProspectPriority(priority) {
  const value = String(priority || "medium").toLowerCase();
  return ["high", "medium", "low"].includes(value) ? value : "medium";
}

function normaliseProspectReviewStatus(status) {
  const value = String(status || "pending_review").toLowerCase();
  return ["pending_review", "approved", "rejected"].includes(value) ? value : "pending_review";
}

function classifyReply(message) {
  const text = String(message || "").toLowerCase();
  const hasAny = (words) => words.some((word) => text.includes(word));
  if (hasAny(["unsubscribe", "do not contact", "don't contact", "remove me", "opt out"])) {
    return { classification: "unsubscribe/do not contact", requested_action: "Do not contact", assigned_agent: "mia", approval_required: false };
  }
  if (hasAny(["wrong contact", "not the right person", "not responsible", "left the organisation"])) {
    return { classification: "wrong contact", requested_action: "Update contact", assigned_agent: "ellis", approval_required: false };
  }
  if (hasAny(["not interested", "no thanks", "not needed", "we don't need"])) {
    return { classification: "not interested", requested_action: "Mark not interested", assigned_agent: "mia", approval_required: false };
  }
  if (hasAny(["date", "availability", "available", "book", "booking", "reschedule", "change", "cancel", "cancellation"])) {
    return { classification: "wants dates", requested_action: "Review date/booking request", assigned_agent: "theo", approval_required: true };
  }
  if (hasAny(["price", "pricing", "cost", "quote", "discount", "payment link", "stripe", "invoice"])) {
    return { classification: "wants pricing", requested_action: "Review pricing/payment request", assigned_agent: "theo", approval_required: true };
  }
  if (hasAny(["information", "info", "details", "tell me more", "send more", "course content", "duration"])) {
    return { classification: "wants more information", requested_action: "Mia may send safe information response", assigned_agent: "mia", approval_required: false };
  }
  if (hasAny(["yes", "interested", "refresher", "training", "renew"])) {
    return { classification: "interested", requested_action: "Follow up safely without confirming dates", assigned_agent: "mia", approval_required: false };
  }
  return { classification: "wants more information", requested_action: "Review reply and prepare safe response", assigned_agent: "mia", approval_required: false };
}

function extractReplyDetails(message) {
  const text = String(message || "");
  const lower = text.toLowerCase();
  const course = ["MiDAS Accessible", "MiDAS Standard", "PATS Accessible", "PATS Standard", "First Aid at Work", "First Aid"].find((name) => lower.includes(name.toLowerCase())) || "";
  const attendeesMatch = lower.match(/(\d+)\s*(attendees|delegates|staff|people|drivers|passenger assistants|pas)/i);
  const dateMatches = text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]+\s+\d{4}|Monday|Tuesday|Wednesday|Thursday|Friday|next week|this week|asap|urgent)\b/gi) || [];
  const locationMatch = text.match(/\b(in|at|near)\s+([A-Z][A-Za-z\s]{2,40})(?:[,.]|\s|$)/);
  const urgency = lower.includes("urgent") || lower.includes("asap") || lower.includes("soon") ? "High" : lower.includes("next month") || lower.includes("flexible") ? "Low" : "Medium";
  return {
    requested_course: course,
    attendees: attendeesMatch ? attendeesMatch[1] : "",
    location: locationMatch ? locationMatch[2].trim() : "",
    preferred_dates: [...new Set(dateMatches)].join(", "),
    urgency
  };
}

function buildTheoDraft(reply, decision = {}) {
  const lines = [];
  lines.push(`Hello ${reply.contact_name || "there"},`);
  lines.push("");
  lines.push("Thank you for your message.");
  if (decision.approved_dates) {
    lines.push(`The dates approved for discussion are: ${decision.approved_dates}.`);
  } else {
    lines.push("We will check availability and confirm suitable options before any booking is finalised.");
  }
  if (decision.approved_availability_wording) lines.push(decision.approved_availability_wording);
  if (decision.approved_price_payment_instruction) lines.push(decision.approved_price_payment_instruction);
  if (!decision.approved_dates && !decision.approved_availability_wording && !decision.approved_price_payment_instruction) {
    lines.push("Please send any preferred dates, location details and delegate numbers so the team can review availability.");
  }
  lines.push("");
  lines.push("This message does not confirm a booking until ACE MiDAS Training has agreed the final date and arrangements.");
  lines.push("");
  lines.push("Kind regards,");
  lines.push("Theo");
  lines.push("Training Bookings Coordinator");
  lines.push("ACE MiDAS Training");
  return lines.join("\n");
}

async function saveReplyIntake(supabase, payload) {
  const reply = payload?.reply || {};
  const classification = classifyReply(reply.message);
  const theo = getAgentIdentity("theo");
  const mia = getAgentIdentity("mia");
  const assignedIdentity = classification.assigned_agent === "theo" ? theo : mia;
  const row = {
    organisation_id: reply.organisation_id || null,
    member_id: reply.member_id || null,
    training_record_id: reply.training_record_id || null,
    contact_name: String(reply.contact_name || "").trim(),
    contact_email: String(reply.contact_email || "").trim(),
    message: String(reply.message || "").trim(),
    classification: classification.classification,
    requested_action: classification.requested_action,
    assigned_agent: classification.assigned_agent,
    approval_required: classification.approval_required,
    approval_status: classification.approval_required ? "pending" : "not_required",
    notes: String(reply.notes || "").trim(),
    updated_at: new Date().toISOString()
  };
  Object.assign(row, extractReplyDetails(row.message));
  if (!row.message) throw new Error("Reply message is required.");
  const { data, error } = await supabase
    .from("reply_intake")
    .insert(row)
    .select("id, organisation_id, member_id, training_record_id, contact_name, contact_email, message, classification, requested_action, assigned_agent, approval_required, approval_status, requested_course, attendees, location, preferred_dates, urgency, approved_dates, approved_availability_wording, approved_price_payment_instruction, theo_notes, draft_response, notes, created_at, updated_at")
    .single();
  if (error) throw error;
  const metadata = { reply_id: data.id, classification: data.classification, requested_action: data.requested_action, contact_email: data.contact_email };
  await insertAgentLog(supabase, {
    agent_key: data.assigned_agent,
    agent_name: assignedIdentity.name,
    agent_role: assignedIdentity.title,
    action_type: data.approval_required ? "reply_requires_approval" : "reply_classified",
    action_label: data.requested_action,
    organisation_id: data.organisation_id,
    member_id: data.member_id,
    training_record_id: data.training_record_id,
    summary: `${assignedIdentity.name} (${assignedIdentity.title}) classified a reply as ${data.classification}.`,
    status: data.approval_required ? "pending_approval" : "classified",
    approval_required: data.approval_required,
    metadata
  });
  await insertAuditLog(supabase, {
    actor_name: `${assignedIdentity.name} - ${assignedIdentity.title}`,
    action_type: data.approval_required ? "reply_routed_to_theo" : "reply_classified",
    summary: data.approval_required ? "Customer reply was routed to Theo for human approval." : "Customer reply was classified for safe follow-up.",
    status: data.approval_required ? "pending_approval" : "classified",
    metadata
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, reply: data, replies: compliance.replies, agentLogs: compliance.agentLogs };
}

async function updateReplyApproval(supabase, payload) {
  const id = String(payload?.id || "");
  const decision = String(payload?.approval_status || "").toLowerCase();
  const notes = String(payload?.notes || "").trim();
  const decisionFields = {
    approved_dates: String(payload?.approved_dates || "").trim(),
    approved_availability_wording: String(payload?.approved_availability_wording || "").trim(),
    approved_price_payment_instruction: String(payload?.approved_price_payment_instruction || "").trim(),
    theo_notes: notes
  };
  if (!id) throw new Error("Reply ID is required.");
  if (!["approved", "rejected", "needs_more_info", "edit_response"].includes(decision)) throw new Error("Approval decision is not supported.");
  const theo = getAgentIdentity("theo");
  const { data: existing, error: existingError } = await supabase
    .from("reply_intake")
    .select("id, contact_name, contact_email, message")
    .eq("id", id)
    .maybeSingle();
  if (existingError) throw existingError;
  const draftResponse = decision === "approved" || decision === "needs_more_info" || decision === "edit_response" ? buildTheoDraft(existing || {}, decisionFields) : "";
  const { data, error } = await supabase
    .from("reply_intake")
    .update({ approval_status: decision, notes, ...decisionFields, draft_response: draftResponse, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, organisation_id, member_id, training_record_id, contact_name, contact_email, message, classification, requested_action, assigned_agent, approval_required, approval_status, requested_course, attendees, location, preferred_dates, urgency, approved_dates, approved_availability_wording, approved_price_payment_instruction, theo_notes, draft_response, notes, created_at, updated_at")
    .single();
  if (error) throw error;
  const metadata = { reply_id: data.id, classification: data.classification, requested_action: data.requested_action, decision, notes };
  await insertAgentLog(supabase, {
    agent_key: "theo",
    agent_name: theo.name,
    agent_role: theo.title,
    action_type: `theo_approval_${decision}`,
    action_label: data.requested_action,
    organisation_id: data.organisation_id,
    member_id: data.member_id,
    training_record_id: data.training_record_id,
    summary: `${theo.name} (${theo.title}) reply approval was ${decision}.`,
    status: decision,
    approval_required: true,
    metadata
  });
  await insertAuditLog(supabase, {
    actor_name: `${theo.name} - ${theo.title}`,
    action_type: `theo_reply_approval_${decision}`,
    summary: `Theo approval queue item was ${decision}.`,
    status: decision,
    metadata
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, reply: data, replies: compliance.replies, agentLogs: compliance.agentLogs };
}

async function sendTheoApprovedResponse(supabase, payload) {
  const id = String(payload?.id || "");
  if (!id) throw new Error("Reply ID is required.");
  const theo = getAgentIdentity("theo");
  const { data: reply, error } = await supabase
    .from("reply_intake")
    .select("id, organisation_id, member_id, training_record_id, contact_name, contact_email, message, classification, requested_action, approval_status, draft_response, approved_dates, approved_availability_wording, approved_price_payment_instruction")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!reply) throw new Error("Reply approval item was not found.");
  if (!reply.contact_email) throw new Error("Contact email is required before Theo can send a response.");
  if (!["approved", "needs_more_info"].includes(reply.approval_status)) throw new Error("Theo response must be approved or marked needs more information before sending.");
  const draft = reply.draft_response || buildTheoDraft(reply, reply);
  const html = `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 680px; margin: 0 auto;">${draft.split("\n").map((line) => line ? `<p>${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : "<br />").join("")}</div>`;
  const providerResponse = await sendAgentEmail({ to: reply.contact_email, subject: "ACE MiDAS Training booking enquiry", html });
  const metadata = { reply_id: reply.id, organisation_id: reply.organisation_id, member_id: reply.member_id, training_record_id: reply.training_record_id, provider_response: providerResponse };
  await supabase.from("reply_intake").update({ approval_status: "sent", updated_at: new Date().toISOString() }).eq("id", id);
  await insertAgentLog(supabase, {
    agent_key: "theo",
    agent_name: theo.name,
    agent_role: theo.title,
    action_type: "theo_response_sent",
    action_label: "Approved booking response sent",
    organisation_id: reply.organisation_id,
    member_id: reply.member_id,
    training_record_id: reply.training_record_id,
    summary: `${theo.name} (${theo.title}) sent an approved booking response to ${reply.contact_email}.`,
    status: "sent",
    approval_required: true,
    metadata
  });
  await insertAuditLog(supabase, {
    actor_name: `${theo.name} - ${theo.title}`,
    action_type: "theo_approved_response_sent",
    summary: "Theo sent an approved booking response after admin review.",
    status: "sent",
    metadata
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, replies: compliance.replies, agentLogs: compliance.agentLogs };
}

async function saveProspect(supabase, payload) {
  const prospect = payload?.prospect || {};
  const rory = getAgentIdentity("rory");
  const row = {
    organisation_name: String(prospect.organisation_name || "").trim(),
    website: String(prospect.website || "").trim(),
    location: String(prospect.location || "").trim(),
    sector: String(prospect.sector || "").trim(),
    likely_training_need: String(prospect.likely_training_need || "").trim(),
    contact_email: String(prospect.contact_email || "").trim(),
    phone: String(prospect.phone || "").trim(),
    decision_maker_name: String(prospect.decision_maker_name || "").trim(),
    source_url: String(prospect.source_url || "").trim(),
    notes: String(prospect.notes || "").trim(),
    priority: normaliseProspectPriority(prospect.priority),
    relevance_reason: String(prospect.relevance_reason || "").trim(),
    review_status: normaliseProspectReviewStatus(prospect.review_status),
    created_by_agent: "rory",
    updated_at: new Date().toISOString()
  };
  if (!row.organisation_name) throw new Error("Organisation name is required.");
  if (!row.source_url) throw new Error("Source URL is required so the public source can be reviewed.");
  const query = prospect.id
    ? supabase.from("prospects").update(row).eq("id", prospect.id)
    : supabase.from("prospects").insert(row);
  const { data, error } = await query
    .select("id, organisation_name, website, location, sector, likely_training_need, contact_email, phone, decision_maker_name, source_url, notes, priority, relevance_reason, review_status, created_by_agent, created_at, updated_at")
    .single();
  if (error) throw error;
  await insertAgentLog(supabase, {
    agent_key: "rory",
    agent_name: rory.name,
    action_type: prospect.id ? "prospect_updated" : "prospect_added",
    summary: `${rory.name} (${rory.title}) added ${data.organisation_name} to the prospect review list.`,
    status: "pending_review",
    approval_required: true,
    metadata: { prospect_id: data.id, priority: data.priority, sector: data.sector, source_url: data.source_url, agent_title: rory.title, agent_tone: rory.tone }
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, prospect: data, prospects: compliance.prospects, agentLogs: compliance.agentLogs };
}

async function updateProspectStatus(supabase, payload) {
  const id = String(payload?.id || "");
  const reviewStatus = normaliseProspectReviewStatus(payload?.review_status);
  const rory = getAgentIdentity("rory");
  if (!id) throw new Error("Prospect ID is required.");
  const { data, error } = await supabase
    .from("prospects")
    .update({ review_status: reviewStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, organisation_name, website, location, sector, likely_training_need, contact_email, phone, decision_maker_name, source_url, notes, priority, relevance_reason, review_status, created_by_agent, created_at, updated_at")
    .single();
  if (error) throw error;
  await insertAgentLog(supabase, {
    agent_key: "rory",
    agent_name: rory.name,
    action_type: `prospect_${reviewStatus}`,
    summary: `${rory.name} (${rory.title}) prospect ${data.organisation_name} was marked ${reviewStatus.replace("_", " ")}.`,
    status: reviewStatus,
    approval_required: reviewStatus === "pending_review",
    metadata: { prospect_id: data.id, priority: data.priority, sector: data.sector, agent_title: rory.title, agent_tone: rory.tone }
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, prospect: data, prospects: compliance.prospects, agentLogs: compliance.agentLogs };
}

async function runAvaMiaWorkflow(supabase) {
  const ava = getAgentIdentity("ava");
  const mia = getAgentIdentity("mia");
  const theo = getAgentIdentity("theo");
  const { organisations, members, courses, records, agentLogs } = await getTrainingCompliance(supabase);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = todayIsoDate();
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const organisationMap = new Map(organisations.map((org) => [org.id, org]));
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const sentWindowKeys = new Set((agentLogs || [])
    .filter((log) => log.action_type === "mia_refresher_sent" && log.metadata?.reminder_window === "30_days")
    .map((log) => String(log.metadata?.training_record_id || "")));

  const expiringRecords = records.filter((record) => {
    if (!record.expiry_date) return false;
    const expiry = new Date(`${record.expiry_date}T00:00:00`);
    if (Number.isNaN(expiry.getTime())) return false;
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  });

  const avaLog = await insertAgentLog(supabase, {
    agent_key: "ava",
    agent_name: ava.name,
    action_type: "compliance_scan",
    summary: `${ava.name} (${ava.title}) detected ${expiringRecords.length} training record(s) expiring within 30 days.`,
    status: "completed",
    approval_required: false,
    metadata: { expiring_within_30_days: expiringRecords.length, agent_title: ava.title, agent_tone: ava.tone }
  });

  let sent = 0;
  let skippedDuplicates = 0;
  let skippedMissingEmail = 0;
  let failed = 0;
  const logs = [avaLog];
  for (const record of expiringRecords) {
    if (sentWindowKeys.has(record.id)) {
      skippedDuplicates += 1;
      continue;
    }
    const member = memberMap.get(record.member_id);
    if (!member?.email) {
      skippedMissingEmail += 1;
      continue;
    }
    const organisation = organisationMap.get(member.organisation_id);
    const course = courseMap.get(record.course_id);
    const subject = `Training refresher reminder - ${course?.name || "training record"}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 680px; margin: 0 auto;">
        <h1 style="color: #059669;">Training refresher reminder</h1>
        <p>Hello ${member.full_name || "there"},</p>
        <p>This is a standard ACE MiDAS Training reminder that a training record is due to expire soon.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Organisation</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${organisation?.name || "Not recorded"}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Course</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${course?.name || "Training"}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Expiry date</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatUkDate(record.expiry_date)}</td></tr>
        </table>
        <p>If refresher training is needed, please reply to this email or visit https://www.ace-midas-training.co.uk/training to arrange the next step.</p>
        <p>This reminder does not confirm dates, availability, pricing or bookings.</p>
        <p>Kind regards,<br />${mia.signature}</p>
      </div>
    `;
    try {
      const providerResponse = await sendAgentEmail({ to: member.email, subject, html });
      const metadata = { training_record_id: record.id, member_id: member.id, organisation_id: member.organisation_id, course_id: record.course_id, reminder_window: "30_days", provider_response: providerResponse, agent_title: mia.title, agent_tone: mia.tone, signature: mia.signature };
      const miaLog = await insertAgentLog(supabase, {
        agent_key: "mia",
        agent_name: mia.name,
        action_type: "mia_refresher_sent",
        summary: `${mia.name} (${mia.title}) sent a standard refresher reminder to ${member.email}.`,
        status: "completed",
        approval_required: false,
        metadata
      });
      await insertAuditLog(supabase, {
        actor_name: `${mia.name} - ${mia.title}`,
        action_type: "mia_refresher_email_sent",
        summary: `${mia.name} sent a 30-day refresher reminder for ${course?.name || "training"} to ${member.email}.`,
        status: "sent",
        metadata
      });
      logs.push(miaLog);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error("Mia refresher send error:", { recordId: record.id, email: member.email, error });
      const metadata = { training_record_id: record.id, member_id: member.id, organisation_id: member.organisation_id, course_id: record.course_id, reminder_window: "30_days", error: error.message || "Unable to send refresher reminder", agent_title: mia.title };
      const failedLog = await insertAgentLog(supabase, {
        agent_key: "mia",
        agent_name: mia.name,
        action_type: "mia_refresher_failed",
        summary: `${mia.name} (${mia.title}) could not send a refresher reminder to ${member.email}.`,
        status: "failed",
        approval_required: false,
        metadata
      });
      await insertAuditLog(supabase, {
        actor_name: `${mia.name} - ${mia.title}`,
        action_type: "mia_refresher_email_failed",
        summary: `${mia.name} could not send a 30-day refresher reminder to ${member.email}.`,
        status: "failed",
        metadata
      });
      logs.push(failedLog);
    }
  }

  const theoLog = await insertAgentLog(supabase, {
    agent_key: "theo",
    agent_name: theo.name,
    action_type: "booking_approval_guard",
    summary: `${theo.name} (${theo.title}) kept booking/date/payment decisions routed to human approval.`,
    status: "pending_approval",
    approval_required: true,
    metadata: { guarded_actions: ["dates", "availability", "booking changes", "cancellations", "custom prices", "custom Stripe payment links"], agent_title: theo.title, agent_tone: theo.tone }
  });
  logs.push(theoLog);
  return { success: true, remindersFound: expiringRecords.length, emailsSent: sent, skippedDuplicates, skippedMissingEmail, failedSends: failed, scanned: expiringRecords.length, remindersSent: sent, skipped: skippedDuplicates + skippedMissingEmail, logs };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(500).json({ error: "Supabase server configuration is missing." });

    const action = String(req.body?.action || "");
    const payload = req.body?.payload || {};
    const actions = {
      "get-settings": getSettings,
      "save-settings": saveSettings,
      "get-report-history": getReportHistory,
      "save-report-history": saveReportHistory,
      "get-training-compliance": getTrainingCompliance,
      "save-organisation": saveOrganisation,
      "delete-organisation": deleteOrganisation,
      "save-member": saveMember,
      "delete-member": deleteMember,
      "save-training-record": saveTrainingRecord,
      "delete-training-record": deleteTrainingRecord,
      "upload-training-evidence": uploadTrainingEvidence,
      "delete-training-evidence": deleteTrainingEvidence,
      "get-training-evidence-url": getTrainingEvidenceUrl,
      "save-prospect": saveProspect,
      "update-prospect-status": updateProspectStatus,
      "save-reply-intake": saveReplyIntake,
      "update-reply-approval": updateReplyApproval,
      "send-theo-approved-response": sendTheoApprovedResponse,
      "run-ava-mia-workflow": runAvaMiaWorkflow
    };
    if (!actions[action]) return res.status(400).json({ error: "Unknown admin action." });
    const result = await actions[action](supabase, payload);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Admin API error:", error);
    return res.status(500).json({ error: error.message || "Admin action failed." });
  }
}
