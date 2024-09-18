import { Router } from "express";
import { createAdmin, loginAdmin, updateAdminById } from "../../controllers/admin.Controller.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();

router.post("/create",adminAuth,createAdmin)
router.post("/login",loginAdmin)
router.put("/update/:id",adminAuth,updateAdminById)

export default router;
