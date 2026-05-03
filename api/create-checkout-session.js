import Stripe from "stripe";

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

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Stripe is not configured. Missing STRIPE_SECRET_KEY." });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const {
      courseTitle,
      quantity,
      unitPrice,
      subtotal,
      travelFee,
      total,
      outsideA406,
      agreementAccepted,
      productType
    } = req.body;

    if (!agreementAccepted) {
      return res.status(400).json({ error: "Booking agreement must be accepted before payment." });
    }

    const delegateQuantity = Number(quantity);
    const delegateUnitPrice = Number(unitPrice);
    const bookingSubtotal = Number(subtotal);
    const bookingTravelFee = Number(travelFee || 0);
    const bookingTotal = Number(total);

    if (!courseTitle || !Number.isFinite(delegateQuantity) || delegateQuantity < 1 || !Number.isFinite(delegateUnitPrice) || delegateUnitPrice < 1 || !Number.isFinite(bookingTotal) || bookingTotal < 1) {
      return res.status(400).json({ error: "Invalid booking payment details." });
    }

    const calculatedSubtotal = delegateUnitPrice * delegateQuantity;
    const calculatedTotal = calculatedSubtotal + bookingTravelFee;

    if (bookingSubtotal !== calculatedSubtotal || bookingTotal !== calculatedTotal) {
      return res.status(400).json({ error: "Booking total does not match the calculated price." });
    }

    const siteUrl = getCurrentSiteUrl(req);
    const normalizedProductType = String(productType || "").toLowerCase();
    const isOnboardingProduct = ["subscription", "onboarding"].includes(normalizedProductType) || (!normalizedProductType && (bookingTotal === 495 || bookingTotal === 1200));
    const successPath = isOnboardingProduct ? "/onboarding-success" : "/booking-success";
    const cancelPath = isOnboardingProduct ? "/compliance" : "/training";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `${courseTitle} (${quantity} delegates)`
            },
            unit_amount: Math.round(delegateUnitPrice * 100)
          },
          quantity: delegateQuantity
        },

        ...(bookingTravelFee > 0
          ? [
              {
                price_data: {
                  currency: "gbp",
                  product_data: {
                    name: "Travel Fee (Outside A406)"
                  },
                  unit_amount: Math.round(bookingTravelFee * 100)
                },
                quantity: 1
              }
            ]
          : [])
      ],

      metadata: {
        courseTitle,
        quantity: String(delegateQuantity),
        unitPrice: String(delegateUnitPrice),
        subtotal: String(bookingSubtotal),
        travelFee: String(bookingTravelFee),
        total: String(bookingTotal),
        outsideA406: String(Boolean(outsideA406)),
        agreementAccepted: String(Boolean(agreementAccepted)),
        productType: isOnboardingProduct ? "onboarding" : "training"
      },

      success_url: `${siteUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${siteUrl}${cancelPath}?payment=cancelled`
    });

    res.status(200).json({ url: session.url });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
