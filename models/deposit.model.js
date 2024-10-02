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
  phone: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  transactionDate:{
    type: Date,
  }  
  
},
    { timestamps: true },
);

const Deposit = model('Deposit', depositSchema);

export default Deposit;
