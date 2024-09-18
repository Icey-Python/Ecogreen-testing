import { model, Schema } from "mongoose";

//role based access [default: admin, superAdmin]
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
    },
    role: {
      type: String,
      enum: ["admin", "superAdmin"],
      default: "admin",
    },
  },
  { timestamps: true }
);

const Admin = model("Admin", AdminSchema);

export default Admin;
