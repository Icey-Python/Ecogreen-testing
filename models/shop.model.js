import { Schema, model } from 'mongoose';

const ShopSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String, // Defines the GeoJSON type, which must be 'Point'
      enum: ['Point'], 
      default: 'Point',// Restricts the type to 'Point' only
      required: true,
    },
    coordinates: {
      type: [Number], // Array of numbers: [longitude, latitude]
      required: true,
    },
  },
  contact: {
    type: String,
    required: true,
  },
});

// Create a 2dsphere index to enable geospatial queries
ShopSchema.index({ location: '2dsphere' });

const Shop = model('Shop', ShopSchema);
export default Shop;

