import express, { Express, Request, Response } from "express";
import logger, { logEvents } from "./middlewares/logger";
import cookierParser from "cookie-parser";
import errorHandler from "./middlewares/errorHandler";
import dotenv from "dotenv";
import path from "path";
import authRouter from "./routes/authRoutes";
import sequelize from "./utils/database";
import cors from "cors"
import corsOptions from "./utils/corsOptions";

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 8080;
app.use(logger);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", express.static(path.join(__dirname, "public")));
app.use(cookierParser());

app.use("/auth", authRouter);
app.use("/", (req: Request, res: Response) => {
  return res.status(200).json({ message: "Welcome to server" });
});

app.use(errorHandler);

sequelize
  .sync()
  .then((res) => {
    // console.log(res);
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
    logEvents(
      `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
      "mySqlLog.log"
    );
  });
