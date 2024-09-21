import {Schema, model} from "mongoose";

// moderator id, squad id, role 
const ModeratorSchema = new Schema(
  {
    moderatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    squadId: {
      type: Schema.Types.ObjectId,
      ref: "Squad",
    },
    role: {
      type: String,
      enum: ["mod-members", "mod-post"],
      default: "mod-members",
    },
  },
  { timestamps: true }
);

const Moderator = model("Moderator", ModeratorSchema);
export default Moderator;
