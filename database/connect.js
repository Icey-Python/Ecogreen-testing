import mongoose from "mongoose";
import { Logger } from "borgen";
import { Config } from "../lib/config.js";

mongoose.set("strictQuery", true);

const connectDB = (startServer) => {
  mongoose
    .connect(Config.MONGO_URI)
    .then(() => {
      Logger.info({
        message: "Connected to the DB...",
        messageColor: "greenBright",
        infoColor: "gray",
      });

      startServer()
    })
    .catch((err) => {
      Logger.error({ message: "connectDb" + err.message });
    });
};

export default connectDB;
