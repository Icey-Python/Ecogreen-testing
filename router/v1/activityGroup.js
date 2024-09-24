import { Router } from "express";
import Activity from "../../models/activity.model.js";
import { calculatePercentage, calculateProgress, getMaxThreshold, getTotalActivities, registerActivity } from "../../controllers/activity.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";
import { userAdminAuth } from "../../middleware/userAdminAuth.js";



const router = Router();

router.post("/register",userAuth, registerActivity );
router.get("/max-threshold",userAuth, getMaxThreshold );
router.get("/total",userAdminAuth, getTotalActivities );
router.get("/percentage",userAuth, calculatePercentage)
router.get('/progress',userAuth, calculateProgress);


export default router;
