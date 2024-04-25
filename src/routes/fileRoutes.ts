import { Router } from "express";
import {
  postFilesHandler,
  getFilesHandler,
  moveFileHandler,
  deleteFileHandler,
  renameFileHandler,
  getFolderFilesHandler,
  getFoldersAndFilesHandler,
  createFolderHandler,
  deleteFolder,
} from "../controllers/fileControllers";
import verifyJwt from "../utils/verifyJwt";
import Multer from "multer";
const upload = Multer();
const fileRoutes = Router();

fileRoutes.use(verifyJwt);
fileRoutes
  .route("/")
  .post(upload.array("files", 10), postFilesHandler)
  .get(getFoldersAndFilesHandler);
fileRoutes.route("/newfolder").post(createFolderHandler);
fileRoutes.route("/download/:filename").get(getFilesHandler);
fileRoutes
  .route("/folder/:folderId")
  .get(getFolderFilesHandler)
  .delete(deleteFolder);
fileRoutes.route("/:fileId").delete(deleteFileHandler);
fileRoutes.route("/move/:fileId/:folderId").post(moveFileHandler);
export default fileRoutes;
