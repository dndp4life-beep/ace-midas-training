import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function cleanMember(member) {
  return {
    id: member.id,
    organisation: member.organisation,
    contact_name: member.contact_name,
    email: member.email,
    username: member.username,
    subscription_status: member.subscription_status,
    onboarding_status: member.onboarding_status,
    med_app_status: member.med_app_status,
    journey_app_status: member.journey_app_status,
    med_app_url: member.med_app_url,
    journey_app_url: member.journey_app_url
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    if (!email || !code) return res.status(400).json({ error: "Email and code are required." });

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return res.status(500).json({ error: "Login system is not configured. Please contact ACE MiDAS Training." });
    }

    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, organisation, contact_name, email, username, subscription_status, onboarding_status, is_active, med_app_status, journey_app_status, med_app_url, journey_app_url")
      .eq("email", email)
      .maybeSingle();

    if (memberError) {
      return res.status(500).json({ error: memberError.message || "Unable to check member access." });
    }

    if (!member || member.is_active !== true || member.subscription_status !== "Active") {
      return res.status(403).json({ error: "Access is not active for this email. Please contact ACE MiDAS Training." });
    }

    const { data: loginCode, error: codeError } = await supabase
      .from("member_login_codes")
      .select("id, expires_at, used")
      .eq("email", email)
      .eq("code", code)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeError) {
      return res.status(500).json({ error: codeError.message || "Unable to verify login code." });
    }

    if (!loginCode || loginCode.used === true) {
      return res.status(401).json({ error: "Code incorrect" });
    }

    if (new Date(loginCode.expires_at).getTime() <= Date.now()) {
      await supabase.from("member_login_codes").update({ used: true }).eq("id", loginCode.id);
      return res.status(401).json({ error: "Code expired" });
    }

    await supabase.from("member_login_codes").update({ used: true }).eq("id", loginCode.id);

    return res.status(200).json({ success: true, member: cleanMember(member) });
  } catch (error) {
    console.error("Verify login code error:", error);
    return res.status(500).json({ error: "Unable to verify login code." });
  }
}
