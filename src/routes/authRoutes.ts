import { Router } from "express";
import {
  verifyController,
  loginController,
  logoutController,
  registerController,
  forgotPasswordController,
  refreshController,
  restPasswordController
} from "../controllers/authController";
const authRouter = Router();
authRouter.route("/").post(loginController);
authRouter.route("/:userId/verify/:token").get(verifyController);
authRouter.route("/logout").post(logoutController);
authRouter.route("/forgot").post(forgotPasswordController);
authRouter.route("/refresh").post(refreshController);
authRouter.route("/register").post(registerController);
authRouter.route("/reset/:token").post(restPasswordController);
export default authRouter;
