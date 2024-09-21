import {model, Schema} from "mongoose";

const CommentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
  },
  { timestamps: true }
);

const Comment = model("Comment", CommentSchema);

export default Comment;
