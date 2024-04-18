import { Router } from "express";
import {
  postFilesHandler,
  getFilesHandler,
} from "../controllers/fileControllers";
import verifyJwt from "../utils/verifyJwt";
import Multer from "multer"
const upload = Multer()
const fileRoutes = Router();

fileRoutes.use(verifyJwt);
fileRoutes.route("/").post( upload.array('files', 10) ,postFilesHandler);
fileRoutes.route("/:fileId").get(getFilesHandler);
export default fileRoutes;
