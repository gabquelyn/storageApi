import express, { Express } from "express";
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
import configureStripe from "./utils/stripeconfig";

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 8080;

app.use(logger);
app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (!req.originalUrl.includes("webhook")) {
    express.json()(req, res, () => {});
    express.urlencoded({ extended: true })(req, res, next); 
  } else {
    next();
  }
});
app.use("/", express.static(path.join(__dirname, "public")));
app.use(cookierParser());
app.use("/auth", authRouter);
app.use("/file", fileRoutes);
app.use("/profile", profileRoute);
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
