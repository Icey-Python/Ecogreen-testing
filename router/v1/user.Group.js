import { Router } from "express";
import { signUpUser } from "../../controllers/user.Controller.js";

const router = Router();

router.post("/signup",signUpUser)


export default router;