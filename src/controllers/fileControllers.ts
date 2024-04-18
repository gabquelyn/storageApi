import expressAsyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "../../types";
import { v4 as uuid } from "uuid";
import FileMetaData from "../model/filemetadata";
import Minio from "minio";

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: 9000,
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
