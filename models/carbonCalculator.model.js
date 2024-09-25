// models/CarbonCalculator.js
import {Schema, model} from 'mongoose';

// Define the Carbon Calculator Schema
const CarbonCalculatorSchema = new Schema({
  squad_id: {
    type: Schema.Types.ObjectId, 
    ref: 'Squad', 
    required: true,
    unique: true, 
  },
  carbon_footprint: {
    type: Number,
    required: true,
  },
  threshold: {
    type: Number,
    required: true,
  },
  badge_earned: {
    type: Boolean,
    default: false,
  },
});

// Create and export the model
const CarbonCalculator = model('CarbonCalculator', CarbonCalculatorSchema);
export default CarbonCalculator;

