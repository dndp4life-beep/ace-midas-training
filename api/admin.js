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
const contentAssetBucket = "content-assets";
const allowedEvidenceTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const allowedContentImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const contentDraftSelect = "id, agent_name, content_type, platform, target_audience, title, content, suggested_visual, call_to_action, hashtags, tone, status, topic, image_prompt, visual_style, image_status, image_path, image_file_name, created_at, used_at";
const emailSender = process.env.EMAIL_FROM || "ACE MiDAS Training <onboarding@resend.dev>";
const adminSummaryRecipient = process.env.ADMIN_EMAIL || process.env.NOTIFICATION_EMAIL || "info@ace-midas-training.co.uk";
const siteUrl = process.env.SITE_URL || "https://www.ace-midas-training.co.uk";
const emailLogoUrl = process.env.EMAIL_LOGO_URL || `${siteUrl}/images/logohorizontal.jpg`;
const theoTrainingPageUrl = "https://www.ace-midas-training.co.uk/training";
const theoCompliancePageUrl = "https://www.ace-midas-training.co.uk/compliance";
const theoBookingKnowledge = {
  identity: {
    name: "Theo",
    role: "Training Bookings & Sales Coordinator",
    tone: "Enthusiastic, professional, helpful, confident, business-minded and non-pushy",
    signature: "Theo<br />Training Bookings & Sales Coordinator<br />ACE MiDAS Training"
  },
  booking_process: [
    "Customer sends course type, attendee count, organisation details, training location and preferred timeframe.",
    "Theo qualifies the enquiry and explains the safest next step.",
    "ACE MiDAS Training checks suitability, location requirements and trainer availability.",
    "Final dates, availability, payment links and booking confirmation are only issued after admin approval."
  ],
  information_needed: ["organisation name", "contact name/email", "course required", "number of attendees", "location", "preferred timeframe", "refresher or full training", "urgent expiry deadline"],
  course_categories: ["MiDAS Standard", "MiDAS Accessible", "PATS Standard", "PATS Accessible", "First Aid at Work", "Children's Transport First Aid"],
  group_booking_explanation: "Group bookings can be useful when several staff need the same training or refresher route. Theo may explain configured website group value and discounts, but cannot invent custom discounts.",
  onsite_training_explanation: "Onsite training may be possible depending on course type, attendee numbers, suitable facilities, location and trainer availability.",
  training_page_url: theoTrainingPageUrl,
  compliance_page_url: theoCompliancePageUrl,
  value_points: ["clear booking process", "training compliance support", "refresher planning", "certificate record awareness", "group training coordination", "helpful next-step guidance"]
};
const theoPricingRules = [
  { title: "MiDAS Standard", price: "£165", aliases: ["midas standard", "midas"] },
  { title: "MiDAS Accessible", price: "£210", aliases: ["midas accessible", "accessible midas"] },
  { title: "PATS Standard", price: "£125", aliases: ["pats standard", "pats"] },
  { title: "PATS Accessible", price: "£155-£185", aliases: ["pats accessible", "accessible pats"] },
  { title: "First Aid at Work", price: "£205-£225", aliases: ["first aid at work", "faw"] },
  { title: "Children's Transport First Aid", price: "£95-£135", aliases: ["children's transport first aid", "childrens transport first aid", "ctfa"] }
];
const theoGroupDiscountRules = [
  { minimum_attendees: 9, discount_percent: 20, label: "configured website group discount for larger groups" },
  { minimum_attendees: 4, discount_percent: 10, label: "configured website group discount" }
];
const niaPlatforms = ["LinkedIn", "Facebook", "Instagram", "TikTok/Reels", "Short video", "Carousel"];
const niaContentTypes = ["Awareness post", "Promotional post", "Compliance reminder post", "Website traffic post", "CTA-focused post", "TikTok/Reels script", "Short video script", "Carousel post", "Weekly content plan"];
const niaTopics = ["PATS training", "MiDAS training", "First Aid training", "refresher training", "training expiry awareness", "certificate record keeping", "compliance support", "group training", "schools", "councils", "SEND transport", "passenger assistants", "minibus drivers", "charities", "community transport providers", "training managers"];
const niaAudiences = ["schools", "academy trusts", "councils", "SEND transport providers", "charities", "care providers", "community transport providers", "training managers", "passenger assistants", "minibus drivers"];
const niaDefaultCta = "Visit the training page or contact ACE MiDAS Training to discuss training support.";
const prospectSelect = "id, organisation_name, website, location, region, sector, likely_training_need, recommended_service, contact_email, phone, decision_maker_name, source_url, notes, outreach_brief, priority, score, relevance_reason, review_status, status, do_not_contact, researched_by, assigned_to, first_contact_sent_at, follow_up_1_scheduled_for, follow_up_2_scheduled_for, last_contacted_at, created_by_agent, created_at, updated_at";
const followUpTaskSelect = "id, prospect_id, agent_name, task_type, status, scheduled_for, completed_at, notes, created_at";
const roryResearchRunSelect = "id, run_type, status, search_theme, provider, provider_task_id, provider_task_url, prospects_found, prospects_saved, duplicates_skipped, errors, started_at, completed_at";
const flexibleSelect = "*";
const recommendedServices = ["First Aid", "PATS", "MiDAS", "Refresher Training", "Compliance Tracking Support", "Mixed Opportunity"];
const rorySearchThemes = ["First Aid training prospects", "PATS training prospects", "MiDAS training prospects", "refresher training prospects", "schools/trusts", "charities/community organisations", "care providers", "hospitality/businesses"];
const manusTaskCreateEndpoint = process.env.MANUS_TASK_CREATE_URL || "https://api.manus.ai/v2/task.create";
const manusListMessagesEndpoint = process.env.MANUS_LIST_MESSAGES_URL || "https://api.manus.ai/v2/task.listMessages";
const manusConnectorIds = String(process.env.MANUS_CONNECTOR_IDS || "be268223-40b2-4f3c-a907-c12eb1699283")
  .split(",")
  .map((connector) => connector.trim())
  .filter(Boolean);
const miaOutreachAutosendEnabled = String(process.env.MIA_OUTREACH_AUTOSEND || "").toLowerCase() === "true";
const agentIdentities = {
  ava: { name: "Ava", title: "Compliance Agent", tone: "Clear, concise, operational and risk-focused", signature: "Ava<br />Compliance Agent<br />ACE MiDAS Training" },
  mia: { name: "Mia", title: "Outreach Coordinator", tone: "Helpful, clear and professional", signature: "Mia<br />Outreach Coordinator<br />ACE MiDAS Training" },
  theo: { name: "Theo", title: "Training Bookings & Sales Coordinator", tone: theoBookingKnowledge.identity.tone, signature: theoBookingKnowledge.identity.signature },
  nia: { name: "Nia", title: "Content & Engagement", tone: "Warm, practical and brand-aware", signature: "Nia<br />Content & Engagement<br />ACE MiDAS Training" },
  ellis: { name: "Ellis", title: "Inbox Management", tone: "Concise, organised and selective", signature: "Ellis<br />Inbox Management<br />ACE MiDAS Training" },
  rory: { name: "Rory", title: "Research & Partnerships", tone: "Curious, careful and public-data only", signature: "Rory<br />Research & Partnerships<br />ACE MiDAS Training" }
};

function getAgentIdentity(key) {
  return agentIdentities[key] || { name: "ACE Agent", title: "Operations", tone: "Professional", signature: "ACE MiDAS Training" };
}

function sentenceCase(value, fallback = "") {
  const text = String(value || fallback || "").trim();
  if (!text) return "";
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function cleanListValue(value, allowed, fallback) {
  const text = String(value || "").trim();
  return allowed.includes(text) ? text : fallback;
}

function safeFileName(name) {
  return String(name || "evidence")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "evidence";
}

function safeErrorMessage(value, fallback = "Request failed.") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || fallback;
  if (typeof value === "object") {
    if (typeof value.message === "string") return value.message;
    if (typeof value.error === "string") return value.error;
    if (typeof value.detail === "string") return value.detail;
    if (typeof value.code === "string") return `${value.code}${value.type ? `: ${value.type}` : ""}`;
    try {
      return JSON.stringify(value).slice(0, 1000);
    } catch {
      return fallback;
    }
  }
  return String(value);
}

