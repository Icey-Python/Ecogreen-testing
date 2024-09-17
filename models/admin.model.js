import { model, Schema } from "mongoose";

const AdminSchema = new Schema(
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
    }
  },
  { timestamps: true }
);

const Admin = model("Admin", AdminSchema);

export default Admin;