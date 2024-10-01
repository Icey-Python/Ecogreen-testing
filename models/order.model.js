import { model, Schema} from "mongoose";
//seller id, buyer id, product id, amount, status
const OrderSchema = new Schema(
  {
    sellerId: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    products: [{
      type: Schema.Types.ObjectId,
      ref: "Product",
    }],
    amount: {
      type: Number,
    },
  },
  { timestamps: true }
);

const Order = model("Order", OrderSchema);

export default Order;
