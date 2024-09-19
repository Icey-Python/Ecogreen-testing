//product id, reporter id, message 

import { model, Schema } from "mongoose";

const ReportSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

const Report = model("Report", ReportSchema);

export default Report;
