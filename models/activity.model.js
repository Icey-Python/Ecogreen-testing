import { Schema, model } from "mongoose";

const ActivitySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  renewableEnergy: {
    type: Number,
    default: 0,
  },
  entrepreneurship: {
    type: Number,
    default: 0,
  },
  climateActions: {
    type: Number,
    default: 0,
  },
  treePlanting: {
    type: Number,
    default: 0,
  },
  sustainableActivities: {
    type: Number,
    default: 0,
  },
  ecoGreenMovements: {
    type: Number,
    default: 0,
  },
});

const Activity = model("Activity", ActivitySchema);

export default Activity;
