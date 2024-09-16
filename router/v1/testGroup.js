import { Router } from "express";
import { testingController } from "../../controllers/test.Controller.js";

const router = Router()

router.get("/testing",testingController)


export default router;