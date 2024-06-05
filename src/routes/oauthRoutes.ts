import { Router } from "express";
import {
  oauthLoginHandler,
  oauthSignupHandler,
} from "../controllers/oAuthController";
const oauthRoutes = Router();
oauthRoutes.route("/login").post(oauthLoginHandler);
oauthRoutes.route("/register").post(oauthSignupHandler);

export default oauthRoutes;
