import expressAsyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "../../types";
import { v4 as uuid } from "uuid";
import FolderMetaData from "../model/foldermetadata";
import FileMetaData from "../model/filemetadata";
import * as Minio from "minio";
import sequelize from "../utils/database";
import Subscription from "../model/subscription";
import Stripe from "stripe";
import Share from "../model/share";

const stripe = new Stripe(process.env.STRIPE_APIKEY!);
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

minioClient.bucketExists(process.env.BUCKET_NAME!, function (err, exists) {
  if (!exists) {
    console.log("Creating bucket...");
    minioClient.makeBucket(
      process.env.BUCKET_NAME!,
      "us-east-1",
      function (err) {
        if (err) return console.log("Error creating bucket.", err);
        console.log('Bucket created successfully in "us-east-1".');
      }
    );
  }
});

export const postFilesHandler = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const files = req.files;
    const { folderId } = req.body;
    const userId = (req as CustomRequest).userId;
    const userSubscription = await Subscription.findOne({
      where: { userId },
    });

    // if (!userSubscription || !userSubscription.active) {
    //   return res.status(402).json({ message: "Subscription required!" });
    // }

    const folderExist = await FolderMetaData.findByPk(folderId);
    if ((files?.length as number) < 0)
      return res
        .status(400)
        .json({ message: "No file submitted for uploading" });

    try {
      let totalFileSize: number = 0;
      const uploadPromises = (files as Express.Multer.File[]).map(
        async (file) => {
          const originalname = file.originalname;
          const key = uuid() + originalname;
          const metaData = {
            "Content-Type": file.mimetype,
            "X-Amz-Meta-UserId": userId,
          };

          // Create a promise to wrap the call to minioClient.putObject
          const putObjectPromise = new Promise<void>((resolve, reject) => {
            minioClient.putObject(
              process.env.BUCKET_NAME!,
              key,
              file.buffer,
              file.size, // Length parameter (optional)
              metaData,
              (err, data) => {
                if (err) {
                  console.error(`Error uploading file ${originalname}:`, err);
                  reject(err);
                } else {
                  console.log(`File uploaded ${data}`);
                  resolve();
                }
              }
            );
          });

          // Wait for the putObject operation to complete
          await putObjectPromise;
          // create the usage record for stripe
          totalFileSize += file.size;
          // Create file metadata
          await FileMetaData.create({
            userId,
            size: file.size,
            key,
            originalname,
            folderId: folderExist && folderExist.userId ? folderId : -1,
            mimetype: file.mimetype,
          });

          console.log(`File uploaded: ${key}`);
        }
      );

      // Wait for all uploads and metadata creations to complete
      await Promise.all(uploadPromises);

      // calculate metered usage
      // const usageRes = await stripe.subscriptionItems.createUsageRecord(
      //   userSubscription.subscriptionItemId,
      //   {
      //     quantity: Math.round(totalFileSize / 1024),
      //     timestamp: "now",
      //   }
      // );
      // console.log(usageRes);
      // Update folder totalSize
      if (folderExist && folderExist.userId === userId) {
        folderExist.totalSize += totalFileSize;
        console.log(totalFileSize);
        await folderExist.save();
      }
    } catch (err) {
      console.log(err);
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
    console.log(stat);
    if (stat.metaData?.["userid"] != userId)
      return res.status(403).json({ message: "Access to file denied" });

    minioClient.getObject(process.env.BUCKET_NAME!, filename, (err, stream) => {
      if (err) return res.status(400).json({ message: "Error receiving file" });
      res.setHeader("Content-disposition", `inline; filename=${filename}`);
      res.setHeader(
        "Content-type",
        stat.metaData?.["content-type"] || "application/octet-stream"
      );
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
    folderMetaData.totalSize += fileMetaData.size;
    await fileMetaData.save();
    await folderMetaData.save();
    return res.status(200);
  }
);

export const deleteFileHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { fileId } = req.params;
    const fileMetaData = await FileMetaData.findByPk(fileId);
    if (!fileMetaData) return res.status(404);
    if (fileMetaData.folderId != -1) {
      const existInfolder = await FolderMetaData.findByPk(
        fileMetaData.folderId
      );
      if (existInfolder) {
        existInfolder.totalSize -= fileMetaData.size;
        await existInfolder.save();
      }
    }

    const shareLink = await Share.findOne({
      where: { itemId: fileId, type: "file" },
    });
    await shareLink?.destroy();
    if (!fileMetaData) return res.status(404);
    await fileMetaData.destroy();

    await minioClient.removeObject(process.env.BUCKET_NAME!, fileMetaData.key);
    res
      .status(200)
      .json({ message: `Deleted file ${fileMetaData.originalname}` });
  }
);

export const deleteFolder = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { folderId } = req.params;
    const containFiles = await FileMetaData.findOne({ where: { folderId } });
    if (containFiles)
      return res.status(400).json({ message: "Folder contanis files" });
    const folderMetaData = await FolderMetaData.findByPk(folderId);
    await folderMetaData?.destroy();
    return res.status(200).json({ message: "deleted folder" });
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
    const folders = await FolderMetaData.findAll({
      where: { userId },
      order: [[sequelize.literal("foldername"), "ASC"]],
    });
    const files = await FileMetaData.findAll({
      where: {
        userId,
        folderId: -1,
      },
      order: [[sequelize.literal("originalname"), "ASC"]],
    });

    return res.status(200).json({ folders, files });
  }
);

export const getFolderFilesHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { folderId } = req.params;
    const existingFolder = await FolderMetaData.findByPk(folderId);
    if (!existingFolder) return res.status(404);
    const userId = (req as CustomRequest).userId;
    const files = await FileMetaData.findAll({ where: { userId, folderId } });
    return res
      .status(200)
      .json({ files: [...files], foldername: existingFolder.foldername });
  }
);


// rremoverer

export const createFolderHandler = expressAsyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { foldername } = req.body;
    const userId = (req as CustomRequest).userId;

    const isExisting = await FolderMetaData.findOne({
      where: { foldername, userId },
    });
    if (isExisting)
      return res.status(400).json({ message: "Folder already exists" });
    await FolderMetaData.create({
      foldername,
      userId: (req as CustomRequest).userId,
      totalSize: 0,
    });

    return res.status(201).json({ message: "Folder created successfully!" });
  }
);
