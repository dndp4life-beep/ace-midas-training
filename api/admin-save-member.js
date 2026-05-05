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

    const member = req.body?.member || {};
    const id = member.id ? String(member.id) : "";
    const payload = {
      organisation_id: String(member.organisation_id || ""),
      full_name: String(member.full_name || "").trim(),
      email: String(member.email || "").trim(),
      role: String(member.role || "").trim()
    };
    if (!payload.organisation_id || !payload.full_name || !payload.email || !payload.role) {
      return res.status(400).json({ error: "Organisation, staff name, email and role are required." });
    }

    const query = id ? supabase.from("members").update(payload).eq("id", id) : supabase.from("members").insert(payload);
    const { data, error } = await query.select("id, organisation_id, full_name, email, role, created_at").single();
    if (error) {
      console.error("Admin member save error:", error);
      return res.status(500).json({ error: error.message || "Unable to save staff member." });
    }

    return res.status(200).json({ success: true, member: data });
  } catch (error) {
    console.error("Admin member save route error:", error);
    return res.status(500).json({ error: error.message || "Unable to save staff member." });
  }
}
