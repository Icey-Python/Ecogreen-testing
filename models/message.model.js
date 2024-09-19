import { model, Schema } from "mongoose";

const MessageSchema = new Schema(
  {
   message : {
    type : String,
    required: true,
   },
   sender : {
        type :Schema.Types.ObjectId,
        required: true,
   }
  },
  { timestamps: true }
);

const Message = model("Message", MessageSchema);

export default Message;
