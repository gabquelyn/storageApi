import expressAsyncHandler from "express-async-handler";
import { Op, where } from "sequelize";
import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "../../types";
import { v4 as uuid } from "uuid";
import FolderMetaData from "../model/foldermetadata";
import FileMetaData from "../model/filemetadata";
import Minio from "minio";

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});


export const postFilesHandler = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const files = req.files;
    const userId = (req as CustomRequest).userId;

    if ((files?.length as number) < 0)
      return res
        .status(400)
        .json({ message: "No file submitted for uploading" });

    for (const file of files as Express.Multer.File[]) {
      const originalname = file.originalname;
      const key = uuid() + originalname;
      const metaData = {
        "Content-Type": file.mimetype,
        "X-Amz-Meta-UserId": userId,
      };
      minioClient.putObject(
        process.env.BUCKET_NAME!,
        key,
        file.buffer,
        file.buffer.length,
        metaData,
        async (err, data) => {
          if (err) return console.log(err);
          const newMetaData = await FileMetaData.create({
            userId,
            size: file.size,
            key,
            originalname,
            mimetype: file.mimetype,
          });
          console.log(`File uploaded ${data}`, newMetaData);
        }
      );
    }
    return res.status(200).json({ message: "Files uploaded" });
  }
);

export const getFilesHandler = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { filename } = req.params;
    const userId = (req as CustomRequest).userId;
    const stat = await minioClient.statObject(
      process.env.BUCKET_NAME!,
      filename
    );
    if (stat.metaData?.["X-Amz-Meta-UserId"] !== userId)
      return res.status(403).json({ message: "Access to file denied" });

    minioClient.getObject(process.env.BUCKET_NAME!, filename, (err, stream) => {
      if (err) return res.status(400).json({ message: "Error receiving file" });
      stream.pipe(res);
    });
  }
);

export const moveFileHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { fileId, folderId } = req.params;
    const userId = (req as CustomRequest).userId;
    const folderMetaData = await FolderMetaData.findByPk(folderId);
    const fileMetaData = await FileMetaData.findByPk(fileId);
    if (!folderMetaData || !fileMetaData)
      return res.status(404).json({ message: "File or Folder not found" });

    if (folderMetaData.id !== userId || fileMetaData.id !== userId)
      return res.status(403).json({ message: "Access denied" });
    fileMetaData.folderId = folderMetaData.id;
    await fileMetaData.save();

    return res.status(200);
  }
);

export const deleteFileHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { fileId } = req.params;
    const fileMetaData = await FileMetaData.findByPk(fileId);
    if (!fileMetaData) return res.status(404);

    await minioClient.removeObject(process.env.BUCKET_NAME!, fileMetaData.key);
    res
      .status(200)
      .json({ message: `Deleted file ${fileMetaData.originalname}` });
  }
);

export const renameFileHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { fileId } = req.params;
    const { newname } = req.body;
    const fileMetaData = await FileMetaData.findByPk(fileId);
    if (!fileMetaData) return res.status(404);

    fileMetaData.originalname = newname;
    await fileMetaData.save();
    return res.status(200);
  }
);

export const getFoldersAndFilesHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req as CustomRequest).userId;
    const folders = await FolderMetaData.findAll({ where: { userId } });
    const files = await FileMetaData.findAll({
      where: {
        userId,
        folderId: -1,
      },
    });

    return res.status(200).json({ folders, files });
  }
);

export const getFolderFilesHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { folderId } = req.params;
    const userId = (req as CustomRequest).userId;
    const files = await FileMetaData.findAll({ where: { userId, folderId } });
    return res.status(200).json([...files]);
  }
);
