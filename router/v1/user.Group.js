import { Router } from "express";
import {
  signUpUser,
  loginUser,
  updateUserById,
  deleteUserById,
  updateUserPassword,
  getAllUsers,
} from "../../controllers/user.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();

router.post("/signup", signUpUser);
router.post("/login", loginUser);
router.put("/:id", userAuth, updateUserById);
router.put("/password/:id", userAuth, updateUserPassword);
router.delete("delete/:id", deleteUserById);
router.get("/users", adminAuth, getAllUsers);

export default router;
