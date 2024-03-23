import { Request } from "express";
interface CustomRequest extends Request {
  email: string;
  userId: string;
}
interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  password: string;
  country?: string;
  verified?: boolean
}

interface TokenAttributes {
  id: ?number;
  userId: number;
  token: string;
  createdAt?: Date;
}
