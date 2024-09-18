import { Router } from "express";
import { createAdmin, loginAdmin, updateAdminById, updateAdminPasswordById, deleteAdminById, getAllAdmins, getAllUsers, deleteSquadById, deleteProductById, deactivateProductById, activateProductById } from "../../controllers/admin.Controller.js";
import { adminAuth } from "../../middleware/adminAuth.js";

const router = Router();

router.post("/login",loginAdmin)
router.post("/create",adminAuth,createAdmin)
router.put("/update/:id",adminAuth,updateAdminById)
router.put("/password/:id",adminAuth,updateAdminPasswordById)
router.delete("/delete/:id",adminAuth,deleteAdminById)
router.get("/all",adminAuth, getAllAdmins)
router.get("/users",adminAuth, getAllUsers)
router.delete("/delete/squad/:id",adminAuth,deleteSquadById)
router.delete("/delete/product/:id",adminAuth,deleteProductById)
router.put("/deactivate/product/:id",adminAuth,deactivateProductById)
router.put("/activate/product/:id", adminAuth, activateProductById)

export default router;
