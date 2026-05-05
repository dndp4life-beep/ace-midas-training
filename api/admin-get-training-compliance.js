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

async function ensureCourses(supabase) {
  const { data, error } = await supabase
    .from("courses")
    .select("id, name, validity_months, created_at")
    .order("name", { ascending: true });

  if (error) throw error;
  if (data?.length) return data;

  const { data: seeded, error: seedError } = await supabase
    .from("courses")
    .insert(defaultCourses)
    .select("id, name, validity_months, created_at");

  if (seedError) throw seedError;
  return (seeded || []).sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase server configuration is missing." });
    }

    const courses = await ensureCourses(supabase);
    const [organisationsResult, membersResult, recordsResult] = await Promise.all([
      supabase.from("organisations").select("id, name, contact_name, contact_email, phone, created_at").order("name", { ascending: true }),
      supabase.from("members").select("id, organisation_id, full_name, email, role, created_at").order("full_name", { ascending: true }),
      supabase.from("training_records").select("id, member_id, course_id, date_completed, expiry_date, status, created_at").order("expiry_date", { ascending: true })
    ]);

    const error = organisationsResult.error || membersResult.error || recordsResult.error;
    if (error) {
      console.error("Admin compliance fetch error:", error);
      return res.status(500).json({ error: error.message || "Unable to load training compliance data." });
    }

    return res.status(200).json({
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
    });
  } catch (error) {
    console.error("Admin compliance fetch route error:", error);
    return res.status(500).json({ error: error.message || "Unable to load training compliance data." });
  }
}
