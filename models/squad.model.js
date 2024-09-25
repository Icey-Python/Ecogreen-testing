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
    requestedMembers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    moderators: [
      {
        type: Schema.Types.ObjectId,
        ref: "Moderator",
      },
    ],
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
    },
    percentageAchieved:{
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    carbonCalculatorData:{
      type: Schema.Types.ObjectId,
      ref: 'CarbonCalculator',
    }
  },
  { timestamps: true }
);

const  Squad = model("Squad", squadSchema);

export default Squad;