async function ensureContentAssetBucket(supabase) {
  const { data, error } = await supabase.storage.getBucket(contentAssetBucket);
  if (!error && data) return;
  const { error: createError } = await supabase.storage.createBucket(contentAssetBucket, {
    public: false,
    fileSizeLimit: 10485760,
    allowedMimeTypes: [...allowedContentImageTypes]
  });
  if (createError && !String(createError.message || "").toLowerCase().includes("already exists")) throw createError;
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
  const [organisationsResult, membersResult, recordsResult, evidenceResult, remindersResult, reminderLogsResult, agentLogsResult, prospectsResult, followUpsResult, roryRunsResult, repliesResult, inboundResult, contentDraftsResult] = await Promise.all([
    supabase.from("organisations").select("id, name, contact_name, contact_email, phone, created_at").order("name", { ascending: true }),
    supabase.from("members").select("id, organisation_id, full_name, email, role, created_at").order("full_name", { ascending: true }),
    supabase.from("training_records").select("id, member_id, course_id, date_completed, expiry_date, status, created_at").order("expiry_date", { ascending: true }),
    supabase.from("training_evidence").select("id, organisation_id, member_id, training_record_id, file_name, file_path, file_type, uploaded_by, uploaded_at").order("uploaded_at", { ascending: false }),
    supabase.from("notification_queue").select("id, organisation_id, member_id, training_record_id, type, status, scheduled_for, sent_at, error_message, created_at").order("created_at", { ascending: false }),
    supabase.from("notification_logs").select("id, organisation_id, member_id, training_record_id, type, recipient_email, status, provider_response, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("agent_activity_logs").select("id, agent_key, agent_name, agent_role, action_type, action_label, organisation_id, member_id, training_record_id, summary, status, approval_required, metadata, created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("prospects").select(flexibleSelect).order("created_at", { ascending: false }).limit(500),
    supabase.from("follow_up_tasks").select(flexibleSelect).order("scheduled_for", { ascending: true }).limit(500),
    supabase.from("rory_research_runs").select(flexibleSelect).order("started_at", { ascending: false }).limit(100),
    supabase.from("reply_intake").select("id, organisation_id, member_id, training_record_id, contact_name, contact_email, message, classification, requested_action, assigned_agent, approval_required, approval_status, requested_course, attendees, location, preferred_dates, urgency, approved_dates, approved_availability_wording, approved_price_payment_instruction, theo_notes, draft_response, notes, created_at, updated_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("inbound_messages").select("id, source, from_name, from_email, organisation, subject, message_body, classification, assigned_agent, status, action_taken, approval_required, created_at, updated_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("content_drafts").select(contentDraftSelect).order("created_at", { ascending: false }).limit(100)
  ]);
  const error = organisationsResult.error || membersResult.error || recordsResult.error;
  if (error) throw error;
  if (prospectsResult.error) console.error("Prospects load error:", prospectsResult.error);
  if (followUpsResult.error) console.error("Follow-up tasks load error:", followUpsResult.error);
  if (roryRunsResult.error) console.error("Rory research runs load error:", roryRunsResult.error);
  const contentDrafts = contentDraftsResult.error ? [] : await Promise.all((contentDraftsResult.data || []).map(async (draft) => {
    if (!draft.image_path) return { ...draft, image_url: "" };
    const { data } = await supabase.storage.from(contentAssetBucket).createSignedUrl(draft.image_path, 3600);
    return { ...draft, image_url: data?.signedUrl || "" };
  }));
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
    followUps: followUpsResult.error ? [] : followUpsResult.data || [],
    roryRuns: roryRunsResult.error ? [] : roryRunsResult.data || [],
    replies: repliesResult.error ? [] : repliesResult.data || [],
    inboundMessages: inboundResult.error ? [] : inboundResult.data || [],
    contentDrafts,
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
      followUps: followUpsResult.error ? 0 : followUpsResult.data?.length || 0,
      roryRuns: roryRunsResult.error ? 0 : roryRunsResult.data?.length || 0,
      replies: repliesResult.error ? 0 : repliesResult.data?.length || 0,
      inboundMessages: inboundResult.error ? 0 : inboundResult.data?.length || 0,
      contentDrafts: contentDraftsResult.error ? 0 : contentDraftsResult.data?.length || 0
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

function normaliseProspectStatus(status) {
  const value = String(status || "new").toLowerCase().replace(/\s+/g, "_");
  return ["new", "pending_review", "approved", "rejected", "ready_for_outreach", "pending_outreach", "pending_outreach_approval", "contacted", "follow_up_scheduled", "do_not_contact"].includes(value) ? value : "new";
}

function normaliseRecommendedService(service, prospect = {}) {
  const requested = String(service || "").trim();
  const matched = recommendedServices.find((item) => item.toLowerCase() === requested.toLowerCase());
  if (matched) return matched;
  const text = `${prospect.sector || ""} ${prospect.likely_training_need || ""} ${prospect.notes || ""}`.toLowerCase();
  if (text.includes("first aid") || text.includes("nursery") || text.includes("childcare") || text.includes("gym") || text.includes("sports") || text.includes("warehouse") || text.includes("construction") || text.includes("hospitality") || text.includes("hotel") || text.includes("restaurant") || text.includes("security")) return "First Aid";
  if (text.includes("passenger assistant") || text.includes("pats") || text.includes("send")) return "PATS";
  if (text.includes("minibus") || text.includes("midas") || text.includes("driver")) return "MiDAS";
  if (text.includes("expiry") || text.includes("expired") || text.includes("renewal") || text.includes("refresher")) return "Refresher Training";
  if (text.includes("compliance") || text.includes("tracking") || text.includes("records")) return "Compliance Tracking Support";
  return "First Aid";
}

function scoreProspect(prospect = {}) {
  const text = `${prospect.organisation_name || ""} ${prospect.sector || ""} ${prospect.likely_training_need || ""} ${prospect.notes || ""} ${prospect.contact_email || ""} ${prospect.website || ""}`.toLowerCase();
  const highSignals = ["local authority", "council", "academy trust", "send", "special school", "community transport", "care provider", "supported living", "minibus", "training manager", "compliance manager", "health and safety"];
  const mediumSignals = ["school", "charity", "nursery", "childcare", "sports club", "gym", "warehouse", "construction", "security", "facilities", "hotel", "restaurant", "office"];
  const highMatches = highSignals.filter((word) => text.includes(word));
  const mediumMatches = mediumSignals.filter((word) => text.includes(word));
  const recommended_service = normaliseRecommendedService(prospect.recommended_service, prospect);
  const priority = highMatches.length ? "high" : mediumMatches.length ? "medium" : normaliseProspectPriority(prospect.priority || "medium");
  const sourceQuality = [prospect.website, prospect.source_url, prospect.contact_email, prospect.phone, prospect.location].filter(Boolean).length;
  const serviceFit = recommended_service === "Mixed Opportunity" ? 24 : highMatches.length ? 30 : mediumMatches.length ? 20 : 12;
  const emailScore = prospect.contact_email ? (/(^|[^\w])(info|enquiries|admin|office|training|hr|hello|contact)@/i.test(prospect.contact_email) ? 18 : 10) : 0;
  const calculatedScore = Math.min(100, serviceFit + emailScore + Math.min(20, sourceQuality * 4) + (highMatches.length * 8) + (mediumMatches.length * 4));
  const importedScore = Number.isFinite(Number(prospect.score)) ? Math.max(0, Math.min(100, Number(prospect.score))) : 0;
  const score = Math.max(calculatedScore, importedScore);
  const relevance_reason = highMatches.length
    ? `High relevance because ${highMatches.slice(0, 3).join(", ")} signals match ACE MiDAS Training's transport, safeguarding or compliance audience.`
    : mediumMatches.length
      ? `Relevant because ${mediumMatches.slice(0, 3).join(", ")} suggests an organisation likely to need staff training, refresher planning or First Aid support.`
      : "Relevant for review because the organisation may have staff training, refresher or compliance support needs.";
  const scoring_basis = `Score uses service fit (${serviceFit}), public contact email (${emailScore}), source completeness (${Math.min(20, sourceQuality * 4)}), high-fit signals (${highMatches.length}) and medium-fit signals (${mediumMatches.length}).${importedScore > calculatedScore ? ` Rory kept the imported research score of ${importedScore}/100 because it was higher than the local calculated score of ${calculatedScore}/100.` : ` Local calculated score: ${calculatedScore}/100.`}`;
  return { priority, recommended_service, relevance_reason, score, scoring_basis, calculated_score: calculatedScore };
}

function buildOutreachBrief(prospect = {}) {
  const service = normaliseRecommendedService(prospect.recommended_service, prospect);
  const sector = String(prospect.sector || "organisation").trim();
  const need = String(prospect.likely_training_need || service).trim();
  return `Lead with ${service} for this ${sector}. Likely need: ${need}. Keep the message warm, concise and sector-aware. Mention ACE MiDAS Training can support training and refresher planning, and include the opt-out line.`;
}

function addDaysIso(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function prospectNextFollowUp(prospect = {}) {
  return prospect.follow_up_1_scheduled_for || prospect.follow_up_2_scheduled_for || null;
}

function normaliseDomain(value = "") {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  try {
    const url = text.startsWith("http") ? new URL(text) : new URL(`https://${text}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return text.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function normaliseComparable(value = "") {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9@.]+/g, " ").replace(/\s+/g, " ").trim();
}

function prospectDuplicateMatch(candidate = {}, existing = []) {
  const candidateDomain = normaliseDomain(candidate.website || candidate.source_url);
  const candidateName = normaliseComparable(candidate.organisation_name);
  const candidateEmail = normaliseComparable(candidate.contact_email);
  return existing.find((prospect) => {
    if (candidateEmail && normaliseComparable(prospect.contact_email) === candidateEmail) return true;
    if (candidateDomain && [prospect.website, prospect.source_url].some((item) => normaliseDomain(item) === candidateDomain)) return true;
    return candidateName && normaliseComparable(prospect.organisation_name) === candidateName;
  });
}

function prospectDuplicateReason(candidate = {}, matched = {}) {
  if (candidate.contact_email && matched.contact_email && normaliseComparable(candidate.contact_email) === normaliseComparable(matched.contact_email)) return "public email matched";
  const candidateDomain = normaliseDomain(candidate.website || candidate.source_url);
  if (candidateDomain && [matched.website, matched.source_url].some((item) => normaliseDomain(item) === candidateDomain)) return "website/domain matched";
  if (candidate.organisation_name && matched.organisation_name && normaliseComparable(candidate.organisation_name) === normaliseComparable(matched.organisation_name)) return "organisation name matched";
  return "similar prospect already exists";
}

function normaliseProspectCandidate(candidate = {}, searchTheme = "") {
  const scored = scoreProspect({ ...candidate, likely_training_need: candidate.likely_training_need || searchTheme });
  const row = {
    organisation_name: String(candidate.organisation_name || candidate.organization_name || candidate.organisation || candidate.organization || candidate.company_name || candidate.company || candidate.business_name || candidate.business || candidate.name || "").trim(),
    sector: String(candidate.sector || "").trim(),
    website: String(candidate.website || candidate.url || candidate.site || "").trim(),
    location: String(candidate.location || "").trim(),
    region: String(candidate.region || "").trim(),
    contact_email: String(candidate.contact_email || candidate.public_email || candidate.email || candidate.contact || "").trim(),
    phone: String(candidate.phone || candidate.telephone || candidate.contact_number || "").trim(),
    decision_maker_name: String(candidate.decision_maker_name || candidate.decision_maker || "").trim(),
    likely_training_need: String(candidate.likely_training_need || candidate.training_need || candidate.need || searchTheme).trim(),
    recommended_service: normaliseRecommendedService(candidate.recommended_service || candidate.service || candidate.recommended_training || scored.recommended_service, candidate),
    priority: normaliseProspectPriority(candidate.priority || scored.priority),
    score: Number.isFinite(Number(candidate.score)) ? Math.max(0, Math.min(100, Number(candidate.score))) : scored.score,
    source_url: String(candidate.source_url || candidate.source || candidate.source_link || candidate.website || candidate.url || "").trim(),
    notes: String(candidate.notes || "").trim(),
    relevance_reason: String(candidate.relevance_reason || candidate.reason || candidate.why_relevant || scored.relevance_reason || "").trim(),
    status: "new",
    review_status: "pending_review",
    do_not_contact: false,
    researched_by: "Rory",
    created_by_agent: "rory",
    updated_at: new Date().toISOString()
  };
  row.outreach_brief = String(candidate.outreach_brief || candidate.mia_brief || candidate.outreach_angle || buildOutreachBrief(row)).trim();
  return row;
}

async function insertProspectWithFallback(supabase, row) {
  const { data, error } = await supabase.from("prospects").insert(row).select(flexibleSelect).single();
  if (!error) return { data, error: null };
  console.error("Prospect insert error, retrying with core fields:", error);
  const coreRow = {
    organisation_name: row.organisation_name,
    website: row.website || null,
    location: row.location || null,
    sector: row.sector || null,
    likely_training_need: row.likely_training_need || null,
    contact_email: row.contact_email || null,
    phone: row.phone || null,
    decision_maker_name: row.decision_maker_name || null,
    source_url: row.source_url || row.website,
    notes: row.notes || row.relevance_reason || null,
    priority: row.priority || "medium",
    relevance_reason: row.relevance_reason || null,
    review_status: row.review_status || "pending_review",
    created_by_agent: row.created_by_agent || "rory"
  };
  const retry = await supabase.from("prospects").insert(coreRow).select(flexibleSelect).single();
  return retry.error ? { data: null, error: retry.error } : { data: retry.data, error: null };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRoryProspectSchema() {
  const nullableString = { type: ["string", "null"] };
  return {
    type: "object",
    properties: {
      prospects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            organisation_name: { type: "string" },
            sector: { type: "string" },
            website: nullableString,
            location: nullableString,
            region: nullableString,
            contact_email: nullableString,
            phone: nullableString,
            decision_maker_name: nullableString,
            likely_training_need: { type: "string" },
            recommended_service: { type: "string" },
            priority: { type: "string", enum: ["high", "medium", "low"] },
            score: { type: "number" },
            source_url: { type: "string" },
            notes: { type: "string" },
            outreach_brief: { type: "string" }
          },
          required: ["organisation_name", "sector", "website", "location", "region", "contact_email", "phone", "decision_maker_name", "likely_training_need", "recommended_service", "priority", "score", "source_url", "notes", "outreach_brief"],
          additionalProperties: false
        }
      }
    },
    required: ["prospects"],
    additionalProperties: false
  };
}

function extractStructuredProspects(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload.prospects)) return payload.prospects;
  const directValue = payload.structured_output_result?.value || payload.structured_output?.value;
  if (Array.isArray(directValue?.prospects)) return directValue.prospects;
  const taskDetailValue = payload.task_detail?.structured_output?.value;
  if (Array.isArray(taskDetailValue?.prospects)) return taskDetailValue.prospects;
  const messages = Array.isArray(payload.messages) ? payload.messages : Array.isArray(payload.data) ? payload.data : Array.isArray(payload.items) ? payload.items : [];
  for (const message of [...messages].reverse()) {
    const value = message?.structured_output_result?.value || message?.structured_output?.value;
    if (Array.isArray(value?.prospects)) return value.prospects;
    if (message?.type === "structured_output_result" && Array.isArray(message?.structured_output_result?.value?.prospects)) return message.structured_output_result.value.prospects;
  }
  return null;
}

async function pollManusProspectResult(taskId, attempts = 6) {
  let lastPayload = null;
  for (let index = 0; index < attempts; index += 1) {
    if (index > 0) await wait(2500);
    const separator = manusListMessagesEndpoint.includes("?") ? "&" : "?";
    const response = await fetch(`${manusListMessagesEndpoint}${separator}task_id=${encodeURIComponent(taskId)}&order=asc`, {
      method: "GET",
      headers: { "x-manus-api-key": process.env.MANUS_API_KEY }
    });
    const text = await response.text();
    try {
      lastPayload = text ? JSON.parse(text) : {};
    } catch {
      lastPayload = { error: "Manus returned non-JSON task messages.", raw: text.slice(0, 500) };
    }
    if (!response.ok) throw new Error(safeErrorMessage(lastPayload?.error || lastPayload?.message || lastPayload, `Manus task messages returned HTTP ${response.status}`));
    const prospects = extractStructuredProspects(lastPayload);
    if (Array.isArray(prospects)) return { status: "completed", prospects, payload: lastPayload };
  }
  return { status: "waiting_for_result", prospects: null, payload: lastPayload };
}

async function saveRoryProspectCandidates(supabase, { run, candidates, searchTheme, rory }) {
  const { data: existingProspects } = await supabase.from("prospects").select(flexibleSelect);
  const existing = existingProspects || [];
  let prospectsSaved = 0;
  let duplicatesSkipped = 0;
  const savedProspects = [];
  const duplicateDetails = [];

  for (const candidate of candidates) {
    const row = normaliseProspectCandidate(candidate, searchTheme);
    if (!row.organisation_name || (!row.source_url && !row.website)) continue;
    const duplicateMatch = prospectDuplicateMatch(row, [...existing, ...savedProspects]);
    if (duplicateMatch) {
      duplicatesSkipped += 1;
      duplicateDetails.push({
        organisation_name: row.organisation_name,
        website: row.website || row.source_url || "",
        contact_email: row.contact_email || "",
        matched_organisation: duplicateMatch.organisation_name || "",
        matched_id: duplicateMatch.id || "",
        reason: prospectDuplicateReason(row, duplicateMatch)
      });
      await insertAgentLog(supabase, {
        agent_key: "rory",
        agent_name: rory.name,
        agent_role: rory.title,
        action_type: "rory_duplicate_skipped",
        action_label: "Duplicate prospect skipped",
        summary: `${rory.name} skipped duplicate prospect ${row.organisation_name}.`,
        status: "duplicate_skipped",
        approval_required: false,
        metadata: { run_id: run.id, organisation_name: row.organisation_name, website: row.website, contact_email: row.contact_email, matched_prospect_id: duplicateMatch.id, matched_organisation: duplicateMatch.organisation_name, reason: prospectDuplicateReason(row, duplicateMatch) }
      });
      continue;
    }
    const { data: saved, error: saveError } = await insertProspectWithFallback(supabase, row);
    if (saveError) {
      console.error("Prospect import save error:", saveError);
      duplicatesSkipped += 1;
      continue;
    }
    prospectsSaved += 1;
    savedProspects.push(saved);
    await insertAgentLog(supabase, {
      agent_key: "rory",
      agent_name: rory.name,
      agent_role: rory.title,
      action_type: "rory_prospect_saved",
      action_label: "Prospect saved from research",
      summary: `${rory.name} saved ${saved.organisation_name} from a ${searchTheme} research run.`,
      status: "saved",
      approval_required: true,
      metadata: { run_id: run.id, prospect_id: saved.id, priority: saved.priority, score: saved.score, recommended_service: saved.recommended_service }
    });
  }

  return { prospectsSaved, duplicatesSkipped, duplicateDetails };
}

function buildMiaProspectOutreachEmail(prospect = {}) {
  const mia = getAgentIdentity("mia");
  const organisation = sentenceCase(prospect.organisation_name, "your organisation");
  const sector = String(prospect.sector || "organisation").toLowerCase();
  const service = normaliseRecommendedService(prospect.recommended_service, prospect);
  const isFirstAid = service === "First Aid";
  const isCompliance = service === "Compliance Tracking Support";
  const isPats = service === "PATS";
  const isMidas = service === "MiDAS";
  const seed = String(prospect.id || prospect.organisation_name || "").split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const pick = (items, offset = 0) => items[(seed + offset) % items.length];
  const opening = isFirstAid
    ? pick([
      "First Aid training is one of those things that is easiest to manage before it becomes urgent through staff changes, certificate renewals or workplace checks.",
      "A quick introduction from ACE MiDAS Training, because First Aid cover and refresher planning can become important very quickly when teams grow or certificates approach renewal.",
      "I wanted to introduce ACE MiDAS Training in case First Aid training or refresher planning becomes useful for your team."
    ], 1)
    : isCompliance
      ? pick([
        "Training records, refresher dates and certificate evidence can look manageable until something is missed. A clearer compliance process helps teams stay ready rather than reactive.",
        "A short introduction from ACE MiDAS Training, because organised training records and refresher planning can reduce pressure when evidence is needed.",
        "I wanted to introduce ACE MiDAS Training in case your team ever needs a clearer way to keep training, refresher dates and certificate evidence organised."
      ], 1)
      : isPats
        ? pick([
          "PATS training is often only considered when a contract, inspection, renewal date or incident brings passenger support into focus. It is easier to have that safeguard in place before it becomes urgent.",
          "I wanted to introduce ACE MiDAS Training because PATS training can support staff who assist passengers, children, young people or vulnerable service users.",
          "A quick introduction from ACE MiDAS Training, in case passenger assistant training or refresher planning becomes relevant for your team."
        ], 1)
        : isMidas
          ? pick([
            "MiDAS training can be easy to treat as an admin requirement, but for organisations using minibuses it supports safer, more confident and better evidenced passenger transport.",
            "I wanted to introduce ACE MiDAS Training in case MiDAS or refresher training becomes useful for your drivers or passenger transport team.",
            "A short introduction from ACE MiDAS Training, because minibus driver training is easier to plan before renewal dates become urgent."
          ], 1)
          : pick([
            "Staff training and refresher planning can feel optional until a renewal, inspection, contract or incident makes it urgent. Staying ahead gives organisations a stronger position.",
            "I wanted to introduce ACE MiDAS Training in case staff training, refresher planning or training compliance becomes useful for your organisation.",
            "A quick introduction from ACE MiDAS Training, because planned training is usually easier than reacting when records suddenly need attention."
          ], 1);
  const sectorLine = sector && sector !== "other"
    ? pick([
      `I thought this may be relevant for ${organisation} as a ${sector} where staff confidence, training records or refresher planning may matter.`,
      `${organisation} stood out as a ${sector}, so I thought it would be useful simply to make you aware of the training support available.`,
      `For a ${sector} such as ${organisation}, having access to practical training support can be helpful before renewal dates or compliance checks become pressing.`
    ], 3)
    : pick([
      `I thought this may be relevant for ${organisation} if staff training or refresher planning ever comes onto your agenda.`,
      `${organisation} stood out as an organisation that may benefit from knowing ACE MiDAS Training is available.`,
      `This is simply to make ${organisation} aware of the training support available if it becomes useful.`
    ], 3);
  const serviceLine = isFirstAid
    ? "ACE MiDAS Training provides First Aid training and refresher planning for staff teams in a practical, professional way."
    : isCompliance
      ? "ACE MiDAS Training supports training compliance tracking, refresher planning and certificate record keeping alongside practical training services."
      : "ACE MiDAS Training provides PATS, MiDAS, First Aid and refresher training for teams who need to stay current, confident and ready.";
  const groupDiscountLine = pick([
    "For larger teams, group booking discounts may also be available, which can help organisations train several people together in a more practical way.",
    "Where several staff need support, larger group bookings may qualify for a discount and can make training easier to plan around the organisation.",
    "If training becomes relevant for a wider team, ACE MiDAS Training can also support larger group bookings with available group discounts."
  ], 5);
  const siteLine = pick([
    "You can look through the website here:",
    "The website has more detail on the training and support available:",
    "If you would like to see the current training options, the website is here:"
  ], 7);
  const awarenessLine = pick([
    "This is simply a short introduction so you know ACE MiDAS Training is available if your organisation ever needs support with staff training, refresher planning or training compliance.",
    "No action is needed from you now. This is just to make you aware that ACE MiDAS Training is available if the training need arises.",
    "I am sharing this as a useful reference, so your team knows where to look if training or refresher planning becomes relevant."
  ], 9);
  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;max-width:640px">
      <div style="margin-bottom:20px">
        <img src="${emailLogoUrl}" alt="ACE MiDAS Training" width="220" style="display:block;max-width:220px;height:auto;background:#ffffff" />
      </div>
      <p>Hello,</p>
      <p>${opening}</p>
      <p>${sectorLine}</p>
      <p>${serviceLine}</p>
      <p>${groupDiscountLine}</p>
      <p>${awarenessLine}</p>
      <p>${siteLine}<br /><a href="${siteUrl}" style="color:#047857;font-weight:700">${siteUrl}</a></p>
      <p>Kind regards,<br />${mia.signature}</p>
      <p style="font-size:13px;color:#64748b">If this is not relevant, please reply "no thanks" and we will not contact you again.</p>
    </div>
  `;
}

function buildMiaProspectOutreachSubject(prospect = {}) {
  const service = normaliseRecommendedService(prospect.recommended_service, prospect);
  const options = {
    "First Aid": ["First Aid training support", "First Aid training and refresher support", "Staff First Aid training support"],
    "PATS": ["PATS training support", "Passenger assistant training support", "PATS and refresher training support"],
    "MiDAS": ["MiDAS training support", "Minibus driver training support", "MiDAS and refresher training support"],
    "Refresher Training": ["Refresher training support", "Training renewal support", "Staff refresher training support"],
    "Compliance Tracking Support": ["Training compliance support", "Refresher tracking and certificate support", "Training records and compliance support"],
    "Mixed Opportunity": ["Training support from ACE MiDAS Training", "Staff training and refresher support", "ACE MiDAS Training support"]
  };
  const seed = String(prospect.id || prospect.organisation_name || service).split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const choices = options[service] || options["Mixed Opportunity"];
  return choices[seed % choices.length];
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

function matchedKeywords(text, words) {
  return words.filter((word) => text.includes(word));
}

function makeRoute(route, routingReason, matched = []) {
  return { ...route, routing_reason: routingReason, matched_keywords: matched };
}

function classifyInboundMessage(message, subject = "") {
  const text = `${subject} ${message}`.toLowerCase();
  const hasAny = (words) => matchedKeywords(text, words).length > 0;
  const unsubscribeMatches = matchedKeywords(text, ["unsubscribe", "do not contact", "remove me", "opt out"]);
  if (unsubscribeMatches.length) return makeRoute({ classification: "unsubscribe/do not contact", assigned_agent: "ellis", status: "filtered", action_taken: "Do not contact flag identified", approval_required: false }, "Do-not-contact wording matched.", unsubscribeMatches);
  const spamMatches = matchedKeywords(text, ["seo", "backlink", "crypto", "loan", "web design", "marketing agency", "guest post"]);
  if (spamMatches.length) return makeRoute({ classification: "spam/B2B irrelevant", assigned_agent: "ellis", status: "archived", action_taken: "Filtered as low-value B2B/spam", approval_required: false }, "Low-value B2B/spam keyword matched.", spamMatches);
  const serviceMatches = matchedKeywords(text, ["compliance app", "compliance apps", "compliance hub", "monthly fee", "monthly service", "service fee", "subscription", "saas", "safejourney", "safe journey", "medication tracking", "journey tracking", "tracking app", "compliance system", "compliance service", "digital compliance"]);
  if (serviceMatches.length) return makeRoute({ classification: "service enquiry / compliance app enquiry", assigned_agent: "mia", status: "routed", action_taken: "Routed to Mia for compliance app/service information response", approval_required: false }, "Compliance app/service wording matched without a booking commitment.", serviceMatches);
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

function classifyTheoBookingIntent(text) {
  const hasAny = (words) => matchedKeywords(text, words).length > 0;
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

function createTheoDecisionTrace(inboundMessageId, route, overrides = {}) {
  const approvalRequired = route.approval_required === true;
  return {
    inbound_message_id: inboundMessageId,
    classification_result: route.classification,
    assigned_agent: route.assigned_agent,
    approval_required: approvalRequired,
    approval_reason: approvalRequired ? String(route.decision_reason || route.action_taken || "Theo approval is required.") : "",
    theo_auto_reply_allowed: route.assigned_agent === "theo" && !approvalRequired,
    theo_response_draft_generated: false,
    resend_send_attempted: false,
    resend_response_status: null,
    thrown_error: null,
    theo_queue_item_created: false,
    decision_reason: String(route.decision_reason || "Ellis routing rule matched the message content."),
    pricing_estimate_calculated: false,
    training_page_referred: false,
    ...overrides
  };
}

function extractTheoLeadQualification(message, inbound = {}) {
  const text = String(message || "");
  const lower = text.toLowerCase();
  const course = theoBookingKnowledge.course_categories.find((name) => lower.includes(name.toLowerCase())) || "";
  const attendeeMatch = lower.match(/\b(\d{1,3})\s*(people|persons|attendees|delegates|staff|drivers|passenger assistants|pas|learners|candidates)?\b/i);
  const locationMatch = text.match(/\b(?:in|at|near|around)\s+([A-Z][A-Za-z\s]{2,40})(?:[,.]|\s|$)/);
  const timeframeMatches = text.match(/\b(?:asap|urgent|this week|next week|next month|within \d+\s+weeks?|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/gi) || [];
  return {
    organisation_name: String(inbound.organisation || "").trim(),
    contact_name: String(inbound.from_name || inbound.name || "").trim(),
    contact_email: String(inbound.from_email || inbound.email || "").trim(),
    course_required: course,
    attendee_count: attendeeMatch ? Number(attendeeMatch[1]) : null,
    location: locationMatch ? locationMatch[1].trim() : "",
    preferred_timeframe: [...new Set(timeframeMatches)].join(", "),
    training_route: lower.includes("refresher") || lower.includes("renew") ? "refresher" : lower.includes("full training") || lower.includes("new staff") ? "full training" : "",
    urgent_expiry_deadline: lower.includes("expired") || lower.includes("expiry") || lower.includes("urgent") || lower.includes("asap")
  };
}

function calculateTheoEstimate(message) {
  const text = String(message || "").toLowerCase();
  const course = theoPricingRules.find((item) => item.aliases.some((alias) => text.includes(alias)));
  const attendeeMatch = text.match(/\b(\d{1,3})\s*(people|persons|attendees|delegates|staff|drivers|passenger assistants|pas|learners|candidates)?\b/i);
  const attendees = attendeeMatch ? Math.max(1, Number(attendeeMatch[1])) : null;
  if (!course || !attendees) return null;
  const nums = course.price.match(/\d+/g)?.map(Number) || [];
  if (!nums.length) return null;
  const high = Math.max(...nums);
  const low = Math.min(...nums);
  const discountRule = theoGroupDiscountRules.find((rule) => attendees >= rule.minimum_attendees);
  const discountedUnit = discountRule ? Math.round(high * (1 - discountRule.discount_percent / 100)) : high;
  const unit = nums.length > 1 && discountRule?.minimum_attendees >= 9 ? Math.max(low, discountedUnit) : discountedUnit;
  const saving = Math.max(0, (high - unit) * attendees);
  return {
    course_title: course.title,
    attendee_count: attendees,
    listed_price: course.price,
    estimated_unit_price: unit,
    estimated_subtotal: unit * attendees,
    estimated_saving: saving,
    discount_text: saving > 0 ? `${discountRule.label} applied, saving approximately GBP ${saving}.` : "No configured group discount is triggered at this attendee number.",
    caveat: "Indicative estimate only. It excludes travel fees or custom requirements.",
    approved_source: "Configured Theo pricing rules"
  };
}

async function saveInboundMessage(supabase, payload) {
  const inbound = payload?.message || {};
  const subject = String(inbound.subject || inbound.enquiryType || "Website enquiry").trim();
  const body = String(inbound.message_body || inbound.message || "").trim();
  if (!body) throw new Error("Message body is required.");
  const route = classifyInboundMessage(body, subject);
  const identity = getAgentIdentity(route.assigned_agent);
  const row = {
    source: String(inbound.source || "manual").trim(),
    from_name: String(inbound.from_name || inbound.name || "").trim(),
    from_email: String(inbound.from_email || inbound.email || "").trim(),
    organisation: String(inbound.organisation || "").trim(),
    subject,
    message_body: body,
    classification: route.classification,
    assigned_agent: route.assigned_agent,
    status: route.status,
    action_taken: route.action_taken,
    approval_required: route.approval_required,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from("inbound_messages")
    .insert(row)
    .select("id, source, from_name, from_email, organisation, subject, message_body, classification, assigned_agent, status, action_taken, approval_required, created_at, updated_at")
    .single();
  if (error) throw error;
  const estimate = route.assigned_agent === "theo" && !route.approval_required ? calculateTheoEstimate(body) : null;
  const qualification = route.assigned_agent === "theo" ? extractTheoLeadQualification(body, row) : null;
  const responseType = route.assigned_agent === "theo" ? (route.approval_required ? "approval_required" : estimate ? "estimate_response" : data.classification === "pricing enquiry" ? "request_more_information" : "safe_auto_reply") : "routed";
  const theoTrace = route.assigned_agent === "theo" ? createTheoDecisionTrace(data.id, route, { pricing_estimate_calculated: Boolean(estimate), training_page_referred: !route.approval_required, pricing_estimate: estimate, training_page_url: !route.approval_required ? theoTrainingPageUrl : null, lead_qualification: qualification, response_type: responseType, booking_knowledge: theoBookingKnowledge }) : null;
  const metadata = { inbound_message_id: data.id, classification: data.classification, source: data.source, from_email: data.from_email, response_type: responseType, estimate_calculated: Boolean(estimate), training_page_referred: route.assigned_agent === "theo" && !route.approval_required, approval_required: route.approval_required, email_sent: false, lead_qualification: qualification, decision_reason: route.decision_reason || null, routing_reason: route.routing_reason || null, matched_keywords: route.matched_keywords || [], message_snippet: body.slice(0, 240), ...(theoTrace ? { theo_trace: theoTrace } : {}) };
  await insertAgentLog(supabase, {
    agent_key: identity.name === "Ellis" ? "ellis" : route.assigned_agent,
    agent_name: identity.name,
    agent_role: identity.title,
    action_type: route.approval_required ? "inbound_routed_for_approval" : "inbound_routed",
    action_label: data.action_taken,
    summary: `${identity.name} (${identity.title}) classified inbound message as ${data.classification}.`,
    status: data.status,
    approval_required: route.approval_required,
    metadata
  });
  await insertAuditLog(supabase, {
    actor_name: `${identity.name} - ${identity.title}`,
    action_type: "inbound_message_routed",
    summary: `Inbound message routed to ${identity.name} as ${data.classification}.`,
    status: data.status,
    metadata
  });
  if (route.assigned_agent === "theo" && route.approval_required) {
    const replyResult = await saveReplyIntake(supabase, {
      reply: {
        contact_name: row.from_name,
        contact_email: row.from_email,
        message: body,
        notes: `Created from inbound message ${data.id}`
      }
    });
    const queuedTrace = createTheoDecisionTrace(data.id, route, { theo_queue_item_created: true, reply_intake_id: replyResult?.reply?.id || null });
    await insertAgentLog(supabase, {
      agent_key: "theo",
      agent_name: identity.name,
      agent_role: identity.title,
      action_type: "theo_decision_trace",
      action_label: "Theo workflow trace",
      summary: "Theo decision trace: approval required, queue item created.",
      status: "pending_approval",
      approval_required: true,
      metadata: { ...metadata, theo_trace: queuedTrace }
    });
  } else if (route.assigned_agent === "theo") {
    await insertAgentLog(supabase, {
      agent_key: "theo",
      agent_name: identity.name,
      agent_role: identity.title,
      action_type: "theo_enquiry_received",
      action_label: "Safe Theo booking enquiry received",
      summary: "Theo received a safe booking enquiry.",
      status: "received",
      approval_required: false,
      metadata
    });
    if (estimate) {
      await insertAgentLog(supabase, {
        agent_key: "theo",
        agent_name: identity.name,
        agent_role: identity.title,
        action_type: "theo_pricing_estimate_calculated",
        action_label: "Indicative pricing estimate calculated",
        summary: `Theo calculated an indicative estimate for ${estimate.course_title}.`,
        status: "calculated",
        approval_required: false,
        metadata: { ...metadata, pricing_estimate: estimate }
      });
    }
    await insertAgentLog(supabase, {
      agent_key: "theo",
      agent_name: identity.name,
      agent_role: identity.title,
      action_type: "theo_training_page_referred",
      action_label: "Training page referred",
      summary: "Theo referred the customer to the training page for current details and visible discounts.",
      status: "referred",
      approval_required: false,
      metadata: { ...metadata, training_page_url: theoTrainingPageUrl }
    });
    await insertAgentLog(supabase, {
      agent_key: "theo",
      agent_name: identity.name,
      agent_role: identity.title,
      action_type: "theo_decision_trace",
      action_label: "Theo workflow trace",
      summary: "Theo decision trace: auto-reply allowed. Manual intake does not send automated emails.",
      status: "auto_reply",
      approval_required: false,
      metadata
    });
  }
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, inboundMessage: data, inboundMessages: compliance.inboundMessages, replies: compliance.replies, agentLogs: compliance.agentLogs };
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
  lines.push("Thanks for getting in touch.");
  if (decision.approved_dates) {
    lines.push(`The dates approved for discussion are: ${decision.approved_dates}.`);
  }
  if (decision.approved_availability_wording) {
    lines.push(decision.approved_availability_wording);
  }
  if (decision.approved_price_payment_instruction) {
    lines.push(decision.approved_price_payment_instruction);
  }
  if (!decision.approved_dates && !decision.approved_availability_wording && !decision.approved_price_payment_instruction) {
    lines.push("The team will check the request before any booking is finalised.");
  }
  lines.push("");
  lines.push("Please send any missing preferred date or location details and we will take it from there.");
  lines.push("");
  lines.push("Kind regards,");
  lines.push("Theo");
  lines.push("Training Bookings & Sales Coordinator");
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
  const scored = scoreProspect(prospect);
  const row = {
    organisation_name: String(prospect.organisation_name || "").trim(),
    website: String(prospect.website || "").trim(),
    location: String(prospect.location || "").trim(),
    region: String(prospect.region || "").trim(),
    sector: String(prospect.sector || "").trim(),
    likely_training_need: String(prospect.likely_training_need || "").trim(),
    recommended_service: normaliseRecommendedService(prospect.recommended_service || scored.recommended_service, prospect),
    contact_email: String(prospect.contact_email || "").trim(),
    phone: String(prospect.phone || "").trim(),
    decision_maker_name: String(prospect.decision_maker_name || "").trim(),
    source_url: String(prospect.source_url || "").trim(),
    notes: String(prospect.notes || "").trim(),
    outreach_brief: String(prospect.outreach_brief || "").trim(),
    priority: normaliseProspectPriority(prospect.priority || scored.priority),
    score: Number.isFinite(Number(prospect.score)) ? Math.max(0, Math.min(100, Number(prospect.score))) : scored.score,
    relevance_reason: String(prospect.relevance_reason || scored.relevance_reason || "").trim(),
    review_status: normaliseProspectReviewStatus(prospect.review_status),
    status: normaliseProspectStatus(prospect.status || prospect.review_status || "new"),
    do_not_contact: Boolean(prospect.do_not_contact),
    researched_by: String(prospect.researched_by || "Rory").trim(),
    assigned_to: String(prospect.assigned_to || "").trim(),
    first_contact_sent_at: String(prospect.first_contact_sent_at || "").trim() || null,
    follow_up_1_scheduled_for: String(prospect.follow_up_1_scheduled_for || "").trim() || null,
    follow_up_2_scheduled_for: String(prospect.follow_up_2_scheduled_for || "").trim() || null,
    last_contacted_at: String(prospect.last_contacted_at || "").trim() || null,
    created_by_agent: "rory",
    updated_at: new Date().toISOString()
  };
  if (!row.outreach_brief) row.outreach_brief = buildOutreachBrief(row);
  if (!row.organisation_name) throw new Error("Organisation name is required.");
  if (!row.source_url && !row.website) throw new Error("Source URL or website is required so the public source can be reviewed.");
  const query = prospect.id
    ? supabase.from("prospects").update(row).eq("id", prospect.id)
    : supabase.from("prospects").insert(row);
  const { data, error } = await query
    .select(flexibleSelect)
    .single();
  if (error) throw error;
  await insertAgentLog(supabase, {
    agent_key: "rory",
    agent_name: rory.name,
    agent_role: rory.title,
    action_type: prospect.id ? "prospect_updated" : "prospect_added",
    action_label: prospect.id ? "Prospect updated" : "Prospect saved",
    summary: `${rory.name} (${rory.title}) saved ${data.organisation_name} as a ${data.priority} priority ${data.recommended_service || "training"} prospect.`,
    status: data.status || "new",
    approval_required: true,
    metadata: { prospect_id: data.id, priority: data.priority, sector: data.sector, recommended_service: data.recommended_service, source_url: data.source_url, outreach_brief: data.outreach_brief, agent_title: rory.title, agent_tone: rory.tone }
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, prospect: data, prospects: compliance.prospects, followUps: compliance.followUps, agentLogs: compliance.agentLogs };
}

async function updateProspectStatus(supabase, payload) {
  const id = String(payload?.id || "");
  const reviewStatus = normaliseProspectReviewStatus(payload?.review_status);
  const rory = getAgentIdentity("rory");
  if (!id) throw new Error("Prospect ID is required.");
  const { data, error } = await supabase
    .from("prospects")
    .update({ review_status: reviewStatus, status: reviewStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(flexibleSelect)
    .single();
  if (error) throw error;
  await insertAgentLog(supabase, {
    agent_key: "rory",
    agent_name: rory.name,
    agent_role: rory.title,
    action_type: `prospect_${reviewStatus}`,
    action_label: "Prospect review status updated",
    summary: `${rory.name} (${rory.title}) prospect ${data.organisation_name} was marked ${reviewStatus.replace("_", " ")}.`,
    status: reviewStatus,
    approval_required: reviewStatus === "pending_review",
    metadata: { prospect_id: data.id, priority: data.priority, sector: data.sector, agent_title: rory.title, agent_tone: rory.tone }
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, prospect: data, prospects: compliance.prospects, followUps: compliance.followUps, agentLogs: compliance.agentLogs };
}

async function scoreRoryProspect(supabase, payload) {
  const id = String(payload?.id || "");
  if (!id) throw new Error("Prospect ID is required.");
  const { data: prospect, error: fetchError } = await supabase.from("prospects").select(flexibleSelect).eq("id", id).maybeSingle();
  if (fetchError) throw fetchError;
  if (!prospect) throw new Error("Prospect was not found.");
  const scored = scoreProspect(prospect);
  const outreach_brief = buildOutreachBrief({ ...prospect, ...scored });
  const prospectUpdate = {
    priority: scored.priority,
    recommended_service: scored.recommended_service,
    relevance_reason: scored.relevance_reason,
    score: scored.score,
    outreach_brief,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from("prospects")
    .update(prospectUpdate)
    .eq("id", id)
    .select(flexibleSelect)
    .single();
  if (error) throw error;
  const rory = getAgentIdentity("rory");
  await insertAgentLog(supabase, {
    agent_key: "rory",
    agent_name: rory.name,
    agent_role: rory.title,
    action_type: "prospect_scored",
    action_label: "Prospect scored",
    summary: `${rory.name} scored ${data.organisation_name} as ${data.priority} priority with a score of ${data.score || 0} and recommended ${data.recommended_service}.`,
    status: "scored",
    approval_required: true,
    metadata: { prospect_id: data.id, priority: data.priority, score: data.score, calculated_score: scored.calculated_score, scoring_basis: scored.scoring_basis, recommended_service: data.recommended_service, outreach_brief }
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, prospect: data, prospects: compliance.prospects, followUps: compliance.followUps, agentLogs: compliance.agentLogs };
}

async function sendProspectToMia(supabase, payload) {
  const id = String(payload?.id || "");
  if (!id) throw new Error("Prospect ID is required.");
  const { data: prospect, error: fetchError } = await supabase.from("prospects").select(flexibleSelect).eq("id", id).maybeSingle();
  if (fetchError) throw fetchError;
  if (!prospect) throw new Error("Prospect was not found.");
  if (prospect.do_not_contact) throw new Error("This prospect is marked do not contact.");
  const mia = getAgentIdentity("mia");
  const rory = getAgentIdentity("rory");
  const now = new Date().toISOString();
  const followUpOne = addDaysIso(5);
  const followUpTwo = addDaysIso(14);
  const followUpThree = addDaysIso(30);
  const followUpFour = addDaysIso(60);
  const html = buildMiaProspectOutreachEmail(prospect);
  const hasEmail = Boolean(String(prospect.contact_email || "").trim());
  const canSend = miaOutreachAutosendEnabled && hasEmail;
  let sendStatus = canSend ? "sent" : "pending_approval";
  let providerResponse = null;
  let errorMessage = "";

  await insertAgentLog(supabase, {
    agent_key: "rory",
    agent_name: rory.name,
    agent_role: rory.title,
    action_type: "prospect_sent_to_mia",
    action_label: "Prospect sent to Mia",
    summary: `${rory.name} passed ${prospect.organisation_name} to ${mia.name} for outreach preparation.`,
    status: "sent_to_mia",
    approval_required: !canSend,
    metadata: { prospect_id: prospect.id, recommended_service: prospect.recommended_service, autosend_enabled: miaOutreachAutosendEnabled, has_email: hasEmail }
  });

  if (canSend) {
    try {
      providerResponse = await sendAgentEmail({
        to: prospect.contact_email,
        subject: buildMiaProspectOutreachSubject(prospect),
        html
      });
    } catch (error) {
      sendStatus = "failed";
      errorMessage = error.message || "Outreach email could not be sent.";
    }
  }

  const prospectUpdate = {
    assigned_to: "Mia",
    status: sendStatus === "sent" ? "contacted" : sendStatus === "failed" ? "pending_outreach" : "ready_for_outreach",
    outreach_brief: prospect.outreach_brief || buildOutreachBrief(prospect),
    follow_up_1_scheduled_for: followUpOne,
    follow_up_2_scheduled_for: followUpTwo,
    last_contacted_at: sendStatus === "sent" ? now : prospect.last_contacted_at,
    first_contact_sent_at: sendStatus === "sent" ? now : prospect.first_contact_sent_at,
    updated_at: now
  };
  const { data: updatedProspect, error: updateError } = await supabase.from("prospects").update(prospectUpdate).eq("id", prospect.id).select(flexibleSelect).single();
  if (updateError) throw updateError;

  const followUpStatus = sendStatus === "sent" ? "pending" : "pending_approval";
  const { error: followUpDeleteError } = await supabase.from("follow_up_tasks").delete().eq("prospect_id", prospect.id).in("task_type", ["follow_up_1", "follow_up_2", "follow_up_3", "follow_up_4"]);
  if (followUpDeleteError) throw followUpDeleteError;
  const { data: followUps, error: followUpError } = await supabase.from("follow_up_tasks").insert([
    { prospect_id: prospect.id, agent_name: "Mia", task_type: "follow_up_1", status: followUpStatus, scheduled_for: followUpOne, notes: "Day 5: Gentle follow-up after Mia's warm introduction." },
    { prospect_id: prospect.id, agent_name: "Mia", task_type: "follow_up_2", status: followUpStatus, scheduled_for: followUpTwo, notes: "Day 14: Compliance and training awareness email." },
    { prospect_id: prospect.id, agent_name: "Mia", task_type: "follow_up_3", status: followUpStatus, scheduled_for: followUpThree, notes: "Day 30: Refresher and training-record reminder." },
    { prospect_id: prospect.id, agent_name: "Mia", task_type: "follow_up_4", status: followUpStatus, scheduled_for: followUpFour, notes: "Day 60: Seasonal reminder covering onboarding, refresher expiry, academic-year preparation or council compliance checks." }
  ]).select(flexibleSelect);
  if (followUpError) throw followUpError;

  await insertAgentLog(supabase, {
    agent_key: "mia",
    agent_name: mia.name,
    agent_role: mia.title,
    action_type: sendStatus === "sent" ? "mia_prospect_outreach_sent" : sendStatus === "failed" ? "mia_prospect_outreach_failed" : "mia_prospect_outreach_pending",
    action_label: sendStatus === "sent" ? "Prospect outreach sent" : "Prospect outreach prepared",
    summary: sendStatus === "sent"
      ? `${mia.name} sent a warm outreach email to ${prospect.organisation_name}.`
      : `${mia.name} prepared outreach for ${prospect.organisation_name}; ${errorMessage || "auto-send is not enabled or no public email was available."}`,
    status: sendStatus,
    approval_required: sendStatus !== "sent",
    metadata: { prospect_id: prospect.id, provider_response: providerResponse, error: errorMessage, email_preview: html, follow_up_ids: (followUps || []).map((item) => item.id), autosend_enabled: miaOutreachAutosendEnabled }
  });

  await insertAgentLog(supabase, {
    agent_key: "mia",
    agent_name: mia.name,
    agent_role: mia.title,
    action_type: "follow_up_scheduled",
    action_label: "Follow-ups scheduled",
    summary: `${mia.name} scheduled the Day 5, Day 14, Day 30 and Day 60 follow-up sequence for ${prospect.organisation_name}.`,
    status: followUpStatus,
    approval_required: followUpStatus !== "pending",
    metadata: { prospect_id: prospect.id, follow_up_1_scheduled_for: followUpOne, follow_up_2_scheduled_for: followUpTwo, follow_up_3_scheduled_for: followUpThree, follow_up_4_scheduled_for: followUpFour, sequence: ["Day 0 warm introduction", "Day 5 gentle follow-up", "Day 14 compliance/training awareness", "Day 30 refresher/reminder", "Day 60 seasonal reminder"] }
  });

  const compliance = await getTrainingCompliance(supabase);
  return { success: true, prospect: updatedProspect, prospects: compliance.prospects, followUps: compliance.followUps, agentLogs: compliance.agentLogs, emailStatus: sendStatus, autoSendEnabled: miaOutreachAutosendEnabled };
}

async function previewProspectMiaEmail(supabase, payload) {
  const id = String(payload?.id || "");
  if (!id) throw new Error("Prospect ID is required.");
  const { data: prospect, error: fetchError } = await supabase.from("prospects").select(flexibleSelect).eq("id", id).maybeSingle();
  if (fetchError) throw fetchError;
  if (!prospect) throw new Error("Prospect was not found.");
  return {
    success: true,
    prospect,
    subject: buildMiaProspectOutreachSubject(prospect),
    html: buildMiaProspectOutreachEmail(prospect),
    to: prospect.contact_email || "",
    autoSendEnabled: miaOutreachAutosendEnabled
  };
}

async function markProspectDoNotContact(supabase, payload) {
  const id = String(payload?.id || "");
  if (!id) throw new Error("Prospect ID is required.");
  const { data, error } = await supabase
    .from("prospects")
    .update({ do_not_contact: true, status: "do_not_contact", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(flexibleSelect)
    .single();
  if (error) throw error;
  await supabase.from("follow_up_tasks").update({ status: "cancelled" }).eq("prospect_id", id).eq("status", "pending");
  const mia = getAgentIdentity("mia");
  await insertAgentLog(supabase, {
    agent_key: "mia",
    agent_name: mia.name,
    agent_role: mia.title,
    action_type: "prospect_do_not_contact_marked",
    action_label: "Do not contact marked",
    summary: `${data.organisation_name} was marked do not contact and pending follow-ups were cancelled.`,
    status: "do_not_contact",
    approval_required: false,
    metadata: { prospect_id: data.id }
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, prospect: data, prospects: compliance.prospects, followUps: compliance.followUps, agentLogs: compliance.agentLogs };
}

async function deleteProspect(supabase, payload) {
  const id = String(payload?.id || "");
  if (!id) throw new Error("Prospect ID is required.");
  const { data: prospect, error: fetchError } = await supabase.from("prospects").select("id, organisation_name").eq("id", id).maybeSingle();
  if (fetchError) throw fetchError;
  const { error } = await supabase.from("prospects").delete().eq("id", id);
  if (error) throw error;
  const rory = getAgentIdentity("rory");
  await insertAgentLog(supabase, {
    agent_key: "rory",
    agent_name: rory.name,
    agent_role: rory.title,
    action_type: "prospect_deleted",
    action_label: "Prospect deleted",
    summary: `${rory.name} deleted ${prospect?.organisation_name || "a prospect"} from the review list.`,
    status: "deleted",
    approval_required: false,
    metadata: { prospect_id: id }
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, prospects: compliance.prospects, followUps: compliance.followUps, agentLogs: compliance.agentLogs };
}

async function runRoryProspectResearch(supabase, payload) {
  const rory = getAgentIdentity("rory");
  const runType = String(payload?.run_type || payload?.runType || "manual").trim() || "manual";
  const searchTheme = String(payload?.search_theme || payload?.searchTheme || "First Aid training prospects").trim();
  const safeTheme = rorySearchThemes.includes(searchTheme) ? searchTheme : searchTheme.slice(0, 120);
  const locationFocus = String(payload?.location || payload?.locationFocus || "").trim().slice(0, 120);
  const { data: run, error: runError } = await supabase
    .from("rory_research_runs")
    .insert({ run_type: runType, status: "running", search_theme: safeTheme, provider: "manus" })
    .select(flexibleSelect)
    .single();
  if (runError) throw runError;

  await insertAgentLog(supabase, {
    agent_key: "rory",
    agent_name: rory.name,
    agent_role: rory.title,
    action_type: "rory_research_run_started",
    action_label: "Rory research run started",
    summary: `${rory.name} started a ${runType} prospect research run for ${safeTheme}.`,
    status: "running",
    approval_required: false,
    metadata: { run_id: run.id, run_type: runType, search_theme: safeTheme, location_focus: locationFocus, provider: "manus", endpoint: manusTaskCreateEndpoint }
  });

  if (!process.env.MANUS_API_KEY) {
    const message = "Research provider not configured. Missing MANUS_API_KEY.";
    const { data: updatedRun } = await supabase
      .from("rory_research_runs")
      .update({ status: "provider_not_configured", errors: message, completed_at: new Date().toISOString() })
      .eq("id", run.id)
      .select(flexibleSelect)
      .single();
    await insertAgentLog(supabase, {
      agent_key: "rory",
      agent_name: rory.name,
      agent_role: rory.title,
      action_type: "rory_research_provider_not_configured",
      action_label: "Research provider not configured",
      summary: `${rory.name} could not run live prospect research because ${message}`,
      status: "provider_not_configured",
      approval_required: false,
      metadata: { run_id: run.id, search_theme: safeTheme }
    });
    const compliance = await getTrainingCompliance(supabase);
    return { success: true, status: "provider_not_configured", message, run: updatedRun || run, roryRuns: compliance.roryRuns, prospects: compliance.prospects, agentLogs: compliance.agentLogs, provider: { name: "manus", manus_api_key_present: false, endpoint_configured: true, live_research_confirmed: false } };
  }

  let createPayload;
  let taskId = "";
  let taskUrl = "";
  try {
    const response = await fetch(manusTaskCreateEndpoint, {
      method: "POST",
      headers: {
        "x-manus-api-key": process.env.MANUS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: `Rory prospect research - ${safeTheme}`,
        message: {
          content: `Find UK prospects for ACE MiDAS Training using the theme: ${safeTheme}.
${locationFocus ? `Focus the research on ${locationFocus}. Prioritise organisations based in or serving ${locationFocus}.` : "Search across the UK, prioritising relevant organisations with clear public contact details."}

Target markets include schools, academy trusts, SEND schools, local authorities, community transport providers, charities, care providers, minibus operators, nurseries, childcare providers, private schools, sports clubs, gyms, community centres, churches or faith organisations, event companies, hospitality businesses, hotels, restaurants, warehouses, small businesses, offices, construction companies, security companies, facilities management companies, domiciliary care providers and supported living providers.

Use publicly available business information only. Prefer generic business emails such as info@, enquiries@, training@, admin@, office@ or hr@. Do not collect private personal data. Return only relevant UK organisations likely to need First Aid, PATS, MiDAS, refresher training or compliance tracking support. Keep results concise and high quality.`,
          connectors: manusConnectorIds
        },
        structured_output_schema: buildRoryProspectSchema()
      })
    });
    const text = await response.text();
    try {
      createPayload = text ? JSON.parse(text) : {};
    } catch {
      createPayload = { error: "Manus returned non-JSON response.", raw: text.slice(0, 500) };
    }
    if (!response.ok) throw new Error(safeErrorMessage(createPayload?.error || createPayload?.message || createPayload, `Manus returned HTTP ${response.status}`));
    taskId = String(createPayload.task_id || createPayload.id || "");
    taskUrl = String(createPayload.task_url || "");
    if (!taskId) throw new Error("Manus did not return a task_id.");
    await supabase.from("rory_research_runs").update({ provider_task_id: taskId, provider_task_url: taskUrl || null }).eq("id", run.id);
  } catch (error) {
    const message = safeErrorMessage(error, "Research provider request failed.");
    console.error("Rory Manus task.create error:", { message });
    const { data: failedRun } = await supabase
      .from("rory_research_runs")
      .update({ status: "failed", errors: message, completed_at: new Date().toISOString() })
      .eq("id", run.id)
      .select(flexibleSelect)
      .single();
    await insertAgentLog(supabase, {
      agent_key: "rory",
      agent_name: rory.name,
      agent_role: rory.title,
      action_type: "rory_research_error",
      action_label: "Rory research error",
      summary: `${rory.name} research run failed: ${message}`,
      status: "failed",
      approval_required: false,
      metadata: { run_id: run.id, search_theme: safeTheme }
    });
    const compliance = await getTrainingCompliance(supabase);
    return { success: false, status: "failed", error: message, run: failedRun || run, roryRuns: compliance.roryRuns, prospects: compliance.prospects, agentLogs: compliance.agentLogs };
  }

  let pollResult;
  try {
    pollResult = await pollManusProspectResult(taskId);
  } catch (error) {
    const message = safeErrorMessage(error, "Manus polling failed.");
    console.error("Rory Manus polling error:", { message, taskId });
    const { data: failedRun } = await supabase
      .from("rory_research_runs")
      .update({ status: "failed", errors: message, completed_at: new Date().toISOString() })
      .eq("id", run.id)
      .select(flexibleSelect)
      .single();
    await insertAgentLog(supabase, {
      agent_key: "rory",
      agent_name: rory.name,
      agent_role: rory.title,
      action_type: "rory_research_error",
      action_label: "Rory research polling error",
      summary: `${rory.name} could not retrieve Manus research results: ${message}`,
      status: "failed",
      approval_required: false,
      metadata: { run_id: run.id, search_theme: safeTheme, location_focus: locationFocus, provider_task_id: taskId }
    });
    const compliance = await getTrainingCompliance(supabase);
    return { success: false, status: "failed", error: message, run: failedRun || run, roryRuns: compliance.roryRuns, prospects: compliance.prospects, agentLogs: compliance.agentLogs };
  }

  if (pollResult.status === "waiting_for_result") {
    const { data: waitingRun } = await supabase
      .from("rory_research_runs")
      .update({ status: "waiting_for_result", errors: "Manus task created. Results are not ready yet; run Rory again later or add webhook completion.", provider_task_id: taskId, provider_task_url: taskUrl || null })
      .eq("id", run.id)
      .select(flexibleSelect)
      .single();
    await insertAgentLog(supabase, {
      agent_key: "rory",
      agent_name: rory.name,
      agent_role: rory.title,
      action_type: "rory_research_waiting_for_result",
      action_label: "Rory research waiting for Manus result",
      summary: `${rory.name} created a Manus research task for ${safeTheme}. Results are not ready yet.`,
      status: "waiting_for_result",
      approval_required: false,
      metadata: { run_id: run.id, search_theme: safeTheme, location_focus: locationFocus, provider_task_id: taskId, provider_task_url: taskUrl }
    });
    const compliance = await getTrainingCompliance(supabase);
    return { success: true, status: "waiting_for_result", message: "Manus task created. Results are not ready yet.", run: waitingRun || run, roryRuns: compliance.roryRuns, prospects: compliance.prospects, agentLogs: compliance.agentLogs, provider: { name: "manus", task_id: taskId, task_url: taskUrl, live_research_confirmed: true } };
  }

  const candidates = Array.isArray(pollResult.prospects) ? pollResult.prospects : [];
  const { prospectsSaved, duplicatesSkipped, duplicateDetails } = await saveRoryProspectCandidates(supabase, { run: { ...run, provider_task_id: taskId }, candidates, searchTheme: safeTheme, rory });
  const finalStatus = candidates.length ? "completed" : "completed_no_results";
  const { data: completedRun } = await supabase
    .from("rory_research_runs")
    .update({ status: finalStatus, prospects_found: candidates.length, prospects_saved: prospectsSaved, duplicates_skipped: duplicatesSkipped, provider_task_id: taskId, provider_task_url: taskUrl || null, completed_at: new Date().toISOString() })
    .eq("id", run.id)
    .select(flexibleSelect)
    .single();
  await insertAgentLog(supabase, {
    agent_key: "rory",
    agent_name: rory.name,
    agent_role: rory.title,
    action_type: "rory_research_run_completed",
    action_label: "Rory research run completed",
    summary: `${rory.name} completed ${safeTheme}: ${candidates.length} found, ${prospectsSaved} saved, ${duplicatesSkipped} duplicate(s) skipped.`,
    status: finalStatus,
    approval_required: false,
    metadata: { run_id: run.id, search_theme: safeTheme, location_focus: locationFocus, provider_task_id: taskId, provider_task_url: taskUrl, prospects_found: candidates.length, prospects_saved: prospectsSaved, duplicates_skipped: duplicatesSkipped }
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, status: finalStatus, run: completedRun || run, roryRuns: compliance.roryRuns, prospects: compliance.prospects, agentLogs: compliance.agentLogs, duplicate_details: duplicateDetails, provider: { name: "manus", task_id: taskId, task_url: taskUrl, live_research_confirmed: true } };
}

async function importRoryProspects(supabase, payload) {
  const rory = getAgentIdentity("rory");
  const candidates = Array.isArray(payload?.prospects) ? payload.prospects : [];
  const searchTheme = String(payload?.searchTheme || payload?.search_theme || "manual uploaded research").trim().slice(0, 120);
  if (!candidates.length) throw new Error("No prospect records were provided for import.");
  const { data: run, error: runError } = await supabase
    .from("rory_research_runs")
    .insert({ run_type: "manual_upload", status: "importing", search_theme: searchTheme, provider: "manual_upload", prospects_found: candidates.length })
    .select(flexibleSelect)
    .single();
  if (runError) throw runError;
  await insertAgentLog(supabase, {
    agent_key: "rory",
    agent_name: rory.name,
    agent_role: rory.title,
    action_type: "rory_research_import_started",
    action_label: "Research import started",
    summary: `${rory.name} started importing ${candidates.length} researched prospect record(s).`,
    status: "importing",
    approval_required: false,
    metadata: { run_id: run.id, search_theme: searchTheme, prospects_found: candidates.length }
  });
  const { prospectsSaved, duplicatesSkipped, duplicateDetails } = await saveRoryProspectCandidates(supabase, { run, candidates, searchTheme, rory });
  const finalStatus = prospectsSaved ? "completed" : "completed_no_results";
  const { data: completedRun } = await supabase
    .from("rory_research_runs")
    .update({ status: finalStatus, prospects_saved: prospectsSaved, duplicates_skipped: duplicatesSkipped, completed_at: new Date().toISOString() })
    .eq("id", run.id)
    .select(flexibleSelect)
    .single();
  await insertAgentLog(supabase, {
    agent_key: "rory",
    agent_name: rory.name,
    agent_role: rory.title,
    action_type: "rory_research_import_completed",
    action_label: "Research import completed",
    summary: `${rory.name} imported ${prospectsSaved} prospect(s) and skipped ${duplicatesSkipped} duplicate(s).`,
    status: finalStatus,
    approval_required: true,
    metadata: { run_id: run.id, search_theme: searchTheme, prospects_found: candidates.length, prospects_saved: prospectsSaved, duplicates_skipped: duplicatesSkipped }
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, status: finalStatus, run: completedRun || run, roryRuns: compliance.roryRuns, prospects: compliance.prospects, followUps: compliance.followUps, agentLogs: compliance.agentLogs, prospects_saved: prospectsSaved, duplicates_skipped: duplicatesSkipped, duplicate_details: duplicateDetails };
}

async function checkRoryResearchRun(supabase, payload) {
  const id = String(payload?.id || payload?.run_id || "").trim();
  if (!id) throw new Error("Research run ID is required.");
  if (!process.env.MANUS_API_KEY) throw new Error("Research provider not configured. Missing MANUS_API_KEY.");

  const { data: run, error: runError } = await supabase
    .from("rory_research_runs")
    .select(flexibleSelect)
    .eq("id", id)
    .maybeSingle();
  if (runError) throw runError;
  if (!run) throw new Error("Research run not found.");
  if (!run.provider_task_id) throw new Error("This research run has no Manus task ID to check.");

  const rory = getAgentIdentity("rory");
  const pollResult = await pollManusProspectResult(run.provider_task_id, 4);
  if (pollResult.status === "waiting_for_result") {
    const compliance = await getTrainingCompliance(supabase);
    return { success: true, status: "waiting_for_result", message: "Manus results are not ready yet.", run, roryRuns: compliance.roryRuns, prospects: compliance.prospects, agentLogs: compliance.agentLogs };
  }

  const candidates = Array.isArray(pollResult.prospects) ? pollResult.prospects : [];
  const { prospectsSaved, duplicatesSkipped, duplicateDetails } = await saveRoryProspectCandidates(supabase, { run, candidates, searchTheme: run.search_theme || "prospect research", rory });
  const finalStatus = candidates.length ? "completed" : "completed_no_results";
  const { data: completedRun } = await supabase
    .from("rory_research_runs")
    .update({ status: finalStatus, prospects_found: candidates.length, prospects_saved: prospectsSaved, duplicates_skipped: duplicatesSkipped, completed_at: new Date().toISOString() })
    .eq("id", run.id)
    .select(flexibleSelect)
    .single();
  await insertAgentLog(supabase, {
    agent_key: "rory",
    agent_name: rory.name,
    agent_role: rory.title,
    action_type: "rory_research_run_completed",
    action_label: "Rory research result checked",
    summary: `${rory.name} checked Manus results for ${run.search_theme || "prospect research"}: ${candidates.length} found, ${prospectsSaved} saved, ${duplicatesSkipped} duplicate(s) skipped.`,
    status: finalStatus,
    approval_required: false,
    metadata: { run_id: run.id, search_theme: run.search_theme, provider_task_id: run.provider_task_id, prospects_found: candidates.length, prospects_saved: prospectsSaved, duplicates_skipped: duplicatesSkipped }
  });
  const compliance = await getTrainingCompliance(supabase);
  return { success: true, status: finalStatus, run: completedRun || run, roryRuns: compliance.roryRuns, prospects: compliance.prospects, agentLogs: compliance.agentLogs, duplicate_details: duplicateDetails };
}

function buildNiaContentDraft(payload = {}) {
  const platform = cleanListValue(payload.platform, niaPlatforms, "LinkedIn");
  const contentType = cleanListValue(payload.content_type || payload.contentType, niaContentTypes, "Awareness post");
  const topic = sentenceCase(payload.topic, "refresher training");
  const targetAudience = sentenceCase(payload.target_audience || payload.targetAudience, "training managers");
  const tone = String(payload.tone || "confident, professional, warm, modern and non-pushy").trim();
  const callToAction = String(payload.call_to_action || payload.callToAction || niaDefaultCta).trim();
  const isVideo = /tiktok|reels|video/i.test(`${platform} ${contentType}`);
  const isCarousel = /carousel/i.test(`${platform} ${contentType}`);
  const isWeeklyPlan = /weekly content plan/i.test(contentType);
  const topicLower = topic.toLowerCase();
  const audienceLower = targetAudience.toLowerCase();
  const audiencePhrase = audienceLower.includes("transport") || audienceLower.includes("council") || audienceLower.includes("school")
    ? targetAudience
    : `${targetAudience} supporting passenger transport`;
  const theme = topicLower.includes("expiry") || topicLower.includes("certificate") || topicLower.includes("compliance")
    ? "staying ahead of compliance pressure"
    : topicLower.includes("first aid")
      ? "keeping trained people ready when support is needed"
      : topicLower.includes("pats")
        ? "supporting passenger assistants with clear, practical training"
        : topicLower.includes("midas")
          ? "helping minibus drivers stay confident, current and safe"
          : "building confident, well-supported passenger transport teams";
  const title = isWeeklyPlan
    ? `Weekly Content Plan: ${topic}`
    : isCarousel
      ? `${topic}: A Clearer Way to Stay Ahead`
      : isVideo
        ? `${topic}: Short Video Script`
        : topicLower.includes("expiry")
          ? "Don't Wait Until Training Becomes Urgent"
          : `${topic} Support for ${targetAudience}`;
  const hashtags = [
    topicLower.includes("midas") ? "#MiDAS" : null,
    topicLower.includes("pats") ? "#PATSTraining" : null,
    topicLower.includes("first aid") ? "#FirstAidTraining" : null,
    "#TrainingCompliance",
    audienceLower.includes("send") ? "#SENDTransport" : null,
    audienceLower.includes("school") ? "#SchoolTransport" : null,
    audienceLower.includes("council") ? "#LocalAuthorities" : null,
    "#RefresherTraining"
  ].filter(Boolean).join(" ");
  const suggestedVisual = isVideo
    ? "A clean vertical video using close-ups of a training checklist, certificate folder, calendar dates and a calm passenger transport setting."
    : isCarousel
      ? "A premium carousel with simple checklist visuals, expiry-date prompts, staff training icons and ACE MiDAS Training brand colours."
      : "A professional image of a training checklist, expiry calendar and passenger transport setting, with clean space for a short headline.";
  const visualStyle = "Premium UK training brand, clean editorial layout, dark navy and emerald accents, realistic professional setting, bright natural light, no fake logos, no distorted text, no exaggerated stock-photo look.";

  let content = "";
  if (isWeeklyPlan) {
    content = `Monday - Awareness post\nOpen with a practical reminder about ${theme}. Focus on why ${audiencePhrase} should review training records before they become urgent.\n\nTuesday - Education post\nExplain one useful point about ${topic}, keeping the wording clear, calm and helpful for non-technical decision-makers.\n\nWednesday - Trust-building post\nShare how organised training records, refresher planning and certificates help teams feel prepared for inspections, renewals and everyday responsibilities.\n\nThursday - CTA post\nInvite organisations to review upcoming renewal dates and speak to ACE MiDAS Training if they need support planning ${topic}.\n\nFriday - Engagement post\nAsk a simple question: "When did your team last review upcoming training expiry dates?" Keep the tone supportive, not alarming.\n\nSuggested weekly rhythm\nUse one strong visual theme across the week: calendar dates, certificate records, training checklists and passenger transport professionalism.`;
  } else if (isCarousel) {
    content = `Slide 1 hook\n${title}\n\nSlide 2\nTraining records can look fine until renewal dates start arriving together.\n\nSlide 3\nFor ${audiencePhrase}, missed refresher planning can create avoidable pressure for managers, drivers and passenger assistants.\n\nSlide 4\nACE MiDAS Training supports ${topic} with a practical, organised approach built around real teams.\n\nSlide 5\nGood training planning means fewer last-minute surprises and clearer evidence when records need to be checked.\n\nFinal CTA slide\nReview your upcoming training dates and speak to ACE MiDAS Training if your team needs support.\n\nCaption\n${audiencePhrase} can stay ahead of training pressure by reviewing renewal dates early and planning refresher support before it becomes urgent.\n\n${callToAction}`;
  } else if (isVideo) {
    content = `Hook\n"Training expiry dates rarely feel urgent until they suddenly are."\n\nScene 1\nVisual: Calendar page with renewal dates highlighted.\nVoiceover: "If your team manages passenger transport, refresher training should be planned before expiry dates become a last-minute problem."\nOn-screen text: Training dates approaching?\n\nScene 2\nVisual: Certificate folder or digital checklist.\nVoiceover: "ACE MiDAS Training supports ${topic} for organisations that need clear records and confident staff."\nOn-screen text: PATS • MiDAS • First Aid\n\nScene 3\nVisual: Staff briefing or calm transport setting.\nVoiceover: "The aim is simple: trained people, organised records and fewer compliance surprises."\nOn-screen text: Stay ahead of renewals\n\nScene 4\nVisual: ACE MiDAS Training branded closing frame.\nVoiceover: "${callToAction}"\nOn-screen text: Plan refresher training early\n\nCaption\n${audiencePhrase}: if training renewal dates are approaching, this is a good time to review your records and plan the next step.`;
  } else {
    content = `${topic} can be easy to push down the list until a renewal date, staff change or compliance check brings it back into focus.\n\nFor ${audiencePhrase}, ${theme} is not just an admin task. It helps teams stay organised, supports safer passenger transport practice and gives managers clearer evidence when training records need to be reviewed.\n\nACE MiDAS Training supports organisations with practical ${topic} and refresher planning across PATS, MiDAS and First Aid routes, helping teams keep training current without unnecessary last-minute pressure.\n\nIf your staff training dates are approaching renewal, now is a good time to review what is due and plan the next step.`;
  }

  return {
    agent_name: "Nia",
    content_type: contentType,
    platform,
    target_audience: targetAudience,
    title,
    content,
    suggested_visual: suggestedVisual,
    image_prompt: buildNiaImagePrompt({ platform, content_type: contentType, topic, target_audience: targetAudience, title, suggested_visual: suggestedVisual, visual_style: visualStyle }),
    visual_style: visualStyle,
    image_status: "prompt_ready",
    call_to_action: callToAction,
    hashtags,
    tone,
    status: "draft",
    topic
  };
}

function buildNiaImagePrompt(draft = {}) {
  const platform = String(draft.platform || "LinkedIn").trim();
  const contentType = String(draft.content_type || "social post").trim();
  const topic = String(draft.topic || "ACE MiDAS Training").trim();
  const audience = String(draft.target_audience || "training managers").trim();
  const title = String(draft.title || `${topic} content image`).trim();
  const visual = String(draft.suggested_visual || "A clean professional training image with checklist and passenger transport theme.").trim();
  const style = String(draft.visual_style || "Premium UK training brand, clean editorial layout, dark navy and emerald accents, realistic professional setting.").trim();
  return `Create a polished, ready-to-use ${platform} image for ACE MiDAS Training.\n\nContent theme: ${topic}\nDraft title: ${title}\nTarget audience: ${audience}\nContent type: ${contentType}\n\nVisual direction:\n${visual}\n\nStyle:\n${style}\n\nRequirements:\n- Professional UK training/compliance brand feel.\n- Suitable for schools, councils, SEND transport providers, charities or training managers where relevant.\n- Use clean composition with space for a short headline if text is added later.\n- Avoid fake logos, distorted hands, distorted vehicles, private data, exaggerated stock-photo styling, unsafe transport scenes or hard-to-read text.\n- Do not include unverified claims.\n- Output should feel premium, calm, trustworthy and ready for social media.`;
}

async function generateContentDraft(supabase, payload) {
  const nia = getAgentIdentity("nia");
  const draft = buildNiaContentDraft(payload);
  const { data, error } = await supabase
    .from("content_drafts")
    .insert(draft)
    .select(contentDraftSelect)
    .single();
  if (error) throw error;
  const isWeeklyPlan = draft.content_type === "Weekly content plan";
  await insertAgentLog(supabase, {
    agent_key: "nia",
    agent_name: nia.name,
    agent_role: nia.title,
    action_type: isWeeklyPlan ? "weekly_content_plan_generated" : "content_draft_created",
    action_label: isWeeklyPlan ? "Weekly content plan generated" : "Premium content draft generated",
    summary: `${nia.name} (${nia.title}) created ${isWeeklyPlan ? "a weekly content plan" : "a premium content draft"} for ${draft.platform}.`,
    status: "draft",
    approval_required: false,
    metadata: { content_draft_id: data.id, platform: draft.platform, content_type: draft.content_type, topic: draft.topic, target_audience: draft.target_audience, auto_posted: false, generation_provider: "server-side premium content engine" }
  });
  const refreshed = await getTrainingCompliance(supabase);
  return { success: true, draft: data, contentDrafts: refreshed.contentDrafts, agentLogs: refreshed.agentLogs };
}

async function saveContentDraft(supabase, payload) {
  const nia = getAgentIdentity("nia");
  const draft = payload?.draft || {};
  const row = {
    agent_name: "Nia",
    content_type: String(draft.content_type || "Awareness post").trim(),
    platform: String(draft.platform || "LinkedIn").trim(),
    target_audience: String(draft.target_audience || "training managers").trim(),
    title: String(draft.title || "").trim(),
    content: String(draft.content || "").trim(),
    suggested_visual: String(draft.suggested_visual || "").trim(),
    image_prompt: String(draft.image_prompt || "").trim(),
    visual_style: String(draft.visual_style || "").trim(),
    image_status: String(draft.image_status || "not_started").trim(),
    image_path: draft.image_path || null,
    image_file_name: draft.image_file_name || null,
    call_to_action: String(draft.call_to_action || niaDefaultCta).trim(),
    hashtags: String(draft.hashtags || "").trim(),
    tone: String(draft.tone || "").trim(),
    status: String(draft.status || "draft").trim(),
    topic: String(draft.topic || "").trim(),
    used_at: draft.status === "used" ? draft.used_at || new Date().toISOString() : draft.used_at || null
  };
  if (!row.title || !row.content) throw new Error("Draft title and content are required.");
  const query = draft.id
    ? supabase.from("content_drafts").update(row).eq("id", draft.id)
    : supabase.from("content_drafts").insert(row);
  const { data, error } = await query
    .select(contentDraftSelect)
    .single();
  if (error) throw error;
  await insertAgentLog(supabase, {
    agent_key: "nia",
    agent_name: nia.name,
    agent_role: nia.title,
    action_type: "content_draft_saved",
    action_label: "Content draft saved",
    summary: `${nia.name} (${nia.title}) saved content draft: ${data.title}.`,
    status: data.status || "draft",
    approval_required: false,
    metadata: { content_draft_id: data.id, platform: data.platform, content_type: data.content_type, topic: data.topic }
  });
  const refreshed = await getTrainingCompliance(supabase);
  return { success: true, draft: data, contentDrafts: refreshed.contentDrafts, agentLogs: refreshed.agentLogs };
}

async function markContentDraftUsed(supabase, payload) {
  const nia = getAgentIdentity("nia");
  const id = String(payload?.id || "");
  if (!id) throw new Error("Draft ID is required.");
  const { data, error } = await supabase
    .from("content_drafts")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("id", id)
    .select(contentDraftSelect)
    .single();
  if (error) throw error;
  await insertAgentLog(supabase, {
    agent_key: "nia",
    agent_name: nia.name,
    agent_role: nia.title,
    action_type: "content_draft_marked_used",
    action_label: "Content draft marked as used",
    summary: `${nia.name} (${nia.title}) marked content draft as used: ${data.title}.`,
    status: "used",
    approval_required: false,
    metadata: { content_draft_id: data.id, platform: data.platform, content_type: data.content_type, topic: data.topic }
  });
  const refreshed = await getTrainingCompliance(supabase);
  return { success: true, draft: data, contentDrafts: refreshed.contentDrafts, agentLogs: refreshed.agentLogs };
}

async function deleteContentDraft(supabase, payload) {
  const nia = getAgentIdentity("nia");
  const id = String(payload?.id || "");
  if (!id) throw new Error("Draft ID is required.");
  const { data: existing, error: existingError } = await supabase
    .from("content_drafts")
    .select("id, title, platform, content_type, topic, image_path")
    .eq("id", id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.image_path) {
    const { error: removeError } = await supabase.storage.from(contentAssetBucket).remove([existing.image_path]);
    if (removeError) console.error("Nia image remove on draft delete error:", removeError);
  }
  const { error } = await supabase.from("content_drafts").delete().eq("id", id);
  if (error) throw error;
  await insertAgentLog(supabase, {
    agent_key: "nia",
    agent_name: nia.name,
    agent_role: nia.title,
    action_type: "content_draft_deleted",
    action_label: "Content draft deleted",
    summary: `${nia.name} (${nia.title}) deleted content draft: ${existing?.title || id}.`,
    status: "deleted",
    approval_required: false,
    metadata: { content_draft_id: id, platform: existing?.platform || null, content_type: existing?.content_type || null, topic: existing?.topic || null }
  });
  const refreshed = await getTrainingCompliance(supabase);
  return { success: true, contentDrafts: refreshed.contentDrafts, agentLogs: refreshed.agentLogs };
}

async function logContentDraftCopy(supabase, payload) {
  const nia = getAgentIdentity("nia");
  const id = String(payload?.id || "");
  const title = String(payload?.title || "Content draft").trim();
  await insertAgentLog(supabase, {
    agent_key: "nia",
    agent_name: nia.name,
    agent_role: nia.title,
    action_type: "content_draft_copied",
    action_label: "Content draft copied",
    summary: `${nia.name} (${nia.title}) content draft was copied for admin review: ${title}.`,
    status: "copied",
    approval_required: false,
    metadata: { content_draft_id: id || null, title }
  });
  const refreshed = await getTrainingCompliance(supabase);
  return { success: true, agentLogs: refreshed.agentLogs };
}

async function generateContentImagePrompt(supabase, payload) {
  const nia = getAgentIdentity("nia");
  const draft = payload?.draft || {};
  const id = String(payload?.id || draft.id || "");
  if (!id) throw new Error("Draft ID is required.");
  const imagePrompt = buildNiaImagePrompt(draft);
  const visualStyle = String(draft.visual_style || "Premium UK training brand, clean editorial layout, dark navy and emerald accents, realistic professional setting, bright natural light.").trim();
  const { data, error } = await supabase
    .from("content_drafts")
    .update({ image_prompt: imagePrompt, visual_style: visualStyle, image_status: "prompt_ready" })
    .eq("id", id)
    .select(contentDraftSelect)
    .single();
  if (error) throw error;
  await insertAgentLog(supabase, {
    agent_key: "nia",
    agent_name: nia.name,
    agent_role: nia.title,
    action_type: "image_prompt_generated",
    action_label: "Image prompt generated",
    summary: `${nia.name} (${nia.title}) generated an image prompt for: ${data.title}.`,
    status: "prompt_ready",
    approval_required: false,
    metadata: { content_draft_id: data.id, image_status: data.image_status, no_image_generation_called: true }
  });
  const refreshed = await getTrainingCompliance(supabase);
  return { success: true, draft: data, contentDrafts: refreshed.contentDrafts, agentLogs: refreshed.agentLogs };
}

async function uploadContentDraftImage(supabase, payload) {
  const nia = getAgentIdentity("nia");
  const image = payload?.image || {};
  const id = String(image.content_draft_id || payload?.id || "");
  const fileName = safeFileName(image.file_name || "nia-content-image");
  const fileType = String(image.file_type || "");
  const fileData = String(image.file_data || "");
  if (!id) throw new Error("Content draft ID is required.");
  if (!allowedContentImageTypes.has(fileType)) throw new Error("Only JPG, PNG and WebP image uploads are allowed.");
  if (!fileData) throw new Error("Image file is required.");
  const buffer = Buffer.from(fileData, "base64");
  if (!buffer.length) throw new Error("Image file could not be read.");
  if (buffer.length > 10485760) throw new Error("Image file must be 10MB or smaller.");
  await ensureContentAssetBucket(supabase);
  const filePath = `${id}/${Date.now()}-${fileName}`;
  const { data: existing, error: existingError } = await supabase
    .from("content_drafts")
    .select("id, image_path")
    .eq("id", id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) throw new Error("Content draft was not found.");
  const { error: uploadError } = await supabase.storage.from(contentAssetBucket).upload(filePath, buffer, { contentType: fileType, upsert: false });
  if (uploadError) throw uploadError;
  if (existing.image_path) {
    const { error: removeError } = await supabase.storage.from(contentAssetBucket).remove([existing.image_path]);
    if (removeError) console.error("Old Nia image remove error:", removeError);
  }
  const { data, error } = await supabase
    .from("content_drafts")
    .update({ image_path: filePath, image_file_name: fileName, image_status: "uploaded" })
    .eq("id", id)
    .select(contentDraftSelect)
    .single();
  if (error) throw error;
  await insertAgentLog(supabase, {
    agent_key: "nia",
    agent_name: nia.name,
    agent_role: nia.title,
    action_type: "content_image_uploaded",
    action_label: "Finished image uploaded",
    summary: `${nia.name} (${nia.title}) stored a finished image for: ${data.title}.`,
    status: "uploaded",
    approval_required: false,
    metadata: { content_draft_id: data.id, file_name: fileName, file_type: fileType }
  });
  const refreshed = await getTrainingCompliance(supabase);
  return { success: true, draft: data, contentDrafts: refreshed.contentDrafts, agentLogs: refreshed.agentLogs };
}

async function getContentDraftImageUrl(supabase, payload) {
  const id = String(payload?.id || "");
  const download = payload?.download === true;
  if (!id) throw new Error("Content draft ID is required.");
  const { data: draft, error } = await supabase
    .from("content_drafts")
    .select("id, image_path, image_file_name")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!draft?.image_path) throw new Error("No finished image is attached to this draft.");
  const options = download ? { download: draft.image_file_name || "nia-content-image" } : undefined;
  const { data, error: urlError } = await supabase.storage.from(contentAssetBucket).createSignedUrl(draft.image_path, 300, options);
  if (urlError) throw urlError;
  return { success: true, url: data?.signedUrl || "" };
}

async function deleteContentDraftImage(supabase, payload) {
  const nia = getAgentIdentity("nia");
  const id = String(payload?.id || "");
  if (!id) throw new Error("Content draft ID is required.");
  const { data: draft, error } = await supabase
    .from("content_drafts")
    .select("id, title, image_path")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!draft?.image_path) throw new Error("No finished image is attached to this draft.");
  const { error: removeError } = await supabase.storage.from(contentAssetBucket).remove([draft.image_path]);
  if (removeError) throw removeError;
  const { data, error: updateError } = await supabase
    .from("content_drafts")
    .update({ image_path: null, image_file_name: null, image_status: "prompt_ready" })
    .eq("id", id)
    .select(contentDraftSelect)
    .single();
  if (updateError) throw updateError;
  await insertAgentLog(supabase, {
    agent_key: "nia",
    agent_name: nia.name,
    agent_role: nia.title,
    action_type: "content_image_deleted",
    action_label: "Finished image deleted",
    summary: `${nia.name} (${nia.title}) deleted the finished image for: ${draft.title}.`,
    status: "deleted",
    approval_required: false,
    metadata: { content_draft_id: id }
  });
  const refreshed = await getTrainingCompliance(supabase);
  return { success: true, draft: data, contentDrafts: refreshed.contentDrafts, agentLogs: refreshed.agentLogs };
}

function daysUntil(dateValue, today) {
  if (!dateValue) return null;
  const expiry = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return null;
  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
}

function buildAvaComplianceSummary(compliance) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const nextWeekEnd = new Date(today);
  nextWeekEnd.setDate(today.getDate() + 7);
  const nextMonthEnd = new Date(today);
  nextMonthEnd.setDate(today.getDate() + 30);
  const todayKey = today.toISOString().slice(0, 10);

  const organisations = compliance.organisations || [];
  const members = compliance.members || [];
  const records = compliance.records || [];
  const evidence = compliance.evidence || [];
  const reminders = compliance.reminders || [];
  const reminderLogs = compliance.reminderLogs || [];
  const agentLogs = compliance.agentLogs || [];
  const orgMap = new Map(organisations.map((org) => [org.id, org]));
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const evidenceRecordIds = new Set(evidence.map((item) => item.training_record_id).filter(Boolean));

  const withDays = records.map((record) => ({ ...record, days_until_expiry: daysUntil(record.expiry_date, today), member: memberMap.get(record.member_id) }));
  const expired = withDays.filter((record) => record.days_until_expiry !== null && record.days_until_expiry < 0);
  const expiring7 = withDays.filter((record) => record.days_until_expiry !== null && record.days_until_expiry >= 0 && record.days_until_expiry <= 7);
  const expiring30 = withDays.filter((record) => record.days_until_expiry !== null && record.days_until_expiry >= 0 && record.days_until_expiry <= 30);
  const expiring60 = withDays.filter((record) => record.days_until_expiry !== null && record.days_until_expiry >= 0 && record.days_until_expiry <= 60);
  const expiring90 = withDays.filter((record) => record.days_until_expiry !== null && record.days_until_expiry >= 0 && record.days_until_expiry <= 90);
  const certificatesMissing = withDays.filter((record) => !evidenceRecordIds.has(record.id));
  const certificatesAttached = withDays.filter((record) => evidenceRecordIds.has(record.id));
  const remindersGeneratedToday = reminders.filter((item) => String(item.created_at || "").startsWith(todayKey)).length;
  const remindersSentToday = reminderLogs.filter((log) => String(log.created_at || "").startsWith(todayKey) && log.status === "sent").length;
  const remindersSentWeek = reminderLogs.filter((log) => {
    const created = new Date(log.created_at || "");
    return !Number.isNaN(created.getTime()) && created >= weekStart && created <= weekEnd && log.status === "sent";
  }).length;
  const failedReminders = [...reminders.filter((item) => item.status === "failed"), ...reminderLogs.filter((item) => item.status === "failed")];
  const actionsCompletedToday = agentLogs.filter((log) => String(log.created_at || "").startsWith(todayKey) && ["completed", "sent", "calculated", "referred", "captured", "classified"].includes(String(log.status || ""))).length;
  const newExpiriesThisWeek = withDays.filter((record) => {
    const expiry = new Date(`${record.expiry_date}T00:00:00`);
    return !Number.isNaN(expiry.getTime()) && expiry >= weekStart && expiry <= weekEnd;
  });
  const upcomingNextWeek = withDays.filter((record) => record.days_until_expiry !== null && record.days_until_expiry >= 0 && record.days_until_expiry <= 7);
  const upcomingNextMonth = withDays.filter((record) => record.days_until_expiry !== null && record.days_until_expiry >= 0 && record.days_until_expiry <= 30);
  const certificatesUploadedWeek = evidence.filter((item) => {
    const uploaded = new Date(item.uploaded_at || "");
    return !Number.isNaN(uploaded.getTime()) && uploaded >= weekStart && uploaded <= weekEnd;
  }).length;
  const urgentOrgIds = new Set([...expired, ...expiring7, ...certificatesMissing].map((record) => record.member?.organisation_id).filter(Boolean));
  const urgentOrganisations = [...urgentOrgIds].map((id) => orgMap.get(id)?.name).filter(Boolean).slice(0, 12);
  const organisationsNeedingAttention = urgentOrganisations.length ? urgentOrganisations : ["No urgent organisations identified"];

  return {
    date: todayKey,
    week_range: `${weekStart.toISOString().slice(0, 10)} to ${weekEnd.toISOString().slice(0, 10)}`,
    expired_training: expired.length,
    expiring_within_7_days: expiring7.length,
    expiring_within_30_days: expiring30.length,
    expiring_within_60_days: expiring60.length,
    expiring_within_90_days: expiring90.length,
    certificates_missing: certificatesMissing.length,
    certificates_attached: certificatesAttached.length,
    reminders_generated_today: remindersGeneratedToday,
    reminders_sent_today: remindersSentToday,
    urgent_organisations: urgentOrganisations,
    actions_completed_today: actionsCompletedToday,
    total_records_monitored: records.length,
    total_reminders_sent_this_week: remindersSentWeek,
    new_expiries_this_week: newExpiriesThisWeek.length,
    upcoming_expiries_next_week: upcomingNextWeek.length,
    upcoming_expiries_next_month: upcomingNextMonth.length,
    organisations_needing_attention: organisationsNeedingAttention,
    certificates_uploaded_this_week: certificatesUploadedWeek,
    failed_reminders: failedReminders.length,
    suggested_actions_for_tomorrow: [
      expired.length ? "Start with expired training records before lower-risk refreshers." : "Check the 7-day expiry list first.",
      certificatesMissing.length ? "Close certificate evidence gaps for high-risk organisations." : "Keep certificate uploads current.",
      failedReminders.length ? "Retry or manually follow up failed reminders." : "Review reminder queue health."
    ],
    recommended_priorities_next_week: [
      expiring7.length ? "Prioritise 7-day expiries and any expired records." : "Maintain forward monitoring.",
      expiring30.length ? "Plan refresher conversations for the 30-day expiry group." : "Use the 60/90-day lists for early planning.",
      certificatesUploadedWeek ? "Review newly uploaded certificates for completeness." : "Encourage certificate uploads where records are missing evidence."
    ],
    recommended_actions: [
      expired.length ? "Review expired training records and prioritise refresher planning." : "Keep monitoring expiry dashboard.",
      certificatesMissing.length ? "Request or upload missing certificates for incomplete evidence records." : "Certificate evidence is currently in good shape.",
      failedReminders.length ? "Review failed reminders and contact affected organisations manually if required." : "No failed reminders need immediate action.",
      expiring30.length ? "Plan next week around training records expiring within 30 days." : "No immediate 30-day expiry pressure identified."
    ]
  };
}

function avaSummaryHtml(type, summary) {
  const title = type === "weekly" ? "Ava weekly compliance summary" : "Ava end-of-day compliance summary";
  const urgentOrgs = (summary.urgent_organisations?.length ? summary.urgent_organisations : summary.organisations_needing_attention || []).map((item) => `<li>${item}</li>`).join("");
  const actions = (summary.recommended_actions || []).map((item) => `<li>${item}</li>`).join("");
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 760px; margin: 0 auto;">
      <h1 style="color: #047857;">${title}</h1>
      <p>This is an internal compliance monitoring summary for Marvin/admin. Ava does not email customers.</p>
      <h2>Daily view</h2>
      <ul>
        <li>Expired training: ${summary.expired_training}</li>
        <li>Expiring within 7 days: ${summary.expiring_within_7_days}</li>
        <li>Expiring within 30 days: ${summary.expiring_within_30_days}</li>
        <li>Expiring within 60 days: ${summary.expiring_within_60_days}</li>
        <li>Expiring within 90 days: ${summary.expiring_within_90_days}</li>
        <li>Certificates missing: ${summary.certificates_missing}</li>
        <li>Certificates attached: ${summary.certificates_attached}</li>
        <li>Reminders generated today: ${summary.reminders_generated_today}</li>
        <li>Reminders sent today: ${summary.reminders_sent_today}</li>
        <li>Failed reminders: ${summary.failed_reminders}</li>
        <li>Actions completed today: ${summary.actions_completed_today}</li>
      </ul>
      <h2>Weekly view</h2>
      <ul>
        <li>Total records monitored: ${summary.total_records_monitored}</li>
        <li>Total reminders sent this week: ${summary.total_reminders_sent_this_week}</li>
        <li>New expiries this week: ${summary.new_expiries_this_week}</li>
        <li>Upcoming expiries next week: ${summary.upcoming_expiries_next_week}</li>
        <li>Upcoming expiries next month: ${summary.upcoming_expiries_next_month}</li>
        <li>Certificates uploaded this week: ${summary.certificates_uploaded_this_week}</li>
        <li>Failed reminders: ${summary.failed_reminders}</li>
      </ul>
      <h2>Organisations needing attention</h2>
      <ul>${urgentOrgs}</ul>
      <h2>Recommended actions</h2>
      <ul>${actions}</ul>
      <p>Kind regards,<br />Ava<br />Compliance Agent<br />ACE MiDAS Training</p>
    </div>
  `;
}

async function generateAvaSummary(supabase, payload) {
  const type = String(payload?.type || "daily").toLowerCase() === "weekly" ? "weekly" : "daily";
  const ava = getAgentIdentity("ava");
  const compliance = await getTrainingCompliance(supabase);
  const summary = buildAvaComplianceSummary(compliance);
  const subject = type === "weekly" ? "Ava weekly compliance summary generated" : "Ava daily compliance summary generated";
  const log = await insertAgentLog(supabase, {
    agent_key: "ava",
    agent_name: ava.name,
    agent_role: ava.title,
    action_type: type === "weekly" ? "ava_weekly_summary_generated" : "ava_daily_summary_generated",
    action_label: subject,
    summary: `${ava.name} (${ava.title}) generated an internal ${type} compliance summary for admin review.`,
    status: "generated",
    approval_required: false,
    metadata: { summary_type: type, summary, internal_only: true }
  });
  await insertAuditLog(supabase, {
    actor_name: `${ava.name} - ${ava.title}`,
    action_type: type === "weekly" ? "ava_weekly_summary_generated" : "ava_daily_summary_generated",
    summary: `Ava generated an internal ${type} compliance summary.`,
    status: "generated",
    metadata: { summary_type: type, summary, internal_only: true }
  });
  const refreshed = await getTrainingCompliance(supabase);
  return { success: true, summary, log, agentLogs: refreshed.agentLogs, type };
}

async function sendAvaSummary(supabase, payload) {
  const type = String(payload?.type || "daily").toLowerCase() === "weekly" ? "weekly" : "daily";
  const ava = getAgentIdentity("ava");
  const compliance = await getTrainingCompliance(supabase);
  const summary = buildAvaComplianceSummary(compliance);
  const subject = type === "weekly" ? "Ava weekly compliance summary" : "Ava end-of-day compliance summary";
  const providerResponse = await sendAgentEmail({ to: adminSummaryRecipient, subject, html: avaSummaryHtml(type, summary) });
  const log = await insertAgentLog(supabase, {
    agent_key: "ava",
    agent_name: ava.name,
    agent_role: ava.title,
    action_type: type === "weekly" ? "ava_weekly_summary_sent" : "ava_daily_summary_sent",
    action_label: subject,
    summary: `${ava.name} (${ava.title}) sent an internal ${type} compliance summary to admin.`,
    status: "sent",
    approval_required: false,
    metadata: { summary_type: type, recipient: adminSummaryRecipient, provider_response: providerResponse, summary, internal_only: true }
  });
  await insertAuditLog(supabase, {
    actor_name: `${ava.name} - ${ava.title}`,
    action_type: type === "weekly" ? "ava_weekly_summary_sent" : "ava_daily_summary_sent",
    summary: `Ava sent an internal ${type} compliance summary to admin.`,
    status: "sent",
    metadata: { summary_type: type, recipient: adminSummaryRecipient, summary, internal_only: true }
  });
  const refreshed = await getTrainingCompliance(supabase);
  return { success: true, summary, log, agentLogs: refreshed.agentLogs, recipient: adminSummaryRecipient, type };
}

async function runAvaComplianceCheck(supabase) {
  const ava = getAgentIdentity("ava");
  const compliance = await getTrainingCompliance(supabase);
  const summary = buildAvaComplianceSummary(compliance);
  const riskCategories = [
    { key: "expired_training", label: "Expired training", count: summary.expired_training, status: "urgent" },
    { key: "expiring_7_days", label: "Expiring within 7 days", count: summary.expiring_within_7_days, status: "urgent" },
    { key: "expiring_30_days", label: "Expiring within 30 days", count: summary.expiring_within_30_days, status: "warning" },
    { key: "expiring_60_days", label: "Expiring within 60 days", count: summary.expiring_within_60_days, status: "monitoring" },
    { key: "expiring_90_days", label: "Expiring within 90 days", count: summary.expiring_within_90_days, status: "monitoring" },
    { key: "missing_certificates", label: "Missing certificates", count: summary.certificates_missing, status: "warning" },
    { key: "failed_reminders", label: "Reminder failures", count: summary.failed_reminders, status: "warning" }
  ];
  const logs = [];
  for (const risk of riskCategories.filter((item) => item.count > 0)) {
    const log = await insertAgentLog(supabase, {
      agent_key: "ava",
      agent_name: ava.name,
      agent_role: ava.title,
      action_type: `ava_risk_${risk.key}`,
      action_label: risk.label,
      summary: `${ava.name} (${ava.title}) found ${risk.count} ${risk.label.toLowerCase()} item(s).`,
      status: risk.status,
      approval_required: false,
      metadata: { risk_category: risk.key, count: risk.count, summary, internal_only: true }
    });
    logs.push(log);
  }
  const checkLog = await insertAgentLog(supabase, {
    agent_key: "ava",
    agent_name: ava.name,
    agent_role: ava.title,
    action_type: "ava_compliance_check_completed",
    action_label: "Compliance check completed",
    summary: `${ava.name} (${ava.title}) completed an internal compliance check across ${summary.total_records_monitored} training record(s).`,
    status: "completed",
    approval_required: false,
    metadata: { summary, categories_logged: logs.length, internal_only: true }
  });
  logs.push(checkLog);
  await insertAuditLog(supabase, {
    actor_name: `${ava.name} - ${ava.title}`,
    action_type: "ava_compliance_check_completed",
    summary: "Ava completed an internal compliance risk check.",
    status: "completed",
    metadata: { summary, categories_logged: logs.length, internal_only: true }
  });
  const refreshed = await getTrainingCompliance(supabase);
  return { success: true, summary, logs, agentLogs: refreshed.agentLogs };
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
      "score-prospect": scoreRoryProspect,
      "run-rory-prospect-research": runRoryProspectResearch,
      "import-rory-prospects": importRoryProspects,
      "check-rory-research-run": checkRoryResearchRun,
      "send-prospect-to-mia": sendProspectToMia,
      "preview-prospect-mia-email": previewProspectMiaEmail,
      "mark-prospect-do-not-contact": markProspectDoNotContact,
      "delete-prospect": deleteProspect,
      "save-inbound-message": saveInboundMessage,
      "save-reply-intake": saveReplyIntake,
      "update-reply-approval": updateReplyApproval,
      "send-theo-approved-response": sendTheoApprovedResponse,
      "generate-ava-summary": generateAvaSummary,
      "send-ava-summary": sendAvaSummary,
      "run-ava-compliance-check": runAvaComplianceCheck,
      "run-ava-mia-workflow": runAvaMiaWorkflow,
      "generate-content-draft": generateContentDraft,
      "save-content-draft": saveContentDraft,
      "mark-content-draft-used": markContentDraftUsed,
      "delete-content-draft": deleteContentDraft,
      "log-content-draft-copy": logContentDraftCopy,
      "generate-content-image-prompt": generateContentImagePrompt,
      "upload-content-draft-image": uploadContentDraftImage,
      "get-content-draft-image-url": getContentDraftImageUrl,
      "delete-content-draft-image": deleteContentDraftImage
    };
    if (!actions[action]) return res.status(400).json({ error: "Unknown admin action." });
    const result = await actions[action](supabase, payload);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Admin API error:", error);
    return res.status(500).json({ error: error.message || "Admin action failed." });
  }
}
