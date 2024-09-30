import { model, Schema } from "mongoose";

const donationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pointsDonated: {
      type: Number,
      required: true,
    },
    requiredAmount: {  
      type: Number,
      required: true,
    },
    amountDonated: {  
      type: Number,
      default: 0,
    },
    cause: {
      type: String,
      required: true,
    },
    recurring: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    lastDonationDate: { 
      type: Date, 
      default: Date.now 
    },
  },
  { timestamps: true }
);

const Donation = model("Donation", donationSchema);

export default Donation;
