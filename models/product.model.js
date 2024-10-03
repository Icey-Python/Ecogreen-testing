import { model, Schema } from "mongoose";

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    image: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    quantity :{
        type: Number,
        required:true
    },
    flashSalePrice: {
      type: Number,
      default :null,
    },
    flashSaleStart :{
      type: Date,
      default:null,
    },
    flashSaleEnd : {
      type:Date,
      default: null,
    },
    category: {
      type: String,
      required: true,  
    },
    purchaseCount: {
      type: Number,
      default: 0,
    },
    subscriptionAvailable: {
      type: Boolean,
      required: true,
      default: false, 
    },
  
  },
  { timestamps: true }
);

const Product = model("Product", ProductSchema);

export default Product;
