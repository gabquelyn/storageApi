import { Router } from "express";
import verifyJwt from "../utils/verifyJwt";
import {
  createCheckoutHandler,
  webhooksHandler,
  allUsage,
  getSubscription,
} from "../controllers/paymentController";
const paymentRoutes = Router();

// paymentRoutes.use(verifyJwt)
paymentRoutes.route("/create").post(verifyJwt, createCheckoutHandler);
paymentRoutes.route("/webhook").post(webhooksHandler);
paymentRoutes.route("/usage").get(verifyJwt, allUsage);
paymentRoutes.route("/subscription").get(verifyJwt, getSubscription);
export default paymentRoutes;
