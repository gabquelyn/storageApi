import { Router } from "express";
import verifyJwt from "../utils/verifyJwt";
import {
  getProfileHandler,
  updateProfileHandler,
} from "../controllers/profileController";
const profileRoute = Router();
profileRoute.use(verifyJwt);
profileRoute.route("/").get(getProfileHandler).post(updateProfileHandler);

export default profileRoute;
