import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { courseTitle, quantity, unitPrice, travelFee } = req.body;
    const line_items = [{ price_data: { currency: "gbp", product_data: { name: courseTitle }, unit_amount: Math.round(Number(unitPrice) * 100) }, quantity: Number(quantity) }];
    if (Number(travelFee) > 0) line_items.push({ price_data: { currency: "gbp", product_data: { name: "Travel Fee - Outside A406" }, unit_amount: Math.round(Number(travelFee) * 100) }, quantity: 1 });
    const session = await stripe.checkout.sessions.create({ mode: "payment", payment_method_types: ["card"], line_items, success_url: `${process.env.SITE_URL}?payment=success`, cancel_url: `${process.env.SITE_URL}?payment=cancelled` });
    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
