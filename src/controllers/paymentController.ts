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
    // create new customer doesn't exist
    if (existingCustomer.data.length === 0) {
      const newCustomer = await stripe.customers.create({
        email,
      });
      customerId = newCustomer.id;
    }

    const prices = await stripe.prices.list({
      expand: ["data.product"],
    });

    const productPrices = prices.data.find(
      (price) =>
        (price.product as Stripe.Product).name === process.env.PRODUCT_NAME
    );

    const session = await stripe.checkout.sessions.create({
      billing_address_collection: "auto",
      customer: customerId,
      line_items: [
        {
          price: productPrices!.id,
          // For metered billing, do not pass quantity
          //   quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: { userId: String((req as CustomRequest).userId) },
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${process.env.FRONTEND_URL}/dashboard/?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?canceled=true`,
    });
    console.log(session);
    return res.status(200).json({ ...session });
    // res.redirect(303, session.url!);
  }
);

export const webhooksHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    let event = req.body;
    console.log("Called the weebhook!");
    if (process.env.ENDPOINT_SECRET) {
      // Get the signature sent by Stripe
      const signature = req.headers["stripe-signature"];

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature!,
          process.env.ENDPOINT_SECRET
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err);
        return res.sendStatus(400);
      }
    }
    let subscription;
    let status;
    const subscriberId = event.data.object.metadata.userId;
    console.log(event.data.object);
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
          const prices = await stripe.prices.list({
            expand: ["data.product"],
          });

          const productPrices = prices.data.find(
            (price) =>
              (price.product as Stripe.Product).name ===
              process.env.PRODUCT_NAME
          );
          let subscriptionItemId;
          const allSubscriptionItem = await stripe.subscriptionItems.list({
            subscription: subscription.id,
          });

          const existingSubscriptionItem = allSubscriptionItem.data.find(
            (item) => item.price.id === productPrices?.id
          );

          if (!existingSubscriptionItem) {
            const subscriptionItem = await stripe.subscriptionItems.create({
              subscription: subscription.id,
              price: productPrices!.id,
            });
            console.log(subscriptionItem);
            subscriptionItemId = subscriptionItem.id;
          } else {
            subscriptionItemId = existingSubscriptionItem.id;
          }

          const res = await Subscription.create({
            userId: subscriberId,
            subscriptionId: subscription.id,
            active: true,
            customerId: event.data.object.customer,
            subscriptionItemId,
          });
          console.log(res);
        }
        break;

      case "invoice.created":
        // the date of billing cycle
        const currentDate = new Date();
        const subscriptionDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          currentDate.getDate()
        );

        // convert to Unix object as the usage records
        const currentDateTimeStamp = Math.floor(currentDate.getTime() / 1000);
        const subscriptionDateTimeStamp = Math.floor(
          subscriptionDate.getTime() / 1000
        );

        // const allMonthlyUsage = stripe.subscriptionItems.retrieve(existingSubscriptionDetails!.subscriptionItemId, {expand: []})

        console.log("invoice created");

        break;

      case "invoice.payment_succeeded":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
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

export const allUsage = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userSub = await Subscription.findOne({
      where: { userId: (req as CustomRequest).userId },
    });
    if (!userSub)
      return res
        .status(404)
        .json({ message: "No usage record for non subscribers" });
    const subscriptions = await stripe.subscriptionItems.list({
      subscription: userSub.subscriptionItemId,
    });
    return res.status(200).json([...subscriptions.data]);
  }
);

export const getSubscription = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const subscriptionDetails = await Subscription.findOne({
      where: { userId: (req as CustomRequest).userId },
    });
    res.status(200).json({ ...subscriptionDetails });
  }
);
