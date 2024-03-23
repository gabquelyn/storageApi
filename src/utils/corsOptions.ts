import { CorsOptions } from "cors";

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (["http://localhost:3000"].includes(origin as string) || !origin) {
      callback(null, true); //first is error which is null and second allow wich is true
    } else {
      callback(new Error("Not allowed by cors"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

export default corsOptions;
