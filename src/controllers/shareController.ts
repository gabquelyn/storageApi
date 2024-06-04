import expressAsyncHandler from "express-async-handler";
import { Request, Response } from "express";
import Share from "../model/share";
import FolderMetaData from "../model/foldermetadata";
import { v4 as uuid } from "uuid";
import * as Minio from "minio";
import { CustomRequest } from "../../types";
import FileMetaData from "../model/filemetadata";

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

export const initateShareHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { type, itemId } = req.params;
    const userId = (req as CustomRequest).userId;
    const existingShareLink = await Share.findOne({ where: { type, itemId } });
    if (existingShareLink)
      return res.status(200).json({ ...existingShareLink.dataValues });
    const newShare = await Share.create({
      itemId: +itemId,
      type: type as "file" | "folder",
      userId,
      code: uuid(),
      public: false,
    });
    console.log(newShare);
    return res.status(201).json({ ...newShare.dataValues });
  }
);

export const toggleVisibility = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { type, itemId } = req.params;
    const existingShareLink = await Share.findOne({ where: { type, itemId } });
    if (!existingShareLink)
      return res.status(404).json({ message: "Cannot find item link" });
    existingShareLink.public = !existingShareLink.public;
    await existingShareLink.save();
    return res.status(200).json({ public: existingShareLink.public });
  }
);

export const shareDownload = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { code, fileId } = req.params;
    let fileKey: string;
    const shareDetails = await Share.findOne({ where: { code } });
    if (!shareDetails)
      return res.status(404).json({ messsage: "Invalid link" });

    if (!shareDetails.public) {
      return res.status(403).json({ message: "restricted to access the file" });
    }
    if (shareDetails.type === "folder") {
      // use the fileid to find the file
      const folderDetails = await FolderMetaData.findByPk(shareDetails.itemId);
      if (!folderDetails)
        return res.status(404).json({ message: "Folder not found" });
      const fileDetails = await FileMetaData.findOne({
        where: { folderId: folderDetails.id, id: fileId },
      });
      if (!fileDetails)
        return res.status(404).json({ message: "File not found" });
      fileKey = fileDetails.key;
    }

    const fileDetails = await FileMetaData.findByPk(fileId);
    if (!fileDetails)
      return res.status(404).json({ message: "File not found!" });
    fileKey = fileDetails.key;

    const stat = await minioClient.statObject(
      process.env.BUCKET_NAME!,
      fileKey
    );
    console.log(stat);

    minioClient.getObject(process.env.BUCKET_NAME!, fileKey, (err, stream) => {
      if (err) return res.status(400).json({ message: "Error receiving file" });
      res.setHeader("Content-disposition", `inline; filename=${fileKey}`);
      res.setHeader(
        "Content-type",
        stat.metaData?.["content-type"] || "application/octet-stream"
      );
      stream.pipe(res);
    });
  }
);

export const getShareDetails = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { code } = req.params;
    const shareDetails = await Share.findOne({ where: { code } });
    if (!shareDetails) return res.status(404).json({ message: "Invalid link" });
    if (!shareDetails.public)
      return res.status(403).json({ message: "Protected" });

    if (shareDetails.type === "folder") {
      const allFilesInFolder = await FileMetaData.findAll({
        where: { folderId: shareDetails.itemId },
      });
      return res.status(200).json([...allFilesInFolder]);
    }

    const fileDetails = await FileMetaData.findByPk(shareDetails.itemId);
    return res.status(200).json([{ ...fileDetails?.dataValues }]);
  }
);
