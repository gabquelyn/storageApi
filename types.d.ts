import { Request } from "express";
interface CustomRequest extends Request {
  email: string;
  userId: number;
}
interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  password: string;
  country?: string;
  verified?: boolean;
}

interface TokenAttributes {
  id: ?number;
  userId: number;
  token: string;
  createdAt?: Date;
}
interface FileMetaDataAttribute {
  id?: number;
  userId: number;
  key: string;
  size: number;
  folderId?: number;
  mimetype: string;
  originalname: string;
}

interface FolderMetaDataAttribute {
  id?: number;
  userId: number;
  foldername: string;
}
