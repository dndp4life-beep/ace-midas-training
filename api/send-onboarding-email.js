// Sends the post-subscription onboarding email.
// Requires Vercel Environment Variable: RESEND_API_KEY

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(200).json({
      success: false,
      skipped: true,
      message: "RESEND_API_KEY is not configured. Onboarding was saved but no email was sent."
    });
  }

  try {
    const { organisation, contact_name, email, phone, plan } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Missing customer email address" });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 680px; margin: 0 auto;">
        <h1 style="color: #059669;">Your ACE Compliance Hub access is being set up</h1>
        <p>Hi ${contact_name || "there"},</p>
        <p>Thank you for subscribing to the ACE Compliance Hub setup package.</p>
        <p>Your payment has secured access to the £495 setup package, including preparation for the compliance tools your organisation needs.</p>

        <h2>What happens next</h2>
        <ul>
          <li>ACE MiDAS Training will review your onboarding details.</li>
          <li>Your compliance access will be configured for ${organisation || "your organisation"}.</li>
          <li>You will use secure email or phone verification to access the member area.</li>
          <li>No plain text passwords are sent or stored by email.</li>
        </ul>

        <p>If you have not completed onboarding yet, please return to the member welcome page and submit your setup details.</p>

        <h2>Purchase summary</h2>
        <p><strong>Product:</strong> ${plan || "Compliance Hub Setup"}</p>
        <p><strong>Support contact:</strong> info@ace-midas-training.co.uk</p>
        ${phone ? `<p><strong>Phone provided:</strong> ${phone}</p>` : ""}

        <p>Kind regards,<br />ACE MiDAS Training</p>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "ACE MiDAS Training <onboarding@resend.dev>",
        to: [email],
        bcc: ["info@ace-midas-training.co.uk"],
        subject: "Your ACE Compliance Hub access is being set up",
        html
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend onboarding error:", errorText);
      return res.status(500).json({ error: "Unable to send onboarding email" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Onboarding email error:", error);
    return res.status(500).json({ error: "Unable to send onboarding email" });
  }
}
