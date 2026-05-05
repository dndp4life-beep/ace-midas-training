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

    const id = String(req.body?.id || "");
    if (!id) return res.status(400).json({ error: "Training record id is required." });

    const { error } = await supabase.from("training_records").delete().eq("id", id);
    if (error) {
      console.error("Admin training record delete error:", error);
      return res.status(500).json({ error: error.message || "Unable to delete training record." });
    }

    return res.status(200).json({ success: true, id });
  } catch (error) {
    console.error("Admin training record delete route error:", error);
    return res.status(500).json({ error: error.message || "Unable to delete training record." });
  }
}
