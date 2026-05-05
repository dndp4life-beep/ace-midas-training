import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase server configuration is missing." });
    }

    const organisation = req.body?.organisation || {};
    const id = organisation.id ? String(organisation.id) : "";
    const payload = {
      name: String(organisation.name || "").trim(),
      contact_name: String(organisation.contact_name || "").trim(),
      contact_email: String(organisation.contact_email || "").trim(),
      phone: String(organisation.phone || "").trim()
    };

    if (!payload.name) {
      return res.status(400).json({ error: "Organisation name is required." });
    }

    const query = id
      ? supabase.from("organisations").update(payload).eq("id", id)
      : supabase.from("organisations").insert(payload);

    const { data, error } = await query
      .select("id, name, contact_name, contact_email, phone, created_at")
      .single();

    if (error) {
      console.error("Admin organisation save error:", error);
      return res.status(500).json({ error: error.message || "Unable to save organisation." });
    }

    return res.status(200).json({ success: true, organisation: data });
  } catch (error) {
    console.error("Admin organisation route error:", error);
    return res.status(500).json({ error: "Unable to save organisation." });
  }
}
