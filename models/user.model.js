import { model, Schema} from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    password:{
        type:String,
        required:true,
    },
    squads:[{
      type: Schema.Types.ObjectId,
      ref:"Squad"
    }],
    saves:[{
      type: Schema.Types.ObjectId,
      ref:"Post"
    }],
    balance:{
      type:Number,
      default:0
    },
    donations:{
      type:Number,
      default:0
    },
    connections:[
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    connectionRequests: [
      {
        from: { type: Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["pending", "approved"], default: "pending" },
      },
    ],
    cart: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, required: true },
      },
    ],
    //token:string, expires: timestamp -> default time 5 mins  
    resetDetails: {
      token: String,
      expires: Date,
    },
    //2FA 
    authDetails: {
      token: String,
      expires: Date,
    },
    //emailVerified:boolean
    emailVerified: {
      type: Boolean,
      default: false,
    },
    contact: {
      type: String,
    },
    location:{
      latitude: Number,
      longitude: Number
    }
  },
  { timestamps: true }
);

const User = model("User", UserSchema);

export default User;
