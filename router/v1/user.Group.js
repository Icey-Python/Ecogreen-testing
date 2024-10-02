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
  movePoints,
  getTransactionHistory
} from "../../controllers/user.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";
import { adminAuth } from "../../middleware/adminAuth.js";
import multer from 'multer'

const upload = multer();
const router = Router();

router.post("/signup", signUpUser);
router.post("/login", loginUser);
router.put("/update", userAuth,upload.single('image'),updateUserById);
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
router.post("/points/move", userAuth, movePoints);
router.get('/transaction/history',userAuth,getTransactionHistory)
export default router;
