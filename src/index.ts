import express, { Express, NextFunction } from "express";
import logger, { logEvents } from "./middlewares/logger";
import cookierParser from "cookie-parser";
import errorHandler from "./middlewares/errorHandler";
import dotenv from "dotenv";
import path from "path";
import authRouter from "./routes/authRoutes";
import sequelize from "./utils/database";
import cors from "cors";
import corsOptions from "./utils/corsOptions";
import fileRoutes from "./routes/fileRoutes";
import profileRoute from "./routes/profileRoute";
import paymentRoutes from "./routes/paymentRoute";
import shareRoutes from "./routes/shareRoutes";
import configureStripe from "./utils/stripeconfig";

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 8080;

app.use(logger);
app.use(cors(corsOptions));
app.use(
  (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    console.log(req.originalUrl);
    if (req.originalUrl.includes("/webhook")) {
      next();
    } else {
      express.json()(req, res, next);
    }
  }
);

app.use(express.urlencoded({ extended: true }));
app.use("/", express.static(path.join(__dirname, "public")));
app.use(cookierParser());
app.use("/auth", authRouter);
app.use("/file", fileRoutes);
app.use("/profile", profileRoute);
app.use("/share", shareRoutes);
app.use("/payment", paymentRoutes);
app.use(errorHandler);

sequelize
  .sync()
  .then(() => configureStripe())
  .then((res) => {
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
