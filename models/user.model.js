import { model, Schema, Types } from "mongoose";

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
    }]
  },
  { timestamps: true }
);

const User = model("User", UserSchema);

export default User;
