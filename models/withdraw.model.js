import { model, Schema } from "mongoose";

const withdrawSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  systemAmount: {
     type: Number, 
     required: true, 
    },
  phone: {
    type: String,
    required: true,
  },
  initiatorId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  transactionId: String,
  conversationId: String,
  resultDesc: String,
  
},
{ timestamps: true },
);

const Withdraw = model('Withdraw', withdrawSchema);

export default Withdraw;
