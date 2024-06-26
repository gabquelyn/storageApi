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
  phone?: string;
  address?: string;
}

interface TokenAttributes {
  id: ?number;
  userId: number;
  token: string;
  createdAt?: Date;
}

interface linkAttributes {
  id: ?number;
  userId: number;
  code: string;
  public: boolean;
  type: "file" | "folder";
  itemId: number;
}

interface SubscriptionAttributes {
  id: ?number;
  userId: number;
  subscriptionId: string;
  active: boolean;
  createdAt?: Date;
  customerId: string;
  subscriptionItemId: string;
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
  totalSize: number;
}
