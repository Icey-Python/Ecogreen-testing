import { Router } from "express";
import { getAllUsersDonations, getDonationsBySquads } from "../../controllers/leaderboard.Controller.js";
import { userAdminAuth } from "../../middleware/userAdminAuth.js";

const router = Router();

router.get("/users/donations", userAdminAuth, getAllUsersDonations);
router.get("/squads/donations", userAdminAuth,getDonationsBySquads );

export default router;
