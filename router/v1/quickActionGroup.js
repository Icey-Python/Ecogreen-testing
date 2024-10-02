import { Router } from "express";
import { userAuth } from "../../middleware/userAuth.js";
import { buyAirtime, sendSMS } from "../../controllers/quickAction.Controller.js";
const router = Router();
router.post('/airtime', userAuth,buyAirtime)
router.post('/sms', userAuth, sendSMS)
export default router;
