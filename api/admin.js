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

function scheduledDateFromExpiry(expiryDate, daysBefore) {
  const expiry = new Date(`${expiryDate}T09:00:00.000Z`);
  if (Number.isNaN(expiry.getTime())) return null;
  expiry.setUTCDate(expiry.getUTCDate() - daysBefore);
  return expiry;
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
  const [organisationsResult, membersResult, recordsResult] = await Promise.all([
    supabase.from("organisations").select("id, name, contact_name, contact_email, phone, created_at").order("name", { ascending: true }),
    supabase.from("members").select("id, organisation_id, full_name, email, role, created_at").order("full_name", { ascending: true }),
    supabase.from("training_records").select("id, member_id, course_id, date_completed, expiry_date, status, created_at").order("expiry_date", { ascending: true })
  ]);
  const error = organisationsResult.error || membersResult.error || recordsResult.error;
  if (error) throw error;
  return {
    success: true,
    organisations: organisationsResult.data || [],
    members: membersResult.data || [],
    courses,
    records: recordsResult.data || [],
    counts: {
      organisations: organisationsResult.data?.length || 0,
      members: membersResult.data?.length || 0,
      courses: courses.length,
      records: recordsResult.data?.length || 0
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
      "delete-training-record": deleteTrainingRecord
    };
    if (!actions[action]) return res.status(400).json({ error: "Unknown admin action." });
    const result = await actions[action](supabase, payload);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Admin API error:", error);
    return res.status(500).json({ error: error.message || "Admin action failed." });
  }
}
