import { Router } from "express";
import { getAllUsersDonations } from "../../controllers/leaderboard.Controller.js";
import { userAdminAuth } from "../../middleware/userAdminAuth.js";

const router = Router();

router.get("/users/donations", userAdminAuth, getAllUsersDonations);

export default router;
