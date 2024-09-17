import { Router } from "express";
import { signUpUser,loginUser } from "../../controllers/user.Controller.js";

const router = Router();

router.post("/signup",signUpUser)
router.post("/login",loginUser)

export default router;