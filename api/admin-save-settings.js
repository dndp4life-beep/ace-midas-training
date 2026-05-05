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

    const settings = req.body?.settings;
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      return res.status(400).json({ error: "Settings payload is required." });
    }

    const savedAt = new Date().toISOString();
    const { error } = await supabase
      .from("site_settings")
      .upsert({
        setting_key: "business_settings",
        setting_value: settings,
        updated_at: savedAt
      }, { onConflict: "setting_key" });

    if (error) {
      console.error("Admin settings save error:", error);
      return res.status(500).json({ error: error.message || "Unable to save settings." });
    }

    const { data, error: readError } = await supabase
      .from("site_settings")
      .select("id, setting_key, setting_value, updated_at")
      .eq("setting_key", "business_settings")
      .maybeSingle();

    if (readError) {
      console.error("Admin settings read-back error:", readError);
      return res.status(500).json({ error: readError.message || "Save could not be verified." });
    }

    if (!data?.setting_value) {
      return res.status(500).json({ error: "Save could not be verified." });
    }

    return res.status(200).json({ success: true, settings: data.setting_value, updated_at: data.updated_at || savedAt });
  } catch (error) {
    console.error("Admin settings route error:", error);
    return res.status(500).json({ error: "Unable to save settings." });
  }
}
