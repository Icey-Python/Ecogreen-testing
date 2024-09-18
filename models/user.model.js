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
        required:true
    },
    squads:[{
      type: Schema.Types.ObjectId,
      ref:"Squad"
    }],
    balance:{
      type:Number,
      default:0
    },
    donations:{
      type:Number,
      default:0
    }
  },
  { timestamps: true }
);

const User = model("User", UserSchema);

export default User;
