import { Request, Response, NextFunction } from "express";
// import { CustomRequest } from "../../types";
import jwt from "jsonwebtoken";

interface CustomRequest extends Request {
  email: string;
  userId: string;
}
export default function verifyJwt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader: string | string[] | undefined =
    req.headers?.authorization || req.headers?.Authorization;

  const authValue = authHeader as string;
  if (!authValue?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unaauthorized" });
  }
  const token = authValue.split(" ")[1];
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET!,
    (error: any, decoded: any) => {
      if (error) {
        console.log(error);
        return res.status(403).json({ message: "Forbidden" });
      }

      (req as CustomRequest).userId = decoded.UserInfo.userId;
      (req as CustomRequest).email = decoded.UserInfo.email;
      next();
    }
  );
}
