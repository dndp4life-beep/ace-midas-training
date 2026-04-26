import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const {
      courseTitle,
      quantity,
      unitPrice,
      travelFee,
      total
    } = req.body;

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
            unit_amount: Math.round(unitPrice * 100)
          },
          quantity: quantity
        },

        ...(travelFee > 0
          ? [
              {
                price_data: {
                  currency: "gbp",
                  product_data: {
                    name: "Travel Fee (Outside A406)"
                  },
                  unit_amount: travelFee * 100
                },
                quantity: 1
              }
            ]
          : [])
      ],

      success_url: `${process.env.SITE_URL}/?success=true`,
      cancel_url: `${process.env.SITE_URL}/?cancelled=true`
    });

    res.status(200).json({ url: session.url });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
