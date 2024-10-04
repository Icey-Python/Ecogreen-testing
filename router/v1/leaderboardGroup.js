import { Router } from "express";
import { getUserLeaderboard, getSquadLeaderBoard } from "../../controllers/leaderboard.Controller.js";
import { userAdminAuth } from "../../middleware/userAdminAuth.js";

const router = Router();

router.get("/users/donations", userAdminAuth, getUserLeaderboard);
router.get("/squads/donations", userAdminAuth,getSquadLeaderBoard);

export default router;
