import { Router } from "express";
import {
  signUpUser,
  loginUser,
  updateUserById,
  deleteUserById,
  updateUserPassword,
} from "../../controllers/user.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";

const router = Router();

router.post("/signup", signUpUser);
router.post("/login", loginUser);
router.put("/:id", userAuth, updateUserById);
router.put("/password/:id", userAuth, updateUserPassword);
router.delete("delete/:id", deleteUserById);

export default router;
