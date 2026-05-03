import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function generateLoginCode() {
  return String(randomInt(100000, 1000000));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email address is required." });

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

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: "Login system is not configured. Please contact ACE MiDAS Training." });
    }

    const code = generateLoginCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from("member_login_codes").update({ used: true }).eq("email", email).eq("used", false);

    const { error: insertError } = await supabase.from("member_login_codes").insert({
      member_id: member.id,
      email,
      code,
      expires_at: expiresAt,
      used: false
    });

    if (insertError) {
      return res.status(500).json({ error: insertError.message || "Unable to create login code." });
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "ACE MiDAS Training <onboarding@resend.dev>",
        to: [email],
        subject: "Your ACE MiDAS Training login code",
        text: `Your secure login code is: ${code}\n\nThis code expires in 10 minutes.`,
        html: `<p>Your secure login code is: <strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`
      })
    });

    if (!resendResponse.ok) {
      await supabase.from("member_login_codes").update({ used: true }).eq("email", email).eq("code", code);
      return res.status(500).json({ error: "Unable to email login code. Please contact ACE MiDAS Training." });
    }

    return res.status(200).json({ success: true, message: "A secure login code has been sent to your approved email address." });
  } catch (error) {
    console.error("Send login code error:", error);
    return res.status(500).json({ error: "Unable to send secure login code." });
  }
}
