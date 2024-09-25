import { Router } from "express";
import { generateToken } from "../../middleware/genToken.js";
import { callback, stkPush } from "../../controllers/mpesaPay.Controller.js";

const router = Router();

router.post("/stk", generateToken, stkPush);
router.post("/callback", callback);

export default router;
