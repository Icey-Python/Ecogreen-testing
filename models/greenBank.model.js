import { model, Schema } from "mongoose";

const greenBankSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  points: {
    type: Number,
    required: true,
    default: 0,
  },
  description: {
    type: String,
    default: 'Extra donation points supporting environmental causes',
  },
  
});

const GreenBank = model('GreenBank', greenBankSchema);
export default GreenBank;
