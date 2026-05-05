import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(500).json({ error: "Supabase server configuration is missing." });

    const record = req.body?.record || {};
    const payload = {
      member_id: String(record.member_id || ""),
      course_id: String(record.course_id || ""),
      date_completed: String(record.date_completed || ""),
      expiry_date: String(record.expiry_date || ""),
      status: String(record.status || "valid")
    };
    if (!payload.member_id || !payload.course_id || !payload.date_completed || !payload.expiry_date) {
      return res.status(400).json({ error: "Staff member, course and completed date are required." });
    }

    const { data, error } = await supabase
      .from("training_records")
      .insert(payload)
      .select("id, member_id, course_id, date_completed, expiry_date, status, created_at")
      .single();

    if (error) {
      console.error("Admin training record save error:", error);
      return res.status(500).json({ error: error.message || "Unable to save training record." });
    }

    return res.status(200).json({ success: true, record: data });
  } catch (error) {
    console.error("Admin training record save route error:", error);
    return res.status(500).json({ error: error.message || "Unable to save training record." });
  }
}
