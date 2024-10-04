import { Schema, model } from 'mongoose'

const transactionSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  receiver: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  amount: {
    type: Number,
    required: true,
  },
  description:{
    type: String,
    required: true,
    default: "Transaction"
  },
})

const Transaction = model('Transaction', transactionSchema)
export default Transaction
