import { model, Schema } from "mongoose";

const squadSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User', // Each squad has members who are users
      }],
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    description: {
        type: String,
      },
    admin:{
        type: Schema.Types.ObjectId,
        ref:'User'
    }
  },
  { timestamps: true }
);

const  Squad = model("Squad", squadSchema);

export default Squad;
