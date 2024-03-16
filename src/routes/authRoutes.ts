import { Router } from "express";
import {
  verifyController,
  loginController,
  logoutController,
  registerController,
} from "../controllers/authController";
const authRouter = Router();
authRouter.route("/").post(loginController);
authRouter.route("/verify").post(verifyController);
authRouter.route("/logout").post(logoutController);
authRouter.route("/register").post(registerController);
export default authRouter