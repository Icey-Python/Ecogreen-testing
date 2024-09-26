import { Router } from "express";
import { generateToken } from "../../middleware/genToken.js";
import {
  callback,
  stkPush,
  withdrawToMpesa,
  b2cTimeoutCallback,
  b2cResultCallback,
} from "../../controllers/mpesaPay.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";
const router = Router();

router.post("/stk", userAuth, generateToken, stkPush);
router.post("/callback", callback);
router.post("/withdraw", userAuth, generateToken, withdrawToMpesa);
router.post("/b2c/result", b2cResultCallback);
router.post("/b2c/timeout", b2cTimeoutCallback);
export default router;
