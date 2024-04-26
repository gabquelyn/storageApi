import { Request, Response } from "express";
import Stripe from "stripe";
import expressAsyncHandler from "express-async-handler";
import { CustomRequest } from "../../types";
import Subscription from "../model/subscription";
const stripe = new Stripe(process.env.STRIPE_APIKEY!);
export const createCheckoutHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    let customerId;
    const email = (req as CustomRequest).email;
    const existingCustomer = await stripe.customers.list({
      email,
    });
    // create new customer if he/she doesn't exist
    if (existingCustomer.data.length === 0) {
      const newCustomer = await stripe.customers.create({
        email,
      });
      customerId = newCustomer.id;
    }

    const prices = await stripe.prices.list({
      lookup_keys: [req.body.lookup_key],
      expand: ["data.product"],
    });
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: "auto",
      customer: customerId,
      line_items: [
        {
          price: prices.data[0].id,
          // For metered billing, do not pass quantity
          //   quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: { userId: String((req as CustomRequest).userId) },
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${process.env.FRONTEND_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}?canceled=true`,
    });
    res.redirect(303, session.url!);
  }
);

export const webhooksHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    let event = req.body;
    const endpointSecret = "whsec_12345";
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = req.headers["stripe-signature"];
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature!,
          endpointSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err);
        return res.sendStatus(400);
      }
    }
    let subscription;
    let status;
    const subscriberId = event.data.object.metadata.userId;
    const existingSubscriptionDetails = await Subscription.findByPk(
      subscriberId
    );
    // Handle the event different events

    switch (event.type) {
      // when successfully subscribed;
      case "customer.subscription.created":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // create or update subscription of the user.
        if (existingSubscriptionDetails) {
          existingSubscriptionDetails.subscriptionId = subscription.id;
          await existingSubscriptionDetails.save();
        } else {
          await Subscription.create({
            userId: subscriberId,
            subscriptionId: subscription.id,
            active: true,
            customerId: event.data.object.customer,
            usage: 0,
          });
        }
        break;

      case "invoice.created":
        let quantity = 1;
        if (existingSubscriptionDetails) {
          quantity = Math.round(
            existingSubscriptionDetails.usage / (1024 * 1024 * 1024)
          );
        }
        await stripe.subscriptions.update(subscription!.id, {
          items: [
            {
              id: "product_id",
              quantity,
            },
          ],
        });
        break;

      case "invoice.payment_succeeded":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        if (existingSubscriptionDetails) {
          existingSubscriptionDetails.usage = 0;
          await existingSubscriptionDetails.save();
        }
        break;

      case "customer.subscription.deleted":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        if (existingSubscriptionDetails) {
          existingSubscriptionDetails.active = false;
          await existingSubscriptionDetails.save();
        }
        break;

      case "customer.subscription.trial_will_end":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // send mail of ended trial and beggining of billing
        break;

      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }
    // Return a 200 response to acknowledge receipt of the event
    res.send();
  }
);

export const portalHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req as CustomRequest).userId;
    const existingCustomer = await Subscription.findOne({ where: { userId } });
    if (!existingCustomer)
      return res.status(404).json({ message: "Customer does not exist" });
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: existingCustomer.customerId,
      return_url: `${process.env.FRONTEND_URL}/billing`,
    });

    res.redirect(303, portalSession.url);
  }
);
