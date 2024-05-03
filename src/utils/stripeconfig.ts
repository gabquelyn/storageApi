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
    // "whsec_XFv2SwqXE1L8FhnmTHDUf6hz002PduVX"
    const existingWebhook = existingEndpoints.data.find(
      (endpoint) =>
        endpoint.url === `${process.env.STRIPEWEBHOOK_URL}/payment/webhook`
    );

    // const subscriptions = await stripe.subscriptions.list();
    // console.log(subscriptions);

    // subscriptions.data.forEach(async (sub) => {
    // const subscriptions = await stripe.subscriptions.retrieve(
    //   "sub_1PCJE6DyZUus6Ej3EgobUzeQ"
    // );
    // console.log(subscriptions);
    // });

    if (!existingWebhook) {
      const webookREsponse = await stripe.webhookEndpoints.create({
        url: `${process.env.STRIPEWEBHOOK_URL}/payment/webhook`,
        enabled_events: [
          "checkout.session.completed",
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
