import { Router } from "express";
import verifyJwt from "../utils/verifyJwt";
import {
  initateShareHandler,
  toggleVisibility,
  shareDownload,
  getShareDetails,
} from "../controllers/shareController";
const shareRoutes = Router();

shareRoutes.route("/:type/:itemId").get(verifyJwt, initateShareHandler);
shareRoutes.route("/toggle").get(verifyJwt, toggleVisibility);
shareRoutes.route("/download/:code/:fileId").post(shareDownload);
shareRoutes.route("/:code").get(getShareDetails);

export default shareRoutes;