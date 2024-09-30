import { Router } from "express";
import {
  signUpUser,
  loginUser,
  updateUserById,
  deleteUserById,
  updateUserPassword,
  getAllUsers,
  requestConnection,
  approveConnection,
  forgotPasswordOtp,
  sendOtp,
  verifyOtp,
  resetPassword,
  getRefferalCode,
  sendPoints,
} from "../../controllers/user.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();

router.post("/signup", signUpUser);
router.post("/login", loginUser);
router.put("/update/:id", userAuth, updateUserById);
router.put("/password/:id", userAuth, updateUserPassword);
router.delete("/delete/:id",adminAuth, deleteUserById);
router.get("/all", adminAuth, getAllUsers);
router.post("/connect/request/:recipientUserId", userAuth, requestConnection);
router.put("/connect/approve/:requestingUserId", userAuth, approveConnection);
router.put("/reset/password/otp", forgotPasswordOtp);
router.put("/reset/password/new", resetPassword);
router.post("/otp", sendOtp);//2FA
router.post("/otp/verify", verifyOtp);//2FA 
router.get("/get/reffer", userAuth, getRefferalCode);
router.post("/transact/send", userAuth, sendPoints);
export default router;
