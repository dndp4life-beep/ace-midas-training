import Stripe from "stripe";

const DEFAULT_SITE_URL = "https://www.ace-midas-training.co.uk";

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function getCurrentSiteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || (host?.includes("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return DEFAULT_SITE_URL;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Stripe is not configured. Missing STRIPE_SECRET_KEY." });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const {
      courseTitle,
      quantity,
      unitPrice,
      baseCourseUnitPrice,
      courseUnitPrice,
      courseSubtotal,
      discountPercent,
      subtotal,
      travelFee,
      total,
      addOnSelected,
      addOnName,
      addOnUnitPrice,
      addOnSubtotal,
      outsideA406,
      agreementAccepted,
      productType
    } = req.body;

    if (!agreementAccepted) {
      return res.status(400).json({ error: "Booking agreement must be accepted before payment." });
    }

    const delegateQuantity = Number(quantity);
    const delegateUnitPrice = Number(unitPrice);
    const bookingSubtotal = roundMoney(subtotal);
    const bookingTravelFee = roundMoney(travelFee || 0);
    const bookingTotal = roundMoney(total);

    if (!courseTitle || !Number.isFinite(delegateQuantity) || delegateQuantity < 1 || !Number.isFinite(delegateUnitPrice) || delegateUnitPrice < 1 || !Number.isFinite(bookingTotal) || bookingTotal < 1) {
      return res.status(400).json({ error: "Invalid booking payment details." });
    }

    const calculatedSubtotal = roundMoney(delegateUnitPrice * delegateQuantity);
    const calculatedTotal = roundMoney(calculatedSubtotal + bookingTravelFee);

    if (Math.abs(bookingSubtotal - calculatedSubtotal) > 0.01 || Math.abs(bookingTotal - calculatedTotal) > 0.01) {
      return res.status(400).json({ error: "Booking total does not match the calculated price." });
    }

    const safeAddOnName = addOnSelected && addOnName ? String(addOnName).slice(0, 120) : "";
    const courseLineName = safeAddOnName ? `${courseTitle} + ${safeAddOnName} (${quantity} delegates)` : `${courseTitle} (${quantity} delegates)`;

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
              name: courseLineName
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
        baseCourseUnitPrice: baseCourseUnitPrice ? String(baseCourseUnitPrice) : "",
        courseUnitPrice: courseUnitPrice ? String(courseUnitPrice) : "",
        courseSubtotal: courseSubtotal ? String(courseSubtotal) : "",
        discountPercent: discountPercent ? String(discountPercent) : "0",
        subtotal: String(bookingSubtotal),
        travelFee: String(bookingTravelFee),
        total: String(bookingTotal),
        addOnSelected: String(Boolean(addOnSelected)),
        addOnName: safeAddOnName,
        addOnUnitPrice: addOnUnitPrice ? String(addOnUnitPrice) : "0",
        addOnSubtotal: addOnSubtotal ? String(addOnSubtotal) : "0",
        outsideA406: String(Boolean(outsideA406)),
        agreementAccepted: String(Boolean(agreementAccepted)),
        productType: isOnboardingProduct ? "onboarding" : "training"
      },

      success_url: `${siteUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${siteUrl}${cancelPath}?payment=cancelled`
    });

    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("Stripe checkout error:", error);
    return res.status(500).json({ error: error.message || "Unable to create checkout session" });
  }
}
