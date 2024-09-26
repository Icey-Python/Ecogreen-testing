import { Router } from "express";
import { generateToken } from "../../middleware/genToken.js";
import { callback, stkPush ,withdrawToMpesa,mpesaWithdrawalCallback} from "../../controllers/mpesaPay.Controller.js";

const router = Router();

router.post("/stk", generateToken, stkPush);
router.post("/callback", callback);
router.post("/withdraw", withdrawToMpesa);
router.post("/withdraw/callback", mpesaWithdrawalCallback);

export default router;
