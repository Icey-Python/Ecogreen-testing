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
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    resetPasswordToken: {
       type: String 
      },
    resetPasswordExpires: {
       type: Date
      },
  },
  { timestamps: true }
);

const User = model("User", UserSchema);

export default User;
