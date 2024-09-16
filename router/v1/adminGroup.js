import { Router } from "express";
import { loginAdmin, signUpAdmin } from "../../controllers/admin.Controller.js";

const router = Router();

router.post("/signup",signUpAdmin)
router.post("/login",loginAdmin)


export default router;