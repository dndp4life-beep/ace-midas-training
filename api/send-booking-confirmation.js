// File: api/send-booking-confirmation.js
// Purpose: Sends a customer booking summary email after payment and preferred date selection.
// Requires Vercel Environment Variable: RESEND_API_KEY

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name,
      organisation,
      email,
      phone,
      course,
      delegates,
      location,
      preferredDate1,
      preferredDate2,
      preferredDate3,
      notes
    } = req.body;

    if (!email || !name || !course || !delegates || !location || !preferredDate1) {
      return res.status(400).json({ error: "Missing required booking details" });
    }

    const preferredDatesHtml = [preferredDate1, preferredDate2, preferredDate3]
      .filter(Boolean)
      .map((date, index) => `<li><strong>Choice ${index + 1}:</strong> ${date}</li>`)
      .join("");

    const subject = `Booking Summary – ${course}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 680px; margin: 0 auto;">
        <h1 style="color: #059669;">Booking received ✅</h1>
        <p>Hi ${name},</p>
        <p>Thank you for submitting your preferred training dates. Your payment has been received and your booking details have been recorded.</p>

        <h2>Booking Summary</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Organisation</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${organisation || "Not provided"}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Course</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${course}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Delegates</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${delegates}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Training location</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${location}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Phone</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${phone || "Not provided"}</td></tr>
        </table>

        <h2>Preferred Dates</h2>
        <ul>${preferredDatesHtml}</ul>

        ${notes ? `<h2>Additional Notes</h2><p>${notes}</p>` : ""}

        <p><strong>Please note:</strong> preferred dates are requested dates only. ACE MiDAS Training will review availability and confirm the final training date with you.</p>
        <p>Non-attendance is non-refundable once a confirmed training date has been agreed.</p>

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
        subject,
        html
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend error:", errorText);
      return res.status(500).json({ error: "Unable to send confirmation email" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Booking confirmation email error:", error);
    return res.status(500).json({ error: "Unable to send booking confirmation email" });
  }
}

