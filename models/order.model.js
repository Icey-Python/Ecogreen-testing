import { model, Schema} from "mongoose";
//seller id, buyer id, product id, amount, status
const OrderSchema = new Schema(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    amount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = model("Order", OrderSchema);

export default Order;
