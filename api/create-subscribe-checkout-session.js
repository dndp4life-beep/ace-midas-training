import Stripe from "stripe";

const DEFAULT_COMPLIANCE_PRICE_ID = "price_1TPmTEEhNF6C4gyi8qr3LDNk";

function getCurrentSiteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || (host?.includes("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return "http://localhost:5173";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Stripe is not configured. Missing STRIPE_SECRET_KEY on the server." });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const siteUrl = getCurrentSiteUrl(req);
    const priceId = process.env.STRIPE_COMPLIANCE_PRICE_ID || DEFAULT_COMPLIANCE_PRICE_ID;
    const productType = req.body?.productType || "onboarding";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      metadata: {
        productType
      },
      success_url: `${siteUrl}/onboarding-success?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${siteUrl}/compliance?payment=cancelled`
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Subscribe checkout session error:", error);
    return res.status(500).json({ error: error.message || "Unable to create Stripe checkout." });
  }
}
