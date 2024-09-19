import { Router } from "express";
import { userAuth } from "../../middleware/userAuth.js";
import { createReport, deleteReport, findReport, findReports } from "../../controllers/report.Controller.js";


const router = Router();

router.post("/create", userAuth, createReport);
router.delete("/delete/:id", userAuth, deleteReport);
router.get("/find/one/:id", userAuth, findReport);
router.get("/find/all", userAuth, findReports);

export default router;
