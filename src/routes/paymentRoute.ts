import { Router } from "express";
import verifyJwt from "../utils/verifyJwt";
import express from "express";
import {
  createCheckoutHandler,
  webhooksHandler,
  allUsage,
  getSubscription,
} from "../controllers/paymentController";
const paymentRoutes = Router();

// paymentRoutes.use(verifyJwt)
paymentRoutes.route("/create").post(verifyJwt, createCheckoutHandler);
paymentRoutes
  .route("/webhook")
  .post(express.raw({ type: "application/json" }), webhooksHandler);
paymentRoutes.route("/usage").get(verifyJwt, allUsage);
paymentRoutes.route("/subscription").get(verifyJwt, getSubscription);
export default paymentRoutes;
