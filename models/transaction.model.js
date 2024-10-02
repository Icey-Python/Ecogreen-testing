import { Schema, model } from "mongoose";

const transactionSchema = new Schema({
  initiator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reference: {
    type: Schema.Types.ObjectId,
    refPath: 'referenceModel',  // Dynamically refer to the appropriate model
    required: true
  },
  referenceModel: {
    type: String,
    enum: ['Product', 'Deposit', 'Withdraw', 'Donation'],  // Add all relevant models
    required: function() {
      return ['purchase', 'deposit', 'withdraw', 'donate'].includes(this.type);
    }
  },
  type: {
    type: String,
    enum: ['deposit', 'withdraw', 'purchase', 'donate'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const Transaction = model('Transaction', transactionSchema);
export default Transaction;

