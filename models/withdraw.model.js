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
  recepient: {
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

const Withdraw = model('Withdraw', withdrawSchema);

export default Withdraw;
