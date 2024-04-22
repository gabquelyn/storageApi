import { Router } from "express";
import {
  postFilesHandler,
  getFilesHandler,
  moveFileHandler,
  deleteFileHandler,
  renameFileHandler,
  getFolderFilesHandler
} from "../controllers/fileControllers";
import verifyJwt from "../utils/verifyJwt";
import Multer from "multer";
const upload = Multer();
const fileRoutes = Router();

fileRoutes.use(verifyJwt);
fileRoutes.route("/").post(upload.array("files", 10), postFilesHandler).get();
fileRoutes.route("/download/:filename").get(getFilesHandler)
fileRoutes.route('/folder/:folderId').get(getFolderFilesHandler)
fileRoutes.route("/:fileId").delete(deleteFileHandler).post(renameFileHandler)
fileRoutes.route("/move/:fileId/:folderId").post(moveFileHandler);
export default fileRoutes;
