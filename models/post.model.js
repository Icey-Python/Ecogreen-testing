import { model, Schema} from "mongoose";
//title, content, creator, likes, comments, saves
const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    squad: {
      type: Schema.Types.ObjectId,
      ref: "Squad",
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
       type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    saves: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    shares:{
      type:Number,
      default:0
    },
    image: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      default: "general"
    },
    tags: [
      {
        type: String,
        default: "general"
      },
    ],
  },
  { timestamps: true }
);

const Post = model("Post", PostSchema);

export default Post;
