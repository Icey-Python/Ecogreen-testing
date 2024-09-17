import { Router } from "express";
import { signUpUser,loginUser,updateUserById,deleteUserById } from "../../controllers/user.Controller.js";

const router = Router();

router.post("/signup",signUpUser)
router.post("/login",loginUser)
router.put("/:id", updateUserById)
router.delete("/:id", deleteUserById)

export default router;