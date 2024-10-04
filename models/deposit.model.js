import { model, Schema } from "mongoose";

const depositSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  reference: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  }, 
},
    { timestamps: true },
);

const Deposit = model('Deposit', depositSchema);

export default Deposit;
