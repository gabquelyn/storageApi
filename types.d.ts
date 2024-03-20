import { Request } from "express";
interface CustomRequest extends Request {
  email: string;
  id: string;
}
interface UserAttributes {
  id?: number;
  firstname?: string;
  lastname?: string;
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
