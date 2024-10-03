import { model, Schema } from "mongoose";

const subscriptionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  frequency: {
    type: String,
    enum: ["daily", "weekly", "monthly"], 
    required: true,
  },
  nextDeliveryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
});

const Subscription = model("Subscription", subscriptionSchema);
export default Subscription;