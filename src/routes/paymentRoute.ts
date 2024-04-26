import { Router } from "express";
import verifyJwt from "../utils/verifyJwt";
import { createCheckoutHandler } from "../controllers/paymentController";
const paymentRoutes = Router();

// paymentRoutes.use(verifyJwt)
paymentRoutes.route('/create').post(createCheckoutHandler)

export default paymentRoutes