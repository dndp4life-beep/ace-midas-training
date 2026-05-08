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
      action_type: log.action_type,
      summary: log.summary,
      status: log.status || "completed",
      approval_required: log.approval_required === true,
      metadata: log.metadata || {}
    })
    .select("id, agent_key, agent_name, action_type, summary, status, approval_required, metadata, created_at")
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
  const [organisationsResult, membersResult, recordsResult, evidenceResult, remindersResult, reminderLogsResult, agentLogsResult, prospectsResult] = await Promise.all([
    supabase.from("organisations").select("id, name, contact_name, contact_email, phone, created_at").order("name", { ascending: true }),
    supabase.from("members").select("id, organisation_id, full_name, email, role, created_at").order("full_name", { ascending: true }),
    supabase.from("training_records").select("id, member_id, course_id, date_completed, expiry_date, status, created_at").order("expiry_date", { ascending: true }),
    supabase.from("training_evidence").select("id, organisation_id, member_id, training_record_id, file_name, file_path, file_type, uploaded_by, uploaded_at").order("uploaded_at", { ascending: false }),
    supabase.from("notification_queue").select("id, organisation_id, member_id, training_record_id, type, status, scheduled_for, sent_at, error_message, created_at").order("created_at", { ascending: false }),
    supabase.from("notification_logs").select("id, organisation_id, member_id, training_record_id, type, recipient_email, status, provider_response, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("agent_activity_logs").select("id, agent_key, agent_name, action_type, summary, status, approval_required, metadata, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("prospects").select("id, organisation_name, website, location, sector, likely_training_need, contact_email, phone, decision_maker_name, source_url, notes, priority, relevance_reason, review_status, created_by_agent, created_at, updated_at").order("created_at", { ascending: false }).limit(100)
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
    counts: {
      organisations: organisationsResult.data?.length || 0,
      members: membersResult.data?.length || 0,
      courses: courses.length,
      records: recordsResult.data?.length || 0,
      evidence: evidenceResult.error ? 0 : evidenceResult.data?.length || 0,
      reminders: remindersResult.error ? 0 : remindersResult.data?.length || 0,
      reminderLogs: reminderLogsResult.error ? 0 : reminderLogsResult.data?.length || 0,
      agentLogs: agentLogsResult.error ? 0 : agentLogsResult.data?.length || 0,
      prospects: prospectsResult.error ? 0 : prospectsResult.data?.length || 0
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

async function saveProspect(supabase, payload) {
  const prospect = payload?.prospect || {};
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
    agent_name: "Rory",
    action_type: prospect.id ? "prospect_updated" : "prospect_added",
    summary: `Rory added ${data.organisation_name} to the prospect review list.`,
    status: "pending_review",
    approval_required: true,
    metadata: { prospect_id: data.id, priority: data.priority, sector: data.sector, source_url: data.source_url }
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, prospect: data, prospects: compliance.prospects, agentLogs: compliance.agentLogs };
}

async function updateProspectStatus(supabase, payload) {
  const id = String(payload?.id || "");
  const reviewStatus = normaliseProspectReviewStatus(payload?.review_status);
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
    agent_name: "Rory",
    action_type: `prospect_${reviewStatus}`,
    summary: `Rory prospect ${data.organisation_name} was marked ${reviewStatus.replace("_", " ")}.`,
    status: reviewStatus,
    approval_required: reviewStatus === "pending_review",
    metadata: { prospect_id: data.id, priority: data.priority, sector: data.sector }
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, prospect: data, prospects: compliance.prospects, agentLogs: compliance.agentLogs };
}

async function runAvaMiaWorkflow(supabase) {
  const { organisations, members, courses, records, agentLogs } = await getTrainingCompliance(supabase);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = todayIsoDate();
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const organisationMap = new Map(organisations.map((org) => [org.id, org]));
  const courseMap = new Map(courses.map((course) => [course.id, course]));
  const sentTodayKeys = new Set((agentLogs || [])
    .filter((log) => log.action_type === "mia_refresher_sent" && String(log.created_at || "").startsWith(todayKey))
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
    agent_name: "Ava",
    action_type: "compliance_scan",
    summary: `Ava detected ${expiringRecords.length} training record(s) expiring within 30 days.`,
    status: "completed",
    approval_required: false,
    metadata: { expiring_within_30_days: expiringRecords.length }
  });

  let sent = 0;
  let skipped = 0;
  const logs = [avaLog];
  for (const record of expiringRecords) {
    if (sentTodayKeys.has(record.id)) {
      skipped += 1;
      continue;
    }
    const member = memberMap.get(record.member_id);
    if (!member?.email) {
      skipped += 1;
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
        <p>Please contact ACE MiDAS Training if refresher training is required.</p>
        <p>This reminder does not confirm dates, availability, pricing or bookings.</p>
        <p>Kind regards,<br />ACE MiDAS Training</p>
      </div>
    `;
    const providerResponse = await sendAgentEmail({ to: member.email, subject, html });
    const miaLog = await insertAgentLog(supabase, {
      agent_key: "mia",
      agent_name: "Mia",
      action_type: "mia_refresher_sent",
      summary: `Mia sent a standard refresher reminder to ${member.email}.`,
      status: "completed",
      approval_required: false,
      metadata: { training_record_id: record.id, member_id: member.id, organisation_id: member.organisation_id, course_id: record.course_id, provider_response: providerResponse }
    });
    logs.push(miaLog);
    sent += 1;
  }

  const theoLog = await insertAgentLog(supabase, {
    agent_key: "theo",
    agent_name: "Theo",
    action_type: "booking_approval_guard",
    summary: "Theo kept booking/date/payment decisions routed to human approval.",
    status: "pending_approval",
    approval_required: true,
    metadata: { guarded_actions: ["dates", "availability", "booking changes", "cancellations", "custom prices", "custom Stripe payment links"] }
  });
  logs.push(theoLog);
  return { success: true, scanned: expiringRecords.length, remindersSent: sent, skipped, logs };
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
