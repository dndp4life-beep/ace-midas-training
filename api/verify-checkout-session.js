import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Stripe is not configured. Missing STRIPE_SECRET_KEY on the server." });
  }

  const sessionId = req.query.session_id;
  if (!sessionId) {
    return res.status(400).json({ error: "Missing Stripe checkout session ID." });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"]
    });

    return res.status(200).json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      mode: session.mode,
      customer_email: session.customer_details?.email || session.customer_email || session.customer?.email || "",
      subscription_status: session.subscription?.status || null
    });
  } catch (error) {
    console.error("Stripe checkout verification error:", error);
    return res.status(500).json({ error: "Unable to verify Stripe checkout session." });
  }
}
