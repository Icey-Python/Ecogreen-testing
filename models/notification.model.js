import { Schema, model } from "mongoose";

const notificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type:{
    type: String,
    required: true,
    enum: ["connectionRequest","squadRequest","Event","Activity","Product"]
  },
  from:{
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
}, { timestamps: true });

const Notification = model("Notification", notificationSchema);

export default Notification;
