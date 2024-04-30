import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_APIKEY!);
export default async function configureStripe() {
  try {
    const existingEndpoints = await stripe.webhookEndpoints.list({ limit: 1 });
    const products = await stripe.products.list({});
    const productExisting = products.data.find(
      (product) => product.name === process.env.PRODUCT_NAME
    );

    if (!productExisting) {
      const productCreationRes = await stripe.products.create({
        name: process.env.PRODUCT_NAME!,
        description: "Approximate cost per GB disk space.",
      });

      const pricesCreationRes = await stripe.prices.create({
        product: productCreationRes.id,
        unit_amount: 200,
        currency: "usd",
        recurring: {
          interval: "month",
          usage_type: "metered",
        },
      });
      console.log(productCreationRes, pricesCreationRes);
    }
    // webhook secret
    // "whsec_gT9EQEsYQTTNfqovTZp8PkhV1wEe9TNs"
    const existingWebhook = existingEndpoints.data.find(
      (endpoint) =>
        endpoint.url === `${process.env.STRIPEWEBHOOK_URL}/payment/webhook`
    );
    console.log(existingWebhook?.secret);
    if (!existingWebhook) {
      const webookREsponse = await stripe.webhookEndpoints.create({
        url: `${process.env.STRIPEWEBHOOK_URL}/payment/webhook`,
        enabled_events: [
          "customer.subscription.created",
          "invoice.created",
          "invoice.payment_succeeded",
          "customer.subscription.deleted",
          "customer.subscription.trial_will_end",
        ],
      });
      console.log(webookREsponse);
    }
  } catch (err) {
    return console.log(err);
  }
}
