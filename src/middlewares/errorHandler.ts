import { Request, Response, NextFunction } from "express";
import { logEvents } from "./logger";
export default function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logEvents(
    `${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
    "errorLog.log"
  );
  console.log(err.stack);
  return res.status(500).json({ error: err.stack });
}
