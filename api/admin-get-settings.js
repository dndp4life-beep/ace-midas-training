import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
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

    const { data, error } = await supabase
      .from("site_settings")
      .select("setting_value, updated_at")
      .eq("setting_key", "business_settings")
      .maybeSingle();

    if (error) {
      console.error("Admin settings fetch error:", error);
      return res.status(500).json({ error: error.message || "Unable to fetch settings." });
    }

    return res.status(200).json({ success: true, settings: data?.setting_value || null, updated_at: data?.updated_at || null });
  } catch (error) {
    console.error("Admin settings fetch route error:", error);
    return res.status(500).json({ error: "Unable to fetch settings." });
  }
}
